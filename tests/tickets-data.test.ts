import {
  AiAnalysisFeedback,
  AttachmentType,
  GitHubExportStatus,
  TicketActivityType,
  TicketStatus,
} from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  AuthorizationErrorMock,
  assertCanAccessTicketMock,
  assertCanCommentOnTicketMock,
  assertCanCreateTicketMock,
  assertCanExportTicketMock,
  assertCanManageTicketMock,
  assertCanModifyTicketMock,
  assertCanAccessProjectMock,
  assertWorkspaceMemberMock,
  captureServerExceptionMock,
  getCurrentUserOrThrowMock,
  hasTicketPermissionMock,
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
    ticketAiAnalysisRun: {
      create: vi.fn(),
    },
  };

  return {
    AuthorizationErrorMock,
    assertCanAccessProjectMock: vi.fn(),
    assertCanAccessTicketMock: vi.fn(),
    assertCanCommentOnTicketMock: vi.fn(),
    assertCanCreateTicketMock: vi.fn(),
    assertCanExportTicketMock: vi.fn(),
    assertCanManageTicketMock: vi.fn(),
    assertCanModifyTicketMock: vi.fn(),
    assertWorkspaceMemberMock: vi.fn(),
    captureServerExceptionMock: vi.fn(),
    getCurrentUserOrThrowMock: vi.fn(),
    hasTicketPermissionMock: vi.fn(),
    prismaMock: {
      ticket: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      ticketAiAnalysisRun: {
        findFirst: vi.fn(),
        update: vi.fn(),
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
  assertCanExportTicket: assertCanExportTicketMock,
  assertCanManageTicket: assertCanManageTicketMock,
  assertCanModifyTicket: assertCanModifyTicketMock,
  assertWorkspaceMember: assertWorkspaceMemberMock,
  hasTicketPermission: hasTicketPermissionMock,
  TicketPermission: {
    READ: "READ",
    CREATE: "CREATE",
    MODIFY: "MODIFY",
    COLLABORATE: "COLLABORATE",
    MANAGE: "MANAGE",
    EXPORT: "EXPORT",
  },
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
  claimTicketGitHubExport,
  createTicket,
  failTicketGitHubExport,
  generateUniqueTicketCode,
  getTicketByCode,
  regenerateTicketAiAnalysis,
  setTicketAiAnalysisFeedback,
  updateTicketStatus,
} from "@/lib/data/tickets";

describe("ticket data layer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
        role: "ADMIN",
      },
    });
    assertCanExportTicketMock.mockResolvedValue({
      ticket: {
        id: "ticket-1",
        code: "BUG-4242",
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
    assertCanManageTicketMock.mockResolvedValue({
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
    hasTicketPermissionMock.mockReturnValue(true);
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

  it("allocates a high-entropy ticket code after a collision", async () => {
    prismaMock.ticket.findUnique
      .mockResolvedValueOnce({ id: "existing-ticket" })
      .mockResolvedValueOnce(null);

    const code = await generateUniqueTicketCode();

    expect(code).toMatch(/^BUG-\d{8}$/);
    expect(prismaMock.ticket.findUnique).toHaveBeenCalledTimes(2);
  });

  it("allows an abandoned GitHub export claim to be recovered after its lease", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T10:00:00.000Z"));
    prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });

    await claimTicketGitHubExport({
      workspaceId: "workspace-1",
      ticketCode: "BUG-4242",
      actorId: "user-1",
    });

    expect(prismaMock.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: "ticket-1",
        OR: [
          {
            githubExportStatus: {
              in: [
                GitHubExportStatus.NOT_EXPORTED,
                GitHubExportStatus.FAILED,
              ],
            },
          },
          {
            githubExportStatus: GitHubExportStatus.EXPORTING,
            updatedAt: {
              lt: new Date("2026-08-11T09:59:00.000Z"),
            },
          },
        ],
      },
      data: {
        githubExportStatus: GitHubExportStatus.EXPORTING,
        githubExportError: null,
      },
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
          aiAnalysisRuns: {
            create: expect.objectContaining({
              summary: "AI summary",
              confidenceScore: 92,
              severity: "MEDIUM",
            }),
          },
          analysisDispatches: undefined,
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

  it("creates a pending analysis outbox row with a new ticket", async () => {
    prismaMock.ticket.create.mockResolvedValue({ id: "ticket-2", code: "BUG-4243" });

    await createTicket({
      code: "BUG-4243",
      workspaceId: "workspace-1",
      projectId: "project-1",
      title: "Search results fail to render",
      description: "Opening the search page leaves users on a blank screen.",
    });

    expect(prismaMock.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aiProcessingStatus: "PENDING",
          aiProcessingJobId: expect.stringMatching(/^ticket-analysis-/),
          aiProcessingRequestedById: "user-1",
          analysisDispatches: {
            create: {
              id: expect.any(String),
              jobId: expect.stringMatching(/^ticket-analysis-/),
            },
          },
        }),
      })
    );
  });

  it("persists regenerated AI analysis, history, and activity together", async () => {
    txMock.ticket.update.mockResolvedValue({
      id: "ticket-1",
      code: "BUG-4242",
    });

    await regenerateTicketAiAnalysis({
      workspaceId: "workspace-1",
      ticketCode: "BUG-4242",
      output: {
        improvedTitle: "Checkout fails after payment validation",
        summary: "Checkout cannot complete after valid payment details.",
        severity: "CRITICAL",
        category: "Payments",
        reproductionSteps: ["Open checkout", "Enter payment details"],
        likelyCause: "Payment validation state remains stale.",
        suggestedFix: "Reset payment validation state before submit.",
        priorityScore: 96,
        confidenceScore: 94,
        tags: ["payments", "checkout"],
        developerTask: "Investigate stale payment validation state.",
      },
    });

    expect(assertCanManageTicketMock).toHaveBeenCalledWith(
      {
        ticketCode: "BUG-4242",
        workspaceId: "workspace-1",
      },
      "user-1"
    );
    expect(assertCanModifyTicketMock).not.toHaveBeenCalled();

    expect(txMock.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: "CRITICAL",
          aiAnalysis: {
            upsert: expect.any(Object),
          },
          aiAnalysisRuns: {
            create: expect.objectContaining({
              summary: "Checkout cannot complete after valid payment details.",
              confidenceScore: 94,
            }),
          },
        }),
      })
    );
    expect(txMock.ticketActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TicketActivityType.AI_ANALYZED,
          title: "AI analysis regenerated",
        }),
      })
    );
  });

  it("saves feedback only for an analysis run belonging to the ticket", async () => {
    prismaMock.ticketAiAnalysisRun.findFirst.mockResolvedValue({
      id: "run-1",
    });
    prismaMock.ticketAiAnalysisRun.update.mockResolvedValue({
      id: "run-1",
      feedback: AiAnalysisFeedback.HELPFUL,
    });

    const result = await setTicketAiAnalysisFeedback({
      workspaceId: "workspace-1",
      ticketCode: "BUG-4242",
      analysisRunId: "run-1",
      feedback: AiAnalysisFeedback.HELPFUL,
    });

    expect(assertCanCommentOnTicketMock).toHaveBeenCalledWith(
      {
        ticketCode: "BUG-4242",
        workspaceId: "workspace-1",
      },
      "user-1"
    );

    expect(prismaMock.ticketAiAnalysisRun.findFirst).toHaveBeenCalledWith({
      where: {
        id: "run-1",
        ticketId: "ticket-1",
      },
      select: {
        id: true,
      },
    });
    expect(result.feedback).toBe(AiAnalysisFeedback.HELPFUL);
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

  it("requires ticket management permission when an assignee is supplied", async () => {
    hasTicketPermissionMock.mockReturnValue(false);

    await expect(
      createTicket({
        code: "BUG-1004",
        workspaceId: "workspace-1",
        projectId: "project-1",
        assigneeId: "user-2",
        title: "Attempted assignment",
        description: "Members cannot assign tickets during creation.",
      })
    ).rejects.toThrow("Only workspace owners and admins can assign tickets.");

    expect(assertWorkspaceMemberMock).not.toHaveBeenCalledWith(
      "workspace-1",
      "user-2"
    );
    expect(prismaMock.ticket.create).not.toHaveBeenCalled();
  });

  it("authorizes GitHub export failure-state mutations before writing", async () => {
    prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });

    await failTicketGitHubExport({
      workspaceId: "workspace-1",
      ticketCode: "BUG-4242",
      error: "GitHub failed",
    });

    expect(assertCanExportTicketMock).toHaveBeenCalledWith(
      {
        ticketCode: "BUG-4242",
        workspaceId: "workspace-1",
      },
      "user-1"
    );
    expect(prismaMock.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: "ticket-1",
        githubExportStatus: GitHubExportStatus.EXPORTING,
      },
      data: {
        githubExportStatus: GitHubExportStatus.FAILED,
        githubExportError: "GitHub failed",
      },
    });
  });

  it("blocks unauthorized GitHub export failure-state mutations", async () => {
    assertCanExportTicketMock.mockRejectedValue(
      new AuthorizationErrorMock("Ticket not found or access denied.")
    );

    await expect(
      failTicketGitHubExport({
        workspaceId: "workspace-1",
        ticketCode: "BUG-9001",
        error: "GitHub failed",
      })
    ).rejects.toBeInstanceOf(AuthorizationErrorMock);

    expect(prismaMock.ticket.updateMany).not.toHaveBeenCalled();
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
