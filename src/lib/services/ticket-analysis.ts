import "server-only";

import {
  AiProcessingStatus,
  Prisma,
  TicketActivityType,
} from "@prisma/client";
import { z } from "zod";

import {
  AiTriageError,
  analyzeBugReportWithGemini,
  bugTriageAiOutputSchema,
  type BugTriageAiOutput,
} from "@/lib/ai/bug-triage";
import {
  createAndStoreTicketEmbedding,
  findSimilarIssuesForTicket,
} from "@/lib/data/similar-issues";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { prisma } from "@/lib/prisma";
import { prepareTicketAnalysisDispatch } from "@/lib/queue/ticket-analysis-outbox";
import { getSafeErrorMessage } from "@/lib/security/redaction";
import { bugReportFormSchema } from "@/lib/validation/bug-report";

const PROCESSING_LEASE_MS = 60_000;
const MAX_PROCESSING_ERROR_LENGTH = 500;

const aiInputContextSchema = z
  .object({
    consoleLogs: z.string().max(8_000).optional(),
    uploadedLogText: z.string().max(20_000).optional(),
  })
  .partial();

export class TicketAnalysisPermanentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TicketAnalysisPermanentError";
  }
}

export function isRetryableTicketAnalysisError(error: unknown) {
  if (error instanceof TicketAnalysisPermanentError) {
    return false;
  }

  if (error instanceof AiTriageError) {
    return (
      error.code === "rate_limited" ||
      error.code === "service_unavailable" ||
      error.code === "timeout"
    );
  }

  return true;
}

export async function prepareTicketAnalysis(input: {
  ticketId: string;
  requestedById?: string;
}) {
  try {
    const dispatch = await prepareTicketAnalysisDispatch(input);
    return { jobId: dispatch.jobId, reused: dispatch.reused };
  } catch (error) {
    if (error instanceof Error && error.message === "Ticket was not found.") {
      throw new TicketAnalysisPermanentError(error.message);
    }
    throw error;
  }
}

async function claimTicketAnalysis(ticketId: string, jobId: string) {
  const staleBefore = new Date(Date.now() - PROCESSING_LEASE_MS);
  const claimed = await prisma.ticket.updateMany({
    where: {
      id: ticketId,
      aiProcessingJobId: jobId,
      OR: [
        {
          aiProcessingStatus: {
            in: [AiProcessingStatus.PENDING, AiProcessingStatus.FAILED],
          },
        },
        {
          aiProcessingStatus: AiProcessingStatus.PROCESSING,
          aiProcessingStartedAt: { lt: staleBefore },
        },
      ],
    },
    data: {
      aiProcessingStatus: AiProcessingStatus.PROCESSING,
      aiProcessingError: null,
      aiProcessingStartedAt: new Date(),
      aiProcessingCompletedAt: null,
    },
  });

  if (claimed.count === 1) {
    return "claimed" as const;
  }

  const current = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      aiProcessingJobId: true,
      aiProcessingStatus: true,
    },
  });

  if (!current) {
    throw new TicketAnalysisPermanentError("Ticket was deleted before analysis.");
  }

  if (current.aiProcessingJobId !== jobId) {
    return "superseded" as const;
  }

  if (current.aiProcessingStatus === AiProcessingStatus.COMPLETED) {
    return "completed" as const;
  }

  return "processing" as const;
}

function parseStoredOutput(rawAiResponse: Prisma.JsonValue | null) {
  const parsed = bugTriageAiOutputSchema.safeParse(rawAiResponse);
  return parsed.success ? parsed.data : null;
}

async function loadTicketForAnalysis(ticketId: string, jobId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      aiProcessingJobId: jobId,
    },
    select: {
      id: true,
      code: true,
      workspaceId: true,
      projectId: true,
      reporterId: true,
      title: true,
      description: true,
      expectedBehavior: true,
      actualBehavior: true,
      stepsToReproduce: true,
      browser: true,
      device: true,
      environment: true,
      affectedPage: true,
      aiInputContext: true,
      aiProcessingRequestedById: true,
      attachments: {
        select: { filename: true },
        orderBy: { createdAt: "asc" },
      },
      aiAnalysisRuns: {
        where: { processingJobId: jobId },
        select: { rawAiResponse: true },
        take: 1,
      },
      aiAnalysis: { select: { id: true } },
    },
  });

  if (!ticket) {
    throw new TicketAnalysisPermanentError(
      "Ticket analysis target no longer matches the requested operation."
    );
  }

  return ticket;
}

async function persistTicketAnalysis(input: {
  ticket: Awaited<ReturnType<typeof loadTicketForAnalysis>>;
  jobId: string;
  output: BugTriageAiOutput;
}) {
  const rawAiResponse = {
    ...input.output,
    developerTask: input.output.developerTask,
  } satisfies Prisma.InputJsonValue;
  const isReanalysis = Boolean(input.ticket.aiAnalysis);

  await prisma.$transaction(async (tx) => {
    const existingRun = await tx.ticketAiAnalysisRun.findUnique({
      where: { processingJobId: input.jobId },
      select: { id: true },
    });

    if (existingRun) {
      return;
    }

    const current = await tx.ticket.findFirst({
      where: {
        id: input.ticket.id,
        workspaceId: input.ticket.workspaceId,
        projectId: input.ticket.projectId,
        aiProcessingJobId: input.jobId,
      },
      select: { id: true },
    });

    if (!current) {
      throw new TicketAnalysisPermanentError(
        "Ticket analysis operation was superseded before persistence."
      );
    }

    await tx.ticket.update({
      where: { id: current.id },
      data: {
        title: input.output.improvedTitle,
        severity: input.output.severity,
        category: input.output.category,
        priorityScore: input.output.priorityScore,
        aiConfidence: input.output.confidenceScore,
        aiAnalysis: {
          upsert: {
            update: {
              summary: input.output.summary,
              likelyCause: input.output.likelyCause,
              suggestedFix: input.output.suggestedFix,
              reproductionSteps: input.output.reproductionSteps,
              tags: input.output.tags,
              confidenceScore: input.output.confidenceScore,
              rawAiResponse,
            },
            create: {
              summary: input.output.summary,
              likelyCause: input.output.likelyCause,
              suggestedFix: input.output.suggestedFix,
              reproductionSteps: input.output.reproductionSteps,
              tags: input.output.tags,
              confidenceScore: input.output.confidenceScore,
              rawAiResponse,
            },
          },
        },
        aiAnalysisRuns: {
          create: {
            processingJobId: input.jobId,
            summary: input.output.summary,
            severity: input.output.severity,
            category: input.output.category,
            priorityScore: input.output.priorityScore,
            confidenceScore: input.output.confidenceScore,
            tags: input.output.tags,
            likelyCause: input.output.likelyCause,
            suggestedFix: input.output.suggestedFix,
            reproductionSteps: input.output.reproductionSteps,
            rawAiResponse,
          },
        },
      },
    });

    await tx.ticketActivity.create({
      data: {
        ticketId: current.id,
        actorId:
          input.ticket.aiProcessingRequestedById ?? input.ticket.reporterId ?? null,
        type: TicketActivityType.AI_ANALYZED,
        title: isReanalysis ? "AI analysis regenerated" : "AI analysis completed",
        description: isReanalysis
          ? "AI triage was regenerated and the previous analysis was preserved in history."
          : "Background AI triage completed successfully.",
        metadata: {
          processingJobId: input.jobId,
          confidenceScore: input.output.confidenceScore,
          severity: input.output.severity,
          priorityScore: input.output.priorityScore,
        },
      },
    });
  });
}

export async function processTicketAnalysis(input: {
  ticketId: string;
  jobId: string;
}) {
  const claim = await claimTicketAnalysis(input.ticketId, input.jobId);

  if (claim !== "claimed") {
    return { status: claim, similarIssueCount: 0 } as const;
  }

  const ticket = await loadTicketForAnalysis(input.ticketId, input.jobId);
  let output = parseStoredOutput(ticket.aiAnalysisRuns[0]?.rawAiResponse ?? null);

  if (!output) {
    const report = bugReportFormSchema.safeParse({
      title: ticket.title,
      description: ticket.description,
      stepsToReproduce: ticket.stepsToReproduce ?? "",
      expectedBehavior: ticket.expectedBehavior ?? "",
      actualBehavior: ticket.actualBehavior ?? "",
      browser: ticket.browser ?? "",
      device: ticket.device ?? "",
      environment: ticket.environment ?? "",
      affectedPage: ticket.affectedPage ?? "",
      consoleLogs:
        aiInputContextSchema.safeParse(ticket.aiInputContext).data?.consoleLogs ?? "",
    });

    if (!report.success) {
      throw new TicketAnalysisPermanentError(
        "Ticket does not contain valid report data for AI analysis."
      );
    }

    const context = aiInputContextSchema.safeParse(ticket.aiInputContext);
    output = await analyzeBugReportWithGemini(
      {
        report: report.data,
        logText: context.success ? context.data.uploadedLogText : undefined,
        attachmentNames: ticket.attachments.map((attachment) => attachment.filename),
      },
      { maxRetries: 0 }
    );

    await persistTicketAnalysis({ ticket, jobId: input.jobId, output });
  }

  await createAndStoreTicketEmbedding({
    ticketId: ticket.id,
    workspaceId: ticket.workspaceId,
    projectId: ticket.projectId,
    source: {
      title: output.improvedTitle,
      description: ticket.description,
      expectedBehavior: ticket.expectedBehavior,
      actualBehavior: ticket.actualBehavior,
      stepsToReproduce: ticket.stepsToReproduce,
      browser: ticket.browser,
      device: ticket.device,
      environment: ticket.environment,
      affectedPage: ticket.affectedPage,
      aiSummary: output.summary,
    },
  });

  const similarIssues = await findSimilarIssuesForTicket({
    ticketId: ticket.id,
    workspaceId: ticket.workspaceId,
    projectId: ticket.projectId,
  });

  await prisma.ticket.updateMany({
    where: {
      id: ticket.id,
      workspaceId: ticket.workspaceId,
      projectId: ticket.projectId,
      aiProcessingJobId: input.jobId,
    },
    data: {
      aiProcessingStatus: AiProcessingStatus.COMPLETED,
      aiProcessingError: null,
      aiProcessingCompletedAt: new Date(),
      aiInputContext: Prisma.DbNull,
    },
  });

  return { status: "completed", similarIssueCount: similarIssues.length } as const;
}

export async function recordTicketAnalysisFailure(input: {
  ticketId: string;
  jobId: string;
  error: unknown;
  willRetry: boolean;
}) {
  const safeMessage = getSafeErrorMessage(input.error).slice(
    0,
    MAX_PROCESSING_ERROR_LENGTH
  );

  await prisma.ticket.updateMany({
    where: {
      id: input.ticketId,
      aiProcessingJobId: input.jobId,
      aiProcessingStatus: { not: AiProcessingStatus.COMPLETED },
    },
    data: {
      aiProcessingStatus: input.willRetry
        ? AiProcessingStatus.PENDING
        : AiProcessingStatus.FAILED,
      aiProcessingError: input.willRetry ? null : safeMessage,
      aiProcessingStartedAt: input.willRetry ? null : undefined,
      aiProcessingCompletedAt: null,
    },
  });

  if (!input.willRetry) {
    captureServerException(input.error, {
      area: "ai-triage",
      action: "process-ticket-analysis",
      message: "[ticket-analysis] processing failed permanently",
      context: {
        ticketId: input.ticketId,
        jobId: input.jobId,
      },
    });
  }
}
