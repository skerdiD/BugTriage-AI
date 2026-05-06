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
      orderBy: {
        createdAt: "desc";
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
      orderBy: {
        createdAt: "desc";
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
  code?: string;
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
  priorityScore?: number;
  aiConfidence?: number;
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
    url?: string;
    attachmentType?: AttachmentType;
  }>;
};

export type AddTicketCommentInput = {
  ticketCode: string;
  authorId?: string;
  body: string;
};

function createTicketCode() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BUG-${random}`;
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
  const ticketCode = input.code ?? createTicketCode();

  return prisma.ticket.create({
    data: {
      code: ticketCode,
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
          description: "Ticket created from a submitted bug report.",
          metadata: {
            code: ticketCode,
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