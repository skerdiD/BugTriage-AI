import {
  AttachmentType,
  TicketActivityType,
  TicketStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  AuthorizationErrorMock,
  assertCanAccessTicketMock,
  assertCanCommentOnTicketMock,
  assertCanCreateTicketMock,
  assertCanModifyTicketMock,
  assertCanAccessProjectMock,
  assertWorkspaceMemberMock,
  captureServerExceptionMock,
  getCurrentUserOrThrowMock,
  prismaMock,
  txMock,
  withServerSpanMock,
} = vi.hoisted(() => {
  class AuthorizationErrorMock extends Error {
    status: number;

    constructor(message = "Forbidden") {
      super(message);
      this.name = "AuthorizationError";
      this.status = 403;
    }
  }

  const txMock = {
    ticket: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    ticketActivity: {
      create: vi.fn(),
    },
    ticketComment: {
      create: vi.fn(),
    },
  };

  return {
    AuthorizationErrorMock,
    assertCanAccessProjectMock: vi.fn(),
    assertCanAccessTicketMock: vi.fn(),
    assertCanCommentOnTicketMock: vi.fn(),
    assertCanCreateTicketMock: vi.fn(),
    assertCanModifyTicketMock: vi.fn(),
    assertWorkspaceMemberMock: vi.fn(),
    captureServerExceptionMock: vi.fn(),
    getCurrentUserOrThrowMock: vi.fn(),
    prismaMock: {
      ticket: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    txMock,
    withServerSpanMock: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUserOrThrow: getCurrentUserOrThrowMock,
}));

vi.mock("@/lib/auth/authorization", () => ({
  AuthorizationError: AuthorizationErrorMock,
  assertCanAccessProject: assertCanAccessProjectMock,
  assertCanAccessTicket: assertCanAccessTicketMock,
  assertCanCommentOnTicket: assertCanCommentOnTicketMock,
  assertCanCreateTicket: assertCanCreateTicketMock,
  assertCanModifyTicket: assertCanModifyTicketMock,
  assertWorkspaceMember: assertWorkspaceMemberMock,
}));

vi.mock("@/lib/observability/server-monitoring", () => ({
  captureServerException: captureServerExceptionMock,
  withServerSpan: withServerSpanMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  MAX_TICKET_COMMENT_LENGTH,
  addTicketComment,
  createTicket,
  getTicketByCode,
  updateTicketStatus,
} from "@/lib/data/tickets";

describe("ticket data layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentUserOrThrowMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    assertCanAccessProjectMock.mockResolvedValue({
      project: {
        id: "project-1",
        workspaceId: "workspace-1",
      },
    });
    assertCanCreateTicketMock.mockResolvedValue({
      project: {
        id: "project-1",
        workspaceId: "workspace-1",
      },
      workspaceAccess: {
        workspace: {
          id: "workspace-1",
        },
      },
    });
    assertCanAccessTicketMock.mockResolvedValue({
      ticket: {
        id: "ticket-1",
      },
    });
    assertCanModifyTicketMock.mockResolvedValue({
      ticket: {
        id: "ticket-1",
      },
    });
    assertCanCommentOnTicketMock.mockResolvedValue({
      ticket: {
        id: "ticket-1",
      },
    });
    assertWorkspaceMemberMock.mockResolvedValue({
      workspace: {
        id: "workspace-1",
      },
    });
    withServerSpanMock.mockImplementation(
      async (_span: unknown, callback: () => Promise<unknown>) => callback()
    );
    prismaMock.$transaction.mockImplementation(async (callback: unknown) => {
      if (typeof callback === "function") {
        return callback(txMock);
      }

      return Promise.all(callback as Promise<unknown>[]);
    });
  });

  it("creates tickets with workspace-safe relations, AI analysis, attachments, and activity logs", async () => {
    prismaMock.ticket.create.mockResolvedValue({
      id: "ticket-1",
      code: "BUG-4242",
    });

    const result = await createTicket({
      code: "BUG-4242",
      workspaceId: "workspace-1",
      projectId: "project-1",
      assigneeId: "user-2",
      title: "Checkout submit button stays disabled",
      description: "Users cannot complete checkout after entering valid data.",
      category: "Payments",
      aiConfidence: 92,
      aiAnalysis: {
        summary: "AI summary",
        likelyCause: "Safari event state remains stale.",
        suggestedFix: "Reset submit-state guards on card validation.",
        reproductionSteps: ["Open checkout", "Enter card", "Observe disabled CTA"],
        tags: ["payments", "safari"],
        confidenceScore: 92,
        rawAiResponse: {
          provider: "mock-gemini",
        },
      },
      attachments: [
        {
          filename: "checkout.png",
          fileType: "image/png",
          fileSize: 2_048,
          storagePath:
            "private/workspace-1/user-1/tickets/BUG-4242/screenshots/checkout.png",
          attachmentType: AttachmentType.SCREENSHOT,
        },
      ],
    });

    expect(result).toEqual({
      id: "ticket-1",
      code: "BUG-4242",
    });
    expect(assertWorkspaceMemberMock).toHaveBeenCalledWith("workspace-1", "user-2");
    expect(prismaMock.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: "workspace-1",
          projectId: "project-1",
          reporterId: "user-1",
          assigneeId: "user-2",
          title: "Checkout submit button stays disabled",
          aiAnalysis: {
            create: expect.objectContaining({
              summary: "AI summary",
              confidenceScore: 92,
            }),
          },
          attachments: {
            create: [
              expect.objectContaining({
                filename: "checkout.png",
                attachmentType: AttachmentType.SCREENSHOT,
              }),
            ],
          },
          activities: {
            create: expect.objectContaining({
              type: TicketActivityType.CREATED,
              actorId: "user-1",
              metadata: {
                code: "BUG-4242",
                aiAnalyzed: true,
              },
            }),
          },
        }),
      })
    );
  });

  it("rejects reporter spoofing before creating a ticket", async () => {
    await expect(
      createTicket({
        code: "BUG-1001",
        workspaceId: "workspace-1",
        projectId: "project-1",
        reporterId: "user-2",
        title: "Spoofed reporter",
        description: "This should fail.",
      })
    ).rejects.toThrow("current authenticated user");

    expect(prismaMock.ticket.create).not.toHaveBeenCalled();
  });

  it("rejects attachment paths that do not belong to the selected workspace ticket", async () => {
    await expect(
      createTicket({
        code: "BUG-1002",
        workspaceId: "workspace-1",
        projectId: "project-1",
        title: "Bad attachment path",
        description: "This should fail.",
        attachments: [
          {
            filename: "escape.png",
            fileType: "image/png",
            fileSize: 128,
            storagePath: "private/workspace-9/user-1/tickets/BUG-1002/screenshots/escape.png",
          },
        ],
      })
    ).rejects.toThrow("Attachment storage path does not belong");

    expect(prismaMock.ticket.create).not.toHaveBeenCalled();
  });

  it("rejects attachment paths that do not belong to the authenticated uploader scope", async () => {
    await expect(
      createTicket({
        code: "BUG-1003",
        workspaceId: "workspace-1",
        projectId: "project-1",
        title: "Wrong uploader scope",
        description: "This should fail.",
        attachments: [
          {
            filename: "escape.png",
            fileType: "image/png",
            fileSize: 128,
            storagePath: "private/workspace-1/user-9/tickets/BUG-1003/screenshots/escape.png",
          },
        ],
      })
    ).rejects.toThrow("Attachment storage path does not belong");

    expect(prismaMock.ticket.create).not.toHaveBeenCalled();
  });

  it("loads ticket detail only after a workspace-safe ticket access lookup", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({
      id: "ticket-1",
      code: "BUG-1003",
    });

    const result = await getTicketByCode("BUG-1003", "workspace-1");

    expect(result).toEqual({
      id: "ticket-1",
      code: "BUG-1003",
    });
    expect(assertCanAccessTicketMock).toHaveBeenCalledWith({
      ticketCode: "BUG-1003",
      workspaceId: "workspace-1",
    });
    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "ticket-1",
        },
      })
    );
  });

  it("persists valid status changes and records one activity entry", async () => {
    txMock.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: TicketStatus.NEW,
    });
    txMock.ticket.update.mockResolvedValue({
      id: "ticket-1",
      status: TicketStatus.FIXED,
      assignee: null,
      aiAnalysis: null,
    });

    const result = await updateTicketStatus(
      "BUG-2001",
      "workspace-1",
      TicketStatus.FIXED
    );

    expect(result).toMatchObject({
      id: "ticket-1",
      status: TicketStatus.FIXED,
    });
    expect(txMock.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: TicketStatus.FIXED,
        },
      })
    );
    expect(txMock.ticketActivity.create).toHaveBeenCalledWith({
      data: {
        ticketId: "ticket-1",
        actorId: "user-1",
        type: TicketActivityType.STATUS_CHANGED,
        title: "Status changed",
        description: "Ticket moved from NEW to FIXED.",
        metadata: {
          from: TicketStatus.NEW,
          to: TicketStatus.FIXED,
        },
      },
    });
  });

  it("does not create duplicate activity for a no-op status update", async () => {
    txMock.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: TicketStatus.FIXED,
    });
    txMock.ticket.findUniqueOrThrow.mockResolvedValue({
      id: "ticket-1",
      status: TicketStatus.FIXED,
      assignee: null,
      aiAnalysis: null,
    });

    const result = await updateTicketStatus(
      "BUG-2002",
      "workspace-1",
      TicketStatus.FIXED
    );

    expect(result).toMatchObject({
      id: "ticket-1",
      status: TicketStatus.FIXED,
    });
    expect(txMock.ticket.update).not.toHaveBeenCalled();
    expect(txMock.ticketActivity.create).not.toHaveBeenCalled();
  });

  it("blocks cross-workspace status updates before prisma writes", async () => {
    assertCanModifyTicketMock.mockRejectedValue(
      new AuthorizationErrorMock("Ticket not found or access denied.")
    );

    await expect(
      updateTicketStatus("BUG-9999", "workspace-1", TicketStatus.CLOSED)
    ).rejects.toBeInstanceOf(AuthorizationErrorMock);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("persists comments and records comment activity", async () => {
    txMock.ticketComment.create.mockResolvedValue({
      id: "comment-1",
      body: "We reproduced this on staging and production.",
      author: {
        id: "user-1",
        name: "Casey Doe",
      },
    });

    const result = await addTicketComment({
      workspaceId: "workspace-1",
      ticketCode: "BUG-3001",
      body: "  We reproduced this on staging and production.  ",
    });

    expect(result).toMatchObject({
      id: "comment-1",
      body: "We reproduced this on staging and production.",
    });
    expect(txMock.ticketComment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          ticketId: "ticket-1",
          authorId: "user-1",
          body: "We reproduced this on staging and production.",
        },
      })
    );
    expect(txMock.ticketActivity.create).toHaveBeenCalledWith({
      data: {
        ticketId: "ticket-1",
        actorId: "user-1",
        type: TicketActivityType.COMMENTED,
        title: "Comment added",
        description: "A new internal comment was added to the ticket.",
        metadata: {
          commentId: "comment-1",
        },
      },
    });
  });

  it("rejects empty and oversized comments before persistence", async () => {
    await expect(
      addTicketComment({
        workspaceId: "workspace-1",
        ticketCode: "BUG-3002",
        body: "   ",
      })
    ).rejects.toThrow("cannot be empty");

    await expect(
      addTicketComment({
        workspaceId: "workspace-1",
        ticketCode: "BUG-3002",
        body: "x".repeat(MAX_TICKET_COMMENT_LENGTH + 1),
      })
    ).rejects.toThrow("characters or less");

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("blocks cross-workspace comments before prisma writes", async () => {
    assertCanCommentOnTicketMock.mockRejectedValue(
      new AuthorizationErrorMock("Ticket not found or access denied.")
    );

    await expect(
      addTicketComment({
        workspaceId: "workspace-1",
        ticketCode: "BUG-9999",
        body: "This should not be allowed.",
      })
    ).rejects.toBeInstanceOf(AuthorizationErrorMock);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
