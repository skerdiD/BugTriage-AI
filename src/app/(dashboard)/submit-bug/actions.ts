"use server";

import { request as getArcjetRequest } from "@arcjet/next";
import { AttachmentType, TicketSeverity, TicketStatus } from "@prisma/client";

import {
  AuthenticationError,
  getCurrentWorkspaceContextOrThrow,
} from "@/lib/auth/session";
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
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MAX_UPLOAD_FILES_PER_TYPE,
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
      uploadedFiles: UploadedTicketFile[];
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
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please check the form fields and try again.",
    };
  }

  try {
    const workspaceContext = await getCurrentWorkspaceContextOrThrow();
    if (!workspaceContext.project) {
      return {
        ok: false,
        error:
          "Create a project for this workspace in Settings before submitting bug tickets.",
      };
    }
    const project = workspaceContext.project;
    const supabase = await createServerSupabaseClient();
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

    if (screenshotFiles.length > MAX_UPLOAD_FILES_PER_TYPE) {
      return {
        ok: false,
        error: `You can upload up to ${MAX_UPLOAD_FILES_PER_TYPE} screenshots per ticket.`,
      };
    }

    if (logFiles.length > MAX_UPLOAD_FILES_PER_TYPE) {
      return {
        ok: false,
        error: `You can upload up to ${MAX_UPLOAD_FILES_PER_TYPE} log files per ticket.`,
      };
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

    const uploadedScreenshots = await withServerSpan(
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
        Promise.all(
          screenshotFiles.map((file) =>
            uploadScreenshotFile({
              supabase,
              file,
              userId: workspaceContext.user.id,
              workspaceId: workspaceContext.workspace.id,
              ticketCode,
            })
          )
        )
    );

    const uploadedLogs = await withServerSpan(
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
        Promise.all(
          logFiles.map((file) =>
            uploadLogFile({
              supabase,
              file,
              userId: workspaceContext.user.id,
              workspaceId: workspaceContext.workspace.id,
              ticketCode,
            })
          )
        )
    );

    const uploadedFiles = [...uploadedScreenshots, ...uploadedLogs];

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
      console.warn("[submit-bug] AI triage fallback", getSafeErrorMessage(error));
    }

    await withServerSpan(
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

    return {
      ok: true,
      ticketCode,
      aiFailed: !aiOutput,
      warning: aiOutput
        ? undefined
        : `Ticket was created, but ${aiErrorMessage}`,
      uploadedFiles,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return {
        ok: false,
        error: "You must be signed in before creating a bug ticket.",
      };
    }

    if (isTicketStorageFailure(error)) {
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

    return {
      ok: false,
      error: "We couldn't create the ticket right now. Please try again.",
    };
  }
}
