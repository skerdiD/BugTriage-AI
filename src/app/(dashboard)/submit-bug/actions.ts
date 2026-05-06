"use server";

import { AttachmentType, TicketSeverity, TicketStatus } from "@prisma/client";

import {
  analyzeBugReportWithGemini,
  type BugTriageAiOutput,
} from "@/lib/ai/bug-triage";
import {
  createTicket,
  generateUniqueTicketCode,
} from "@/lib/data/tickets";
import { ensureUserWorkspace } from "@/lib/data/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
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

function normalizeNameFromUserMetadata(metadata: Record<string, unknown>) {
  const fullName = metadata.full_name;
  const name = metadata.name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof name === "string" && name.trim()) return name;

  return null;
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
      const text = await file.text();

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
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        ok: false,
        error: "You must be signed in before creating a bug ticket.",
      };
    }

    const workspaceContext = await ensureUserWorkspace({
      authUserId: user.id,
      email: user.email,
      name: normalizeNameFromUserMetadata(user.user_metadata),
    });

    const screenshotFiles = getFiles(formData, "screenshots");
    const logFiles = getFiles(formData, "logs");

    const ticketCode = await generateUniqueTicketCode();

    const uploadedScreenshots = await Promise.all(
      screenshotFiles.map((file) =>
        uploadScreenshotFile({
          supabase,
          file,
          userId: user.id,
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
          userId: user.id,
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
      aiErrorMessage =
        error instanceof Error
          ? error.message
          : "AI analysis failed, so the ticket was created manually.";
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
        : `Ticket was created, but AI analysis failed: ${aiErrorMessage}`,
      uploadedFiles,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the ticket.",
    };
  }
}