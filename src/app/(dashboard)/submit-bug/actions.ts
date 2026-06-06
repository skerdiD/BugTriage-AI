"use server";

import { request as getArcjetRequest } from "@arcjet/next";
import { AttachmentType, TicketSeverity, TicketStatus } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

import {
  AuthenticationError,
  getCurrentWorkspaceContextOrThrow,
} from "@/lib/auth/session";
import { DEMO_READ_ONLY_MESSAGE, isDemoUser } from "@/lib/demo";
import {
  analyzeBugReportWithGemini,
  AI_TRIAGE_MAX_LOG_BYTES_PER_FILE,
  type BugTriageAiOutput,
  getPublicAiTriageFailureMessage,
} from "@/lib/ai/bug-triage";
import {
  createTicket,
  generateUniqueTicketCode,
} from "@/lib/data/tickets";
import { createAndStoreTicketEmbedding } from "@/lib/data/similar-issues";
import {
  bugSubmissionProtection,
  getArcjetDeniedMessage,
  logArcjetError,
} from "@/lib/security/arcjet";
import { getSafeErrorMessage } from "@/lib/security/redaction";
import {
  addServerBreadcrumb,
  captureServerException,
  withServerSpan,
} from "@/lib/observability/server-monitoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  deleteUploadedTicketFiles,
  MAX_TOTAL_TICKET_UPLOAD_BYTES,
  MAX_UPLOAD_FILES_PER_TYPE,
  TicketStorageError,
  type UploadedTicketFile,
  uploadLogFile,
  uploadScreenshotFile,
} from "@/lib/supabase/storage";
import { bugReportFormSchema } from "@/lib/validation/bug-report";

type CreateBugTicketActionResult =
  | {
      ok: true;
      ticketCode: string;
      aiFailed: boolean;
      warning?: string;
    }
  | {
      ok: false;
      error: string;
    };

const AI_PROVIDER_NAME = "google-gemini";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => {
      return typeof value !== "string" && value.size > 0;
    });
}

function getTotalUploadBytes(files: File[]) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

function mapAiSeverityToDbSeverity(severity?: BugTriageAiOutput["severity"]) {
  if (!severity) return TicketSeverity.MEDIUM;

  const map: Record<BugTriageAiOutput["severity"], TicketSeverity> = {
    LOW: TicketSeverity.LOW,
    MEDIUM: TicketSeverity.MEDIUM,
    HIGH: TicketSeverity.HIGH,
    CRITICAL: TicketSeverity.CRITICAL,
  };

  return map[severity];
}

function mapAttachmentType(type: UploadedTicketFile["attachmentType"]) {
  const map: Record<UploadedTicketFile["attachmentType"], AttachmentType> = {
    SCREENSHOT: AttachmentType.SCREENSHOT,
    LOG: AttachmentType.LOG,
    OTHER: AttachmentType.OTHER,
  };

  return map[type];
}

async function readLogFiles(files: File[]) {
  const chunks = await Promise.all(
    files.map(async (file) => {
      const text = await file.slice(0, AI_TRIAGE_MAX_LOG_BYTES_PER_FILE).text();

      return `
File: ${file.name}
${text.slice(0, 12_000)}
`;
    })
  );

  return chunks.join("\n\n").slice(0, 20_000);
}

async function uploadTicketFilesSequentially(input: {
  storageSupabase: ReturnType<typeof createSupabaseAdminClient>;
  files: File[];
  userId: string;
  workspaceId: string;
  ticketCode: string;
  upload: (input: {
    supabase: ReturnType<typeof createSupabaseAdminClient>;
    file: File;
    userId: string;
    workspaceId: string;
    ticketCode: string;
  }) => Promise<UploadedTicketFile>;
}) {
  const uploadedFiles: UploadedTicketFile[] = [];

  try {
    for (const file of input.files) {
      uploadedFiles.push(
        await input.upload({
          supabase: input.storageSupabase,
          file,
          userId: input.userId,
          workspaceId: input.workspaceId,
          ticketCode: input.ticketCode,
        })
      );
    }

    return uploadedFiles;
  } catch (error) {
    await deleteUploadedTicketFiles(input.storageSupabase, uploadedFiles);
    throw error;
  }
}

function isTicketStorageFailure(
  error: unknown
): error is Error & { userMessage: string } {
  return (
    error instanceof Error &&
    error.name === "TicketStorageError" &&
    "userMessage" in error &&
    typeof error.userMessage === "string"
  );
}

function recordBugSubmissionMetric(
  result: "validation_error" | "blocked" | "created" | "failed",
  attributes: Record<string, string | number | boolean | undefined> = {}
) {
  Sentry.metrics.count("bug_submission", 1, {
    attributes: {
      result,
      ...attributes,
    },
  });
}

export async function analyzeAndCreateTicketAction(
  formData: FormData
): Promise<CreateBugTicketActionResult> {
  const parsed = bugReportFormSchema.safeParse({
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    stepsToReproduce: getString(formData, "stepsToReproduce"),
    expectedBehavior: getString(formData, "expectedBehavior"),
    actualBehavior: getString(formData, "actualBehavior"),
    browser: getString(formData, "browser"),
    device: getString(formData, "device"),
    environment: getString(formData, "environment"),
    affectedPage: getString(formData, "affectedPage"),
    consoleLogs: getString(formData, "consoleLogs"),
  });

  if (!parsed.success) {
    recordBugSubmissionMetric("validation_error", {
      reason: "invalid_form",
    });

    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please check the form fields and try again.",
    };
  }

  try {
    const workspaceContext = await getCurrentWorkspaceContextOrThrow();
    if (isDemoUser(workspaceContext.user)) {
      return { ok: false, error: DEMO_READ_ONLY_MESSAGE };
    }
    if (!workspaceContext.project) {
      recordBugSubmissionMetric("validation_error", {
        reason: "missing_project",
        workspaceId: workspaceContext.workspace.id,
      });

      return {
        ok: false,
        error:
          "Create a project for this workspace in Settings before submitting bug tickets.",
      };
    }
    const project = workspaceContext.project;
    addServerBreadcrumb({
      category: "ticket",
      message: "Starting bug submission action.",
      data: {
        action: "submit-bug",
        workspaceId: workspaceContext.workspace.id,
        projectId: project.id,
      },
    });

    const arcjetRequest = await getArcjetRequest();
    const arcjetDecision = await bugSubmissionProtection.protect(arcjetRequest, {
      userId: workspaceContext.user.id,
    });

    logArcjetError("submit-bug", arcjetDecision);

    if (arcjetDecision.isDenied()) {
      recordBugSubmissionMetric("blocked", {
        reason: "arcjet",
        workspaceId: workspaceContext.workspace.id,
        projectId: project.id,
      });

      return {
        ok: false,
        error: getArcjetDeniedMessage(
          arcjetDecision,
          "Bug submission blocked by application security."
        ),
      };
    }

    const screenshotFiles = getFiles(formData, "screenshots");
    const logFiles = getFiles(formData, "logs");
    const allFiles = [...screenshotFiles, ...logFiles];

    if (screenshotFiles.length > MAX_UPLOAD_FILES_PER_TYPE) {
      recordBugSubmissionMetric("validation_error", {
        reason: "too_many_screenshots",
        workspaceId: workspaceContext.workspace.id,
        projectId: project.id,
      });

      return {
        ok: false,
        error: `You can upload up to ${MAX_UPLOAD_FILES_PER_TYPE} screenshots per ticket.`,
      };
    }

    if (logFiles.length > MAX_UPLOAD_FILES_PER_TYPE) {
      recordBugSubmissionMetric("validation_error", {
        reason: "too_many_logs",
        workspaceId: workspaceContext.workspace.id,
        projectId: project.id,
      });

      return {
        ok: false,
        error: `You can upload up to ${MAX_UPLOAD_FILES_PER_TYPE} log files per ticket.`,
      };
    }

    if (getTotalUploadBytes(allFiles) > MAX_TOTAL_TICKET_UPLOAD_BYTES) {
      recordBugSubmissionMetric("validation_error", {
        reason: "upload_too_large",
        workspaceId: workspaceContext.workspace.id,
        projectId: project.id,
      });

      return {
        ok: false,
        error: "Combined uploads must be 20MB or smaller per ticket.",
      };
    }

    let storageSupabase: ReturnType<typeof createSupabaseAdminClient> | null = null;

    if (allFiles.length > 0) {
      try {
        storageSupabase = createSupabaseAdminClient();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[submit-bug] Supabase storage admin client failed", {
            message: getSafeErrorMessage(error),
          });
        }

        throw new TicketStorageError(
          "Supabase Storage admin client could not be created.",
          "Attachment storage is not configured. Check the server Supabase environment variables and try again."
        );
      }
    }

    const ticketCode = await withServerSpan(
      {
        name: "ticket.generate-code",
        op: "db.ticket.generate-code",
        context: {
          workspaceId: workspaceContext.workspace.id,
          projectId: project.id,
        },
      },
      () => generateUniqueTicketCode()
    );

    const uploadedFiles: UploadedTicketFile[] = [];

    if (storageSupabase) {
      try {
        uploadedFiles.push(
          ...(await withServerSpan(
            {
              name: "ticket.upload-screenshots",
              op: "storage.batch-upload",
              context: {
                workspaceId: workspaceContext.workspace.id,
                projectId: project.id,
                ticketCode,
                fileCount: screenshotFiles.length,
                attachmentType: "SCREENSHOT",
              },
            },
            () =>
              uploadTicketFilesSequentially({
                storageSupabase,
                files: screenshotFiles,
                userId: workspaceContext.user.id,
                workspaceId: workspaceContext.workspace.id,
                ticketCode,
                upload: uploadScreenshotFile,
              })
          ))
        );

        uploadedFiles.push(
          ...(await withServerSpan(
            {
              name: "ticket.upload-logs",
              op: "storage.batch-upload",
              context: {
                workspaceId: workspaceContext.workspace.id,
                projectId: project.id,
                ticketCode,
                fileCount: logFiles.length,
                attachmentType: "LOG",
              },
            },
            () =>
              uploadTicketFilesSequentially({
                storageSupabase,
                files: logFiles,
                userId: workspaceContext.user.id,
                workspaceId: workspaceContext.workspace.id,
                ticketCode,
                upload: uploadLogFile,
              })
          ))
        );
      } catch (error) {
        await deleteUploadedTicketFiles(storageSupabase, uploadedFiles);
        throw error;
      }
    }

    let aiOutput: BugTriageAiOutput | null = null;
    let aiErrorMessage = "";

    try {
      const uploadedLogText = await readLogFiles(logFiles);

      aiOutput = await analyzeBugReportWithGemini({
        report: parsed.data,
        logText: uploadedLogText,
        attachmentNames: uploadedFiles.map((file) => file.fileName),
      });
    } catch (error) {
      aiErrorMessage = getPublicAiTriageFailureMessage(error);
      addServerBreadcrumb({
        category: "ai",
        level: "warning",
        message: "AI triage fell back to manual ticket creation.",
        data: {
          action: "ticket-analysis-fallback",
          provider: AI_PROVIDER_NAME,
          ticketCode,
          workspaceId: workspaceContext.workspace.id,
          projectId: project.id,
          screenshotCount: screenshotFiles.length,
          logFileCount: logFiles.length,
          hasConsoleLogs: Boolean(parsed.data.consoleLogs),
        },
      });
      if (process.env.NODE_ENV === "development") {
        console.warn("[submit-bug] AI triage fallback", getSafeErrorMessage(error));
      }
    }

    let createdTicket: Awaited<ReturnType<typeof createTicket>>;

    try {
      createdTicket = await withServerSpan(
        {
          name: "ticket.create",
          op: "db.ticket.create",
          context: {
            workspaceId: workspaceContext.workspace.id,
            projectId: project.id,
            ticketCode,
            attachmentCount: uploadedFiles.length,
            aiFailed: !aiOutput,
          },
        },
        () =>
          createTicket({
            code: ticketCode,
            workspaceId: workspaceContext.workspace.id,
            projectId: project.id,
            reporterId: workspaceContext.user.id,
            title: aiOutput?.improvedTitle ?? parsed.data.title,
            description: parsed.data.description,
            expectedBehavior: parsed.data.expectedBehavior,
            actualBehavior: parsed.data.actualBehavior,
            stepsToReproduce: parsed.data.stepsToReproduce,
            browser: parsed.data.browser,
            device: parsed.data.device,
            environment: parsed.data.environment,
            affectedPage: parsed.data.affectedPage,
            severity: mapAiSeverityToDbSeverity(aiOutput?.severity),
            status: TicketStatus.NEW,
            category: aiOutput?.category ?? "Manual Review",
            priorityScore: aiOutput?.priorityScore ?? null,
            aiConfidence: aiOutput?.confidenceScore ?? null,
            aiAnalysis: aiOutput
              ? {
                  summary: aiOutput.summary,
                  likelyCause: aiOutput.likelyCause,
                  suggestedFix: aiOutput.suggestedFix,
                  reproductionSteps: aiOutput.reproductionSteps,
                  tags: aiOutput.tags,
                  confidenceScore: aiOutput.confidenceScore,
                  rawAiResponse: {
                    ...aiOutput,
                    developerTask: aiOutput.developerTask,
                  },
                }
              : undefined,
            attachments: uploadedFiles.map((file) => ({
              filename: file.fileName,
              fileType: file.fileType,
              fileSize: file.fileSize,
              storagePath: file.storagePath,
              url: null,
              attachmentType: mapAttachmentType(file.attachmentType),
            })),
          })
      );
    } catch (error) {
      if (storageSupabase) {
        await deleteUploadedTicketFiles(storageSupabase, uploadedFiles);
      }
      throw error;
    }

    try {
      await withServerSpan(
        {
          name: "ticket.embedding.create",
          op: "ai.embedding",
          context: {
            workspaceId: workspaceContext.workspace.id,
            projectId: project.id,
            ticketCode,
          },
        },
        () =>
          createAndStoreTicketEmbedding({
            ticketId: createdTicket.id,
            workspaceId: workspaceContext.workspace.id,
            projectId: project.id,
            source: {
              title: aiOutput?.improvedTitle ?? parsed.data.title,
              description: parsed.data.description,
              expectedBehavior: parsed.data.expectedBehavior,
              actualBehavior: parsed.data.actualBehavior,
              stepsToReproduce: parsed.data.stepsToReproduce,
              browser: parsed.data.browser,
              device: parsed.data.device,
              environment: parsed.data.environment,
              affectedPage: parsed.data.affectedPage,
              aiSummary: aiOutput?.summary,
            },
          })
      );
    } catch (error) {
      addServerBreadcrumb({
        category: "ai",
        level: "warning",
        message: "Ticket embedding generation failed after ticket creation.",
        data: {
          action: "ticket-embedding-fallback",
          provider: AI_PROVIDER_NAME,
          ticketCode,
          workspaceId: workspaceContext.workspace.id,
          projectId: project.id,
        },
      });
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[submit-bug] ticket embedding fallback",
          getSafeErrorMessage(error)
        );
      }
    }

    recordBugSubmissionMetric("created", {
      aiFailed: !aiOutput,
      workspaceId: workspaceContext.workspace.id,
      projectId: project.id,
      screenshotCount: screenshotFiles.length,
      logFileCount: logFiles.length,
    });

    return {
      ok: true,
      ticketCode,
      aiFailed: !aiOutput,
      warning: aiOutput
        ? undefined
        : `Ticket was created, but ${aiErrorMessage}`,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      recordBugSubmissionMetric("failed", {
        reason: "authentication",
      });

      return {
        ok: false,
        error: "You must be signed in before creating a bug ticket.",
      };
    }

    if (isTicketStorageFailure(error)) {
      recordBugSubmissionMetric("failed", {
        reason: "storage",
      });

      return {
        ok: false,
        error: error.userMessage,
      };
    }

    captureServerException(error, {
      area: "tickets",
      action: "submit-bug",
      message: "[submit-bug] failed to create ticket",
    });

    recordBugSubmissionMetric("failed", {
      reason: "unexpected",
    });

    return {
      ok: false,
      error: "We couldn't create the ticket right now. Please try again.",
    };
  }
}
