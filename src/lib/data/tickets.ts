import "server-only";

import {
  AttachmentType,
  Prisma,
  TicketActivityType,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";

import {
  AuthorizationError,
  assertCanAccessProject,
  assertCanAccessTicket,
  assertCanCommentOnTicket,
  assertCanCreateTicket,
  assertCanModifyTicket,
  assertWorkspaceMember,
} from "@/lib/auth/authorization";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const minimalUserSelect = {
  id: true,
  name: true,
} satisfies Prisma.UserSelect;

const ticketListInclude = {
  assignee: {
    select: minimalUserSelect,
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
      summary: true,
      confidenceScore: true,
      tags: true,
    },
  },
} satisfies Prisma.TicketInclude;

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
  aiAnalysis: true,
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
  include: typeof ticketListInclude;
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
  ticketCode: string
) {
  const normalizedPath = storagePath.replace(/\\/g, "/");

  return (
    normalizedPath.startsWith(`private/${workspaceId}/`) &&
    normalizedPath.includes(`/tickets/${ticketCode}/`)
  );
}

function assertTicketAttachmentPaths(
  attachments: CreateTicketInput["attachments"],
  workspaceId: string,
  ticketCode: string
) {
  if (!attachments?.length) {
    return;
  }

  for (const attachment of attachments) {
    if (
      !hasValidTicketAttachmentPath(
        attachment.storagePath,
        workspaceId,
        ticketCode
      )
    ) {
      throw new AuthorizationError(
        "Attachment storage path does not belong to the selected workspace ticket."
      );
    }
  }
}

export async function generateUniqueTicketCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `BUG-${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await prisma.ticket.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) return code;
  }

  return `BUG-${Date.now().toString().slice(-6)}`;
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
  } = input;

  await assertWorkspaceMember(workspaceId);

  if (projectId) {
    const projectAccess = await assertCanAccessProject(projectId);

    if (projectAccess.project.workspaceId !== workspaceId) {
      throw new AuthorizationError(
        "Project does not belong to the selected workspace."
      );
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

  return prisma.ticket.findMany({
    where,
    include: ticketListInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: clampPageSize(take),
    skip: clampOffset(skip),
  });
}

export async function getTicketByCode(code: string, workspaceId: string) {
  const access = await assertCanAccessTicket({
    ticketCode: code,
    workspaceId,
  });

  return prisma.ticket.findFirst({
    where: {
      id: access.ticket.id,
    },
    include: ticketDetailInclude,
  });
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

  assertTicketAttachmentPaths(input.attachments, input.workspaceId, input.code);

  const reporterId = input.reporterId ?? currentUser.id;

  return prisma.ticket.create({
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
            : "Ticket created from manual report because AI analysis was unavailable.",
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

  return prisma.$transaction(async (tx) => {
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
}

export async function addTicketComment(input: AddTicketCommentInput) {
  const body = input.body.trim();

  if (!body) {
    throw new Error("Comment body cannot be empty.");
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

  return prisma.$transaction(async (tx) => {
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
}
