import "server-only";

import { randomInt } from "node:crypto";
import {
  AiAnalysisFeedback,
  AiProcessingStatus,
  AttachmentType,
  GitHubExportStatus,
  Prisma,
  TicketActivityType,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";

import type { BugTriageAiOutput } from "@/lib/ai/bug-triage";
import {
  AuthorizationError,
  assertCanAccessProject,
  assertCanAccessTicket,
  assertCanCommentOnTicket,
  assertCanCreateTicket,
  assertCanExportTicket,
  assertCanModifyTicket,
  assertWorkspaceMember,
} from "@/lib/auth/authorization";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import {
  captureServerException,
  withServerSpan,
} from "@/lib/observability/server-monitoring";
import { prisma } from "@/lib/prisma";

const minimalUserSelect = {
  id: true,
  name: true,
} satisfies Prisma.UserSelect;

const ticketListSelect = {
  id: true,
  code: true,
  title: true,
  severity: true,
  status: true,
  category: true,
  aiConfidence: true,
  createdAt: true,
  assignee: {
    select: minimalUserSelect,
  },
  aiAnalysis: {
    select: {
      confidenceScore: true,
    },
  },
} satisfies Prisma.TicketSelect;

const ticketDetailInclude = {
  reporter: {
    select: minimalUserSelect,
  },
  assignee: {
    select: minimalUserSelect,
  },
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  aiAnalysis: {
    select: {
      id: true,
      ticketId: true,
      summary: true,
      likelyCause: true,
      suggestedFix: true,
      reproductionSteps: true,
      tags: true,
      confidenceScore: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  aiAnalysisRuns: {
    select: {
      id: true,
      severity: true,
      priorityScore: true,
      confidenceScore: true,
      feedback: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  },
  attachments: {
    orderBy: {
      createdAt: "desc",
    },
  },
  comments: {
    include: {
      author: {
        select: minimalUserSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  activities: {
    include: {
      actor: {
        select: minimalUserSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.TicketInclude;

export type TicketListItem = Prisma.TicketGetPayload<{
  select: typeof ticketListSelect;
}>;

export type TicketDetail = Prisma.TicketGetPayload<{
  include: typeof ticketDetailInclude;
}>;

export type GetTicketsInput = {
  workspaceId: string;
  projectId?: string;
  status?: TicketStatus;
  severity?: TicketSeverity;
  search?: string;
  take?: number;
  skip?: number;
  skipAccessCheck?: boolean;
};

export type CreateTicketInput = {
  workspaceId: string;
  projectId: string;
  reporterId?: string;
  assigneeId?: string;
  code: string;
  title: string;
  description: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  stepsToReproduce?: string;
  browser?: string;
  device?: string;
  environment?: string;
  affectedPage?: string;
  severity?: TicketSeverity;
  status?: TicketStatus;
  category?: string;
  priorityScore?: number | null;
  aiConfidence?: number | null;
  aiInputContext?: Prisma.InputJsonValue;
  aiAnalysis?: {
    summary: string;
    likelyCause?: string;
    suggestedFix?: string;
    reproductionSteps?: Prisma.InputJsonValue;
    tags?: Prisma.InputJsonValue;
    confidenceScore?: number;
    rawAiResponse?: Prisma.InputJsonValue;
  };
  attachments?: Array<{
    filename: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
    url?: string | null;
    attachmentType?: AttachmentType;
  }>;
};

export type AddTicketCommentInput = {
  workspaceId: string;
  ticketCode: string;
  authorId?: string;
  body: string;
};

export const MAX_TICKET_COMMENT_LENGTH = 4_000;
export const MAX_GITHUB_EXPORT_ERROR_LENGTH = 500;
const GITHUB_EXPORT_LEASE_MS = 60_000;

export class GitHubExportStateError extends Error {
  status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.name = "GitHubExportStateError";
    this.status = status;
  }
}

function clampPageSize(take?: number) {
  const normalized = take ?? 50;
  return Math.min(Math.max(normalized, 1), 100);
}

function clampOffset(skip?: number) {
  const normalized = skip ?? 0;
  return Math.max(normalized, 0);
}

function hasValidTicketAttachmentPath(
  storagePath: string,
  workspaceId: string,
  ticketCode: string,
  userId: string
) {
  const normalizedPath = storagePath.replace(/\\/g, "/");

  return (
    normalizedPath.startsWith(`private/${workspaceId}/${userId}/`) &&
    normalizedPath.includes(`/tickets/${ticketCode}/`)
  );
}

function assertTicketAttachmentPaths(
  attachments: CreateTicketInput["attachments"],
  workspaceId: string,
  ticketCode: string,
  userId: string
) {
  if (!attachments?.length) {
    return;
  }

  for (const attachment of attachments) {
    if (
      !hasValidTicketAttachmentPath(
        attachment.storagePath,
        workspaceId,
        ticketCode,
        userId
      )
    ) {
      throw new AuthorizationError(
        "Attachment storage path does not belong to the selected workspace ticket."
      );
    }
  }
}

export async function generateUniqueTicketCode() {
  try {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const code = `BUG-${randomInt(10_000_000, 100_000_000)}`;

      const existing = await prisma.ticket.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existing) return code;
    }

    throw new Error("Could not allocate a unique ticket code.");
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "generate-ticket-code",
      message: "[tickets] failed to generate unique ticket code",
    });
    throw error;
  }
}

export async function getTickets(input: GetTicketsInput) {
  const {
    workspaceId,
    projectId,
    status,
    severity,
    search,
    take = 50,
    skip = 0,
    skipAccessCheck = false,
  } = input;

  if (!skipAccessCheck) {
    await assertWorkspaceMember(workspaceId);

    if (projectId) {
      const projectAccess = await assertCanAccessProject(projectId);

      if (projectAccess.project.workspaceId !== workspaceId) {
        throw new AuthorizationError(
          "Project does not belong to the selected workspace."
        );
      }
    }
  }

  const where: Prisma.TicketWhereInput = {
    workspaceId,
    ...(projectId ? { projectId } : {}),
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(search
      ? {
          OR: [
            {
              code: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              affectedPage: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  try {
    return await prisma.ticket.findMany({
      where,
      select: ticketListSelect,
      orderBy: {
        createdAt: "desc",
      },
      take: clampPageSize(take),
      skip: clampOffset(skip),
    });
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "get-tickets",
      message: "[tickets] failed to load tickets",
      context: {
        workspaceId,
        projectId,
        status,
        severity,
      },
    });
    throw error;
  }
}

export async function getTicketByCode(
  code: string,
  workspaceId: string,
  options?: {
    skipAccessCheck?: boolean;
  }
) {
  try {
    if (options?.skipAccessCheck) {
      return await prisma.ticket.findFirst({
        where: {
          code,
          workspaceId,
        },
        include: ticketDetailInclude,
      });
    }

    const access = await assertCanAccessTicket({
      ticketCode: code,
      workspaceId,
    });

    return await prisma.ticket.findFirst({
      where: {
        id: access.ticket.id,
      },
      include: ticketDetailInclude,
    });
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "get-ticket-by-code",
      message: "[tickets] failed to load ticket detail",
      context: {
        workspaceId,
        ticketCode: code,
      },
    });
    throw error;
  }
}

export async function createTicket(input: CreateTicketInput) {
  const currentUser = await getCurrentUserOrThrow();
  const access = await assertCanCreateTicket(
    input.workspaceId,
    input.projectId,
    currentUser.id
  );

  if (input.reporterId && input.reporterId !== currentUser.id) {
    throw new AuthorizationError(
      "Tickets can only be created for the current authenticated user."
    );
  }

  if (input.assigneeId) {
    await assertWorkspaceMember(input.workspaceId, input.assigneeId);
  }

  assertTicketAttachmentPaths(
    input.attachments,
    input.workspaceId,
    input.code,
    currentUser.id
  );

  const reporterId = input.reporterId ?? currentUser.id;

  try {
    return await withServerSpan(
      {
        name: "prisma.ticket.create",
        op: "db.query",
        context: {
          workspaceId: access.workspaceAccess.workspace.id,
          projectId: access.project.id,
          ticketCode: input.code,
          attachmentCount: input.attachments?.length ?? 0,
          hasAiAnalysis: Boolean(input.aiAnalysis),
        },
      },
      () =>
        prisma.ticket.create({
          data: {
            code: input.code,
            workspaceId: access.workspaceAccess.workspace.id,
            projectId: access.project.id,
            reporterId,
            assigneeId: input.assigneeId,
            title: input.title,
            description: input.description,
            expectedBehavior: input.expectedBehavior,
            actualBehavior: input.actualBehavior,
            stepsToReproduce: input.stepsToReproduce,
            browser: input.browser,
            device: input.device,
            environment: input.environment,
            affectedPage: input.affectedPage,
            severity: input.severity ?? TicketSeverity.MEDIUM,
            status: input.status ?? TicketStatus.NEW,
            category: input.category,
            priorityScore: input.priorityScore,
            aiConfidence: input.aiConfidence,
            aiProcessingStatus: input.aiAnalysis
              ? AiProcessingStatus.COMPLETED
              : AiProcessingStatus.PENDING,
            aiProcessingCompletedAt: input.aiAnalysis ? new Date() : null,
            aiInputContext: input.aiInputContext,
            aiAnalysis: input.aiAnalysis
              ? {
                  create: {
                    summary: input.aiAnalysis.summary,
                    likelyCause: input.aiAnalysis.likelyCause,
                    suggestedFix: input.aiAnalysis.suggestedFix,
                    reproductionSteps: input.aiAnalysis.reproductionSteps,
                    tags: input.aiAnalysis.tags,
                    confidenceScore: input.aiAnalysis.confidenceScore,
                    rawAiResponse: input.aiAnalysis.rawAiResponse,
                  },
                }
              : undefined,
            aiAnalysisRuns: input.aiAnalysis
              ? {
                  create: {
                    summary: input.aiAnalysis.summary,
                    severity: input.severity ?? TicketSeverity.MEDIUM,
                    category: input.category,
                    priorityScore: input.priorityScore,
                    confidenceScore: input.aiAnalysis.confidenceScore,
                    tags: input.aiAnalysis.tags,
                    likelyCause: input.aiAnalysis.likelyCause,
                    suggestedFix: input.aiAnalysis.suggestedFix,
                    reproductionSteps: input.aiAnalysis.reproductionSteps,
                    rawAiResponse: input.aiAnalysis.rawAiResponse,
                  },
                }
              : undefined,
            attachments: input.attachments?.length
              ? {
                  create: input.attachments.map((attachment) => ({
                    filename: attachment.filename,
                    fileType: attachment.fileType,
                    fileSize: attachment.fileSize,
                    storagePath: attachment.storagePath,
                    url: attachment.url,
                    attachmentType: attachment.attachmentType ?? AttachmentType.OTHER,
                  })),
                }
              : undefined,
            activities: {
              create: {
                actorId: reporterId,
                type: TicketActivityType.CREATED,
                title: "Bug submitted",
                description: input.aiAnalysis
                  ? "Ticket created after AI triage completed."
                  : "Ticket created successfully. AI analysis is pending.",
                metadata: {
                  code: input.code,
                  aiAnalyzed: Boolean(input.aiAnalysis),
                },
              },
            },
          },
          select: {
            id: true,
            code: true,
          },
        })
    );
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "create-ticket",
      message: "[tickets] failed to create ticket",
      context: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        ticketCode: input.code,
      },
    });
    throw error;
  }
}

export async function regenerateTicketAiAnalysis(input: {
  workspaceId: string;
  ticketCode: string;
  actorId?: string;
  output: BugTriageAiOutput;
}) {
  const currentUser = await getCurrentUserOrThrow();
  const access = await assertCanModifyTicket(
    {
      ticketCode: input.ticketCode,
      workspaceId: input.workspaceId,
    },
    currentUser.id
  );

  if (input.actorId && input.actorId !== currentUser.id) {
    throw new AuthorizationError(
      "AI regeneration must be attributed to the current authenticated user."
    );
  }

  const rawAiResponse = {
    ...input.output,
    developerTask: input.output.developerTask,
  } satisfies Prisma.InputJsonValue;

  try {
    return await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: {
          id: access.ticket.id,
        },
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
        select: {
          id: true,
          code: true,
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: access.ticket.id,
          actorId: input.actorId ?? currentUser.id,
          type: TicketActivityType.AI_ANALYZED,
          title: "AI analysis regenerated",
          description:
            "AI triage was regenerated and the previous analysis was preserved in history.",
          metadata: {
            confidenceScore: input.output.confidenceScore,
            severity: input.output.severity,
            priorityScore: input.output.priorityScore,
          },
        },
      });

      return ticket;
    });
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "regenerate-ticket-ai-analysis",
      message: "[tickets] failed to persist regenerated AI analysis",
      context: {
        workspaceId: input.workspaceId,
        ticketCode: input.ticketCode,
      },
    });
    throw error;
  }
}

export async function setTicketAiAnalysisFeedback(input: {
  workspaceId: string;
  ticketCode: string;
  analysisRunId: string;
  feedback: AiAnalysisFeedback;
}) {
  const currentUser = await getCurrentUserOrThrow();
  const access = await assertCanAccessTicket(
    {
      ticketCode: input.ticketCode,
      workspaceId: input.workspaceId,
    },
    currentUser.id
  );

  try {
    const run = await prisma.ticketAiAnalysisRun.findFirst({
      where: {
        id: input.analysisRunId,
        ticketId: access.ticket.id,
      },
      select: {
        id: true,
      },
    });

    if (!run) {
      throw new AuthorizationError("AI analysis run not found or access denied.");
    }

    return await prisma.ticketAiAnalysisRun.update({
      where: {
        id: run.id,
      },
      data: {
        feedback: input.feedback,
      },
      select: {
        id: true,
        feedback: true,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }

    captureServerException(error, {
      area: "database",
      action: "set-ticket-ai-analysis-feedback",
      message: "[tickets] failed to save AI analysis feedback",
      context: {
        workspaceId: input.workspaceId,
        ticketCode: input.ticketCode,
        analysisRunId: input.analysisRunId,
      },
    });
    throw error;
  }
}

export async function claimTicketGitHubExport(input: {
  workspaceId: string;
  ticketCode: string;
  actorId?: string;
}) {
  const currentUser = await getCurrentUserOrThrow();
  const access = await assertCanExportTicket(
    {
      ticketCode: input.ticketCode,
      workspaceId: input.workspaceId,
    },
    currentUser.id
  );

  if (input.actorId && input.actorId !== currentUser.id) {
    throw new AuthorizationError(
      "GitHub exports must be attributed to the current authenticated user."
    );
  }

  const staleBefore = new Date(Date.now() - GITHUB_EXPORT_LEASE_MS);
  const claimed = await prisma.ticket.updateMany({
    where: {
      id: access.ticket.id,
      OR: [
        {
          githubExportStatus: {
            in: [GitHubExportStatus.NOT_EXPORTED, GitHubExportStatus.FAILED],
          },
        },
        {
          githubExportStatus: GitHubExportStatus.EXPORTING,
          updatedAt: {
            lt: staleBefore,
          },
        },
      ],
    },
    data: {
      githubExportStatus: GitHubExportStatus.EXPORTING,
      githubExportError: null,
    },
  });

  if (claimed.count === 1) {
    return access.ticket;
  }

  const current = await prisma.ticket.findUnique({
    where: {
      id: access.ticket.id,
    },
    select: {
      githubExportStatus: true,
      githubIssueUrl: true,
    },
  });

  if (current?.githubExportStatus === GitHubExportStatus.EXPORTED) {
    throw new GitHubExportStateError(
      current.githubIssueUrl
        ? "This ticket has already been exported to GitHub."
        : "This ticket is already marked as exported."
    );
  }

  throw new GitHubExportStateError(
    "A GitHub export is already in progress for this ticket."
  );
}

export async function completeTicketGitHubExport(input: {
  workspaceId: string;
  ticketCode: string;
  actorId?: string;
  issueUrl: string;
  issueNumber: number;
}) {
  const currentUser = await getCurrentUserOrThrow();
  const access = await assertCanExportTicket(
    {
      ticketCode: input.ticketCode,
      workspaceId: input.workspaceId,
    },
    currentUser.id
  );

  if (input.actorId && input.actorId !== currentUser.id) {
    throw new AuthorizationError(
      "GitHub exports must be attributed to the current authenticated user."
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.updateMany({
      where: {
        id: access.ticket.id,
        githubExportStatus: GitHubExportStatus.EXPORTING,
      },
      data: {
        githubExportStatus: GitHubExportStatus.EXPORTED,
        githubIssueUrl: input.issueUrl,
        githubIssueNumber: input.issueNumber,
        githubExportedAt: new Date(),
        githubExportError: null,
      },
    });

    if (updated.count !== 1) {
      throw new GitHubExportStateError(
        "GitHub export state changed before completion."
      );
    }

    await tx.ticketActivity.create({
      data: {
        ticketId: access.ticket.id,
        actorId: input.actorId ?? currentUser.id,
        type: TicketActivityType.UPDATED,
        title: "Exported to GitHub",
        description: `GitHub issue #${input.issueNumber} was created.`,
        metadata: {
          issueNumber: input.issueNumber,
          issueUrl: input.issueUrl,
        },
      },
    });

    return {
      issueUrl: input.issueUrl,
      issueNumber: input.issueNumber,
    };
  });
}

export async function failTicketGitHubExport(input: {
  workspaceId: string;
  ticketCode: string;
  error: string;
}) {
  const safeError = input.error.trim().slice(0, MAX_GITHUB_EXPORT_ERROR_LENGTH);

  return prisma.ticket.updateMany({
    where: {
      code: input.ticketCode,
      workspaceId: input.workspaceId,
      githubExportStatus: GitHubExportStatus.EXPORTING,
    },
    data: {
      githubExportStatus: GitHubExportStatus.FAILED,
      githubExportError: safeError || "GitHub export failed. Please try again.",
    },
  });
}

export async function updateTicketStatus(
  code: string,
  workspaceId: string,
  status: TicketStatus,
  actorId?: string
) {
  const currentUser = await getCurrentUserOrThrow();
  const access = await assertCanModifyTicket(
    {
      ticketCode: code,
      workspaceId,
    },
    currentUser.id
  );

  if (actorId && actorId !== currentUser.id) {
    throw new AuthorizationError(
      "Ticket status changes must be attributed to the current authenticated user."
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingTicket = await tx.ticket.findUnique({
        where: {
          id: access.ticket.id,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existingTicket) {
        throw new Error(`Ticket ${code} not found.`);
      }

      if (existingTicket.status === status) {
        return tx.ticket.findUniqueOrThrow({
          where: {
            id: existingTicket.id,
          },
          include: {
            assignee: {
              select: minimalUserSelect,
            },
            aiAnalysis: true,
          },
        });
      }

      const updatedTicket = await tx.ticket.update({
        where: {
          id: existingTicket.id,
        },
        data: {
          status,
        },
        include: {
          assignee: {
            select: minimalUserSelect,
          },
          aiAnalysis: true,
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: existingTicket.id,
          actorId: actorId ?? currentUser.id,
          type: TicketActivityType.STATUS_CHANGED,
          title: "Status changed",
          description: `Ticket moved from ${existingTicket.status} to ${status}.`,
          metadata: {
            from: existingTicket.status,
            to: status,
          },
        },
      });

      return updatedTicket;
    });
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "update-ticket-status",
      message: "[tickets] failed to update ticket status",
      context: {
        workspaceId,
        ticketCode: code,
        status,
      },
    });
    throw error;
  }
}

export async function addTicketComment(input: AddTicketCommentInput) {
  const body = input.body.trim();

  if (!body) {
    throw new Error("Comment body cannot be empty.");
  }

  if (body.length > MAX_TICKET_COMMENT_LENGTH) {
    throw new Error(
      `Comment must be ${MAX_TICKET_COMMENT_LENGTH.toLocaleString()} characters or less.`
    );
  }

  const currentUser = await getCurrentUserOrThrow();
  const access = await assertCanCommentOnTicket(
    {
      ticketCode: input.ticketCode,
      workspaceId: input.workspaceId,
    },
    currentUser.id
  );

  if (input.authorId && input.authorId !== currentUser.id) {
    throw new AuthorizationError(
      "Comments must be authored by the current authenticated user."
    );
  }

  const authorId = input.authorId ?? currentUser.id;

  try {
    return await prisma.$transaction(async (tx) => {
      const comment = await tx.ticketComment.create({
        data: {
          ticketId: access.ticket.id,
          authorId,
          body,
        },
        include: {
          author: {
            select: minimalUserSelect,
          },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: access.ticket.id,
          actorId: authorId,
          type: TicketActivityType.COMMENTED,
          title: "Comment added",
          description: "A new internal comment was added to the ticket.",
          metadata: {
            commentId: comment.id,
          },
        },
      });

      return comment;
    });
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "add-ticket-comment",
      message: "[tickets] failed to add ticket comment",
      context: {
        workspaceId: input.workspaceId,
        ticketCode: input.ticketCode,
      },
    });
    throw error;
  }
}
