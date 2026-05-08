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
    const supabase = await createServerSupabaseClient();

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

    const ticketCode = await generateUniqueTicketCode();

    const uploadedScreenshots = await Promise.all(
      screenshotFiles.map((file) =>
        uploadScreenshotFile({
          supabase,
          file,
          userId: workspaceContext.user.id,
          workspaceId: workspaceContext.workspace.id,
          ticketCode,
        })
      )
    );

    const uploadedLogs = await Promise.all(
      logFiles.map((file) =>
        uploadLogFile({
          supabase,
          file,
          userId: workspaceContext.user.id,
          workspaceId: workspaceContext.workspace.id,
          ticketCode,
        })
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
      console.warn("[submit-bug] AI triage fallback", getSafeErrorMessage(error));
    }

    await createTicket({
      code: ticketCode,
      workspaceId: workspaceContext.workspace.id,
      projectId: workspaceContext.project.id,
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
    });

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

    console.error("[submit-bug] failed to create ticket", getSafeErrorMessage(error));

    return {
      ok: false,
      error: "We couldn't create the ticket right now. Please try again.",
    };
  }
}
