import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  AuthenticationErrorMock,
  AuthorizationErrorMock,
  captureServerExceptionMock,
  exportTicketToGitHubIssueMock,
  getArcjetDeniedMessageMock,
  getCurrentWorkspaceContextOrThrowMock,
  getTicketByCodeMock,
  logArcjetErrorMock,
  protectMock,
} = vi.hoisted(() => {
  class AuthenticationErrorMock extends Error {}

  class AuthorizationErrorMock extends Error {
    status = 403;
  }

  return {
    AuthenticationErrorMock,
    AuthorizationErrorMock,
    captureServerExceptionMock: vi.fn(),
    exportTicketToGitHubIssueMock: vi.fn(),
    getArcjetDeniedMessageMock: vi.fn(),
    getCurrentWorkspaceContextOrThrowMock: vi.fn(),
    getTicketByCodeMock: vi.fn(),
    logArcjetErrorMock: vi.fn(),
    protectMock: vi.fn(),
  };
});

vi.mock("@/lib/auth/authorization", () => ({
  AuthorizationError: AuthorizationErrorMock,
}));

vi.mock("@/lib/auth/session", () => ({
  AuthenticationError: AuthenticationErrorMock,
  getCurrentWorkspaceContextOrThrow: getCurrentWorkspaceContextOrThrowMock,
}));

vi.mock("@/lib/data/tickets", () => ({
  getTicketByCode: getTicketByCodeMock,
}));

vi.mock("@/lib/integrations/github-issues", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/integrations/github-issues")>();

  return {
    ...actual,
    exportTicketToGitHubIssue: exportTicketToGitHubIssueMock,
  };
});

vi.mock("@/lib/observability/server-monitoring", () => ({
  captureServerException: captureServerExceptionMock,
}));

vi.mock("@/lib/security/arcjet", () => ({
  getArcjetDeniedMessage: getArcjetDeniedMessageMock,
  githubIssueExportProtection: {
    protect: protectMock,
  },
  logArcjetError: logArcjetErrorMock,
}));

import { POST } from "@/app/api/github/issues/route";

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

function createDeniedDecision() {
  return {
    isDenied: () => true,
    isErrored: () => false,
    reason: {
      message: "Too many requests.",
      isRateLimit: () => true,
      isBot: () => false,
      isShield: () => false,
    },
  };
}

function createRequest(body: unknown) {
  return new Request("http://127.0.0.1:3000/api/github/issues", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/github/issues", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentWorkspaceContextOrThrowMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
      workspace: {
        id: "workspace-1",
      },
    });
    protectMock.mockResolvedValue(createAllowedDecision());
    getArcjetDeniedMessageMock.mockReturnValue(
      "Too many requests. Please wait a few minutes and try again."
    );
    getTicketByCodeMock.mockResolvedValue({
      code: "BUG-4242",
      workspaceId: "workspace-1",
    });
    exportTicketToGitHubIssueMock.mockResolvedValue({
      issueUrl: "https://github.com/skerdiD/BugTriage-AI/issues/42",
      issueNumber: 42,
    });
  });

  it("requires an authenticated workspace before reading export input", async () => {
    getCurrentWorkspaceContextOrThrowMock.mockRejectedValue(
      new AuthenticationErrorMock("Authentication required.")
    );

    const response = await POST(
      createRequest({
        ticketCode: "BUG-4242",
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_secret_token",
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      error: "You must be signed in before exporting tickets.",
    });
    expect(protectMock).not.toHaveBeenCalled();
    expect(getTicketByCodeMock).not.toHaveBeenCalled();
  });

  it("rate limits GitHub exports before reading the token payload", async () => {
    protectMock.mockResolvedValue(createDeniedDecision());

    const response = await POST(
      createRequest({
        ticketCode: "BUG-4242",
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_secret_token",
      })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Too many requests. Please wait a few minutes and try again.",
    });
    expect(getTicketByCodeMock).not.toHaveBeenCalled();
    expect(exportTicketToGitHubIssueMock).not.toHaveBeenCalled();
  });

  it("rejects invalid GitHub input without echoing the token", async () => {
    const response = await POST(
      createRequest({
        ticketCode: "BUG-4242",
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "bad token with spaces",
      })
    );
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toContain("GitHub token can only contain");
    expect(text).not.toContain("bad token with spaces");
    expect(getTicketByCodeMock).not.toHaveBeenCalled();
  });

  it("exports an authorized workspace ticket and never returns the token", async () => {
    const response = await POST(
      createRequest({
        ticketCode: "BUG-4242",
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_secret_token",
      })
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(text)).toEqual({
      ok: true,
      issueUrl: "https://github.com/skerdiD/BugTriage-AI/issues/42",
      issueNumber: 42,
    });
    expect(text).not.toContain("ghp_secret_token");
    expect(getTicketByCodeMock).toHaveBeenCalledWith("BUG-4242", "workspace-1");
    expect(exportTicketToGitHubIssueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketCode: "BUG-4242",
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_secret_token",
      }),
      expect.objectContaining({
        code: "BUG-4242",
      })
    );
  });

  it("blocks unauthorized ticket export before calling GitHub", async () => {
    getTicketByCodeMock.mockRejectedValue(
      new AuthorizationErrorMock("Ticket not found or access denied.")
    );

    const response = await POST(
      createRequest({
        ticketCode: "BUG-4242",
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_secret_token",
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Ticket not found or access denied.",
    });
    expect(exportTicketToGitHubIssueMock).not.toHaveBeenCalled();
  });

  it("returns safe GitHub failure errors without the token", async () => {
    exportTicketToGitHubIssueMock.mockRejectedValue(
      new Error(
        "GitHub rejected the token. Check that it is valid and has permission to create issues."
      )
    );

    const response = await POST(
      createRequest({
        ticketCode: "BUG-4242",
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_secret_token",
      })
    );
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(text).toContain("GitHub rejected the token");
    expect(text).not.toContain("ghp_secret_token");
  });
});
