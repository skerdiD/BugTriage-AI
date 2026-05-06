import {
  AttachmentType,
  Prisma,
  TicketActivityType,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TicketListItem = Prisma.TicketGetPayload<{
  include: {
    assignee: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
    project: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
    aiAnalysis: {
      select: {
        id: true;
        summary: true;
        confidenceScore: true;
        tags: true;
      };
    };
  };
}>;

export type TicketDetail = Prisma.TicketGetPayload<{
  include: {
    reporter: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
    assignee: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
    workspace: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
    project: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
    aiAnalysis: true;
    attachments: true;
    comments: {
      include: {
        author: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
    activities: {
      include: {
        actor: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
  };
}>;

export type GetTicketsInput = {
  workspaceId?: string;
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
  ticketCode: string;
  authorId?: string;
  body: string;
};

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

export async function getTickets(input: GetTicketsInput = {}) {
  const {
    workspaceId,
    projectId,
    status,
    severity,
    search,
    take = 50,
    skip = 0,
  } = input;

  const where: Prisma.TicketWhereInput = {
    ...(workspaceId ? { workspaceId } : {}),
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
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
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
          summary: true,
          confidenceScore: true,
          tags: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
    skip,
  });
}

export async function getTicketByCode(code: string) {
  return prisma.ticket.findUnique({
    where: {
      code,
    },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
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
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      activities: {
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function createTicket(input: CreateTicketInput) {
  return prisma.ticket.create({
    data: {
      code: input.code,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      reporterId: input.reporterId,
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
          actorId: input.reporterId,
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
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
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
      attachments: true,
      comments: true,
      activities: true,
    },
  });
}

export async function updateTicketStatus(
  code: string,
  status: TicketStatus,
  actorId?: string
) {
  return prisma.$transaction(async (tx) => {
    const existingTicket = await tx.ticket.findUnique({
      where: {
        code,
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
        code,
      },
      data: {
        status,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        aiAnalysis: true,
      },
    });

    await tx.ticketActivity.create({
      data: {
        ticketId: existingTicket.id,
        actorId,
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

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: {
        code: input.ticketCode,
      },
      select: {
        id: true,
      },
    });

    if (!ticket) {
      throw new Error(`Ticket ${input.ticketCode} not found.`);
    }

    const comment = await tx.ticketComment.create({
      data: {
        ticketId: ticket.id,
        authorId: input.authorId,
        body,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await tx.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        actorId: input.authorId,
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