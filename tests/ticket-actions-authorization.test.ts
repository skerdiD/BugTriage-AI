import { AiAnalysisFeedback, TicketStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  AuthenticationErrorMock,
  AuthorizationErrorMock,
  addTicketCommentMock,
  assertCanManageTicketMock,
  captureServerExceptionMock,
  dispatchTicketAnalysisMock,
  getArcjetRequestMock,
  getCurrentUserOrThrowMock,
  getCurrentWorkspaceContextOrThrowMock,
  protectMock,
  setTicketAiAnalysisFeedbackMock,
  updateTicketStatusMock,
} = vi.hoisted(() => {
  class AuthenticationErrorMock extends Error {}

  class AuthorizationErrorMock extends Error {
    status = 403;
  }

  return {
    AuthenticationErrorMock,
    AuthorizationErrorMock,
    addTicketCommentMock: vi.fn(),
    assertCanManageTicketMock: vi.fn(),
    captureServerExceptionMock: vi.fn(),
    dispatchTicketAnalysisMock: vi.fn(),
    getArcjetRequestMock: vi.fn(),
    getCurrentUserOrThrowMock: vi.fn(),
    getCurrentWorkspaceContextOrThrowMock: vi.fn(),
    protectMock: vi.fn(),
    setTicketAiAnalysisFeedbackMock: vi.fn(),
    updateTicketStatusMock: vi.fn(),
  };
});

vi.mock("@arcjet/next", () => ({
  request: getArcjetRequestMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/ai/bug-triage", () => ({
  getPublicAiTriageFailureMessage: () =>
    "AI analysis is temporarily unavailable. Please try again.",
}));

vi.mock("@/lib/auth/authorization", () => ({
  AuthorizationError: AuthorizationErrorMock,
  assertCanManageTicket: assertCanManageTicketMock,
}));

vi.mock("@/lib/auth/session", () => ({
  AuthenticationError: AuthenticationErrorMock,
  getCurrentUserOrThrow: getCurrentUserOrThrowMock,
  getCurrentWorkspaceContextOrThrow: getCurrentWorkspaceContextOrThrowMock,
}));

vi.mock("@/lib/demo", () => ({
  DEMO_READ_ONLY_MESSAGE: "Demo mode is read-only.",
  isDemoTicketCode: () => false,
  isDemoUser: () => false,
}));

vi.mock("@/lib/data/tickets", () => ({
  MAX_TICKET_COMMENT_LENGTH: 4_000,
  addTicketComment: addTicketCommentMock,
  setTicketAiAnalysisFeedback: setTicketAiAnalysisFeedbackMock,
  updateTicketStatus: updateTicketStatusMock,
}));

vi.mock("@/lib/observability/server-monitoring", () => ({
  captureServerException: captureServerExceptionMock,
}));

vi.mock("@/lib/queue/dispatch-ticket-analysis", () => ({
  dispatchTicketAnalysis: dispatchTicketAnalysisMock,
}));

vi.mock("@/lib/security/arcjet", () => ({
  bugSubmissionProtection: {
    protect: protectMock,
  },
  getArcjetDeniedMessage: () => "Request denied.",
  logArcjetError: vi.fn(),
}));

import {
  addTicketCommentAction,
  regenerateTicketAiAnalysisAction,
  setTicketAiAnalysisFeedbackAction,
  updateTicketStatusAction,
} from "@/app/(dashboard)/tickets/[ticketId]/actions";

function createAllowedDecision() {
  return {
    isDenied: () => false,
    isErrored: () => false,
    reason: {
      message: "Allowed.",
      isRateLimit: () => false,
      isBot: () => false,
      isShield: () => false,
    },
  };
}

describe("ticket server-action authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserOrThrowMock.mockResolvedValue({
      id: "user-1",
      email: "member@example.com",
    });
    getCurrentWorkspaceContextOrThrowMock.mockResolvedValue({
      user: { id: "user-1" },
      workspace: { id: "workspace-1" },
      role: "MEMBER",
    });
    assertCanManageTicketMock.mockResolvedValue({
      ticket: { id: "ticket-1", code: "BUG-1001" },
    });
    getArcjetRequestMock.mockResolvedValue({ headers: new Headers() });
    protectMock.mockResolvedValue(createAllowedDecision());
    dispatchTicketAnalysisMock.mockResolvedValue({
      mode: "queued",
      jobId: "ticket-analysis-1",
      queueName: "bug-analysis",
    });
  });

  it.each([
    {
      name: "comment",
      invoke: () =>
        addTicketCommentAction({ ticketCode: "BUG-1001", body: "Investigating." }),
      expectedError: "You must be signed in to comment on tickets.",
    },
    {
      name: "status update",
      invoke: () =>
        updateTicketStatusAction({
          ticketCode: "BUG-1001",
          status: TicketStatus.INVESTIGATING,
        }),
      expectedError: "You must be signed in to update tickets.",
    },
    {
      name: "AI regeneration",
      invoke: () => regenerateTicketAiAnalysisAction({ ticketCode: "BUG-1001" }),
      expectedError: "You must be signed in to manage ticket analysis.",
    },
    {
      name: "AI feedback",
      invoke: () =>
        setTicketAiAnalysisFeedbackAction({
          ticketCode: "BUG-1001",
          analysisRunId: "analysis-run-1",
          feedback: AiAnalysisFeedback.HELPFUL,
        }),
      expectedError: "You must be signed in to leave AI feedback.",
    },
  ])("rejects direct unauthenticated $name invocation", async ({ invoke, expectedError }) => {
    getCurrentUserOrThrowMock.mockRejectedValue(
      new AuthenticationErrorMock("Authentication required.")
    );

    await expect(invoke()).resolves.toEqual({
      ok: false,
      error: expectedError,
    });

    expect(addTicketCommentMock).not.toHaveBeenCalled();
    expect(updateTicketStatusMock).not.toHaveBeenCalled();
    expect(setTicketAiAnalysisFeedbackMock).not.toHaveBeenCalled();
    expect(dispatchTicketAnalysisMock).not.toHaveBeenCalled();
  });

  it("allows direct member collaboration and ordinary workflow updates", async () => {
    await expect(
      addTicketCommentAction({
        ticketCode: "BUG-1001",
        body: "Reproduced in staging.",
      })
    ).resolves.toEqual({ ok: true });
    await expect(
      updateTicketStatusAction({
        ticketCode: "BUG-1001",
        status: TicketStatus.INVESTIGATING,
      })
    ).resolves.toEqual({ ok: true });
    await expect(
      setTicketAiAnalysisFeedbackAction({
        ticketCode: "BUG-1001",
        analysisRunId: "analysis-run-1",
        feedback: AiAnalysisFeedback.HELPFUL,
      })
    ).resolves.toMatchObject({ ok: true });

    expect(addTicketCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "workspace-1", authorId: "user-1" })
    );
    expect(updateTicketStatusMock).toHaveBeenCalledWith(
      "BUG-1001",
      "workspace-1",
      TicketStatus.INVESTIGATING,
      "user-1"
    );
    expect(setTicketAiAnalysisFeedbackMock).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "workspace-1" })
    );
  });

  it("denies a member's direct AI regeneration before dispatch", async () => {
    assertCanManageTicketMock.mockRejectedValue(
      new AuthorizationErrorMock(
        "Only workspace owners and admins can manage tickets."
      )
    );

    await expect(
      regenerateTicketAiAnalysisAction({ ticketCode: "BUG-1001" })
    ).resolves.toEqual({
      ok: false,
      error: "Only workspace owners and admins can manage tickets.",
    });

    expect(assertCanManageTicketMock).toHaveBeenCalledWith(
      {
        ticketCode: "BUG-1001",
        workspaceId: "workspace-1",
      },
      "user-1"
    );
    expect(getArcjetRequestMock).not.toHaveBeenCalled();
    expect(dispatchTicketAnalysisMock).not.toHaveBeenCalled();
  });

  it("denies a cross-workspace direct status update without mutating", async () => {
    updateTicketStatusMock.mockRejectedValue(
      new AuthorizationErrorMock("Ticket not found or access denied.")
    );

    await expect(
      updateTicketStatusAction({
        ticketCode: "BUG-9001",
        status: TicketStatus.CLOSED,
      })
    ).resolves.toEqual({
      ok: false,
      error: "Ticket not found or access denied.",
    });
  });
});
