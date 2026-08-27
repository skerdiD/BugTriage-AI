import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  AuthenticationErrorMock,
  AuthorizationErrorMock,
  GitHubExportStateErrorMock,
  captureServerExceptionMock,
  claimTicketGitHubExportMock,
  completeTicketGitHubExportMock,
  exportTicketToGitHubIssueMock,
  failTicketGitHubExportMock,
  getArcjetDeniedMessageMock,
  getCurrentWorkspaceContextOrThrowMock,
  getGitHubIssueExportConfigMock,
  getTicketByCodeMock,
  logArcjetErrorMock,
  protectMock,
} = vi.hoisted(() => {
  class AuthenticationErrorMock extends Error {}

  class AuthorizationErrorMock extends Error {
    status = 403;
  }

  class GitHubExportStateErrorMock extends Error {
    status: number;

    constructor(message: string, status = 409) {
      super(message);
      this.status = status;
    }
  }

  return {
    AuthenticationErrorMock,
    AuthorizationErrorMock,
    GitHubExportStateErrorMock,
    captureServerExceptionMock: vi.fn(),
    claimTicketGitHubExportMock: vi.fn(),
    completeTicketGitHubExportMock: vi.fn(),
    exportTicketToGitHubIssueMock: vi.fn(),
    failTicketGitHubExportMock: vi.fn(),
    getArcjetDeniedMessageMock: vi.fn(),
    getCurrentWorkspaceContextOrThrowMock: vi.fn(),
    getGitHubIssueExportConfigMock: vi.fn(),
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
  GitHubExportStateError: GitHubExportStateErrorMock,
  claimTicketGitHubExport: claimTicketGitHubExportMock,
  completeTicketGitHubExport: completeTicketGitHubExportMock,
  failTicketGitHubExport: failTicketGitHubExportMock,
  getTicketByCode: getTicketByCodeMock,
}));

vi.mock("@/lib/integrations/github-issues", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/integrations/github-issues")>();

  return {
    ...actual,
    exportTicketToGitHubIssue: exportTicketToGitHubIssueMock,
    getGitHubIssueExportConfig: getGitHubIssueExportConfigMock,
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
import { GitHubIssueExportError } from "@/lib/integrations/github-issues";

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
    getGitHubIssueExportConfigMock.mockReturnValue({
      owner: "skerdiD",
      repo: "BugTriage-AI",
      token: "ghp_test_server_token",
    });
    claimTicketGitHubExportMock.mockResolvedValue(undefined);
    completeTicketGitHubExportMock.mockResolvedValue(undefined);
    failTicketGitHubExportMock.mockResolvedValue(undefined);
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
      createRequest({ ticketCode: "BUG-4242" })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      error: "You must be signed in before exporting tickets.",
    });
    expect(protectMock).not.toHaveBeenCalled();
    expect(getTicketByCodeMock).not.toHaveBeenCalled();
  });

  it("blocks real GitHub exports for the shared demo account", async () => {
    getCurrentWorkspaceContextOrThrowMock.mockResolvedValue({
      user: {
        id: "demo-user",
        email: "demo@bugtriage.ai",
      },
      workspace: {
        id: "workspace-1",
      },
    });

    const response = await POST(
      createRequest({ ticketCode: "DEMO-1001" })
    );

    expect(response.status).toBe(403);
    expect(protectMock).not.toHaveBeenCalled();
    expect(exportTicketToGitHubIssueMock).not.toHaveBeenCalled();
  });

  it("rate limits GitHub exports before reading the token payload", async () => {
    protectMock.mockResolvedValue(createDeniedDecision());

    const response = await POST(
      createRequest({ ticketCode: "BUG-4242" })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Too many requests. Please wait a few minutes and try again.",
    });
    expect(getTicketByCodeMock).not.toHaveBeenCalled();
    expect(exportTicketToGitHubIssueMock).not.toHaveBeenCalled();
  });

  it("rejects invalid ticket input", async () => {
    const response = await POST(
      createRequest({
        ticketCode: "bad-ticket",
      })
    );
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toContain("Ticket code");
    expect(getTicketByCodeMock).not.toHaveBeenCalled();
  });

  it("rejects cross-site and non-JSON mutation requests before authentication", async () => {
    const response = await POST(
      new Request("http://127.0.0.1:3000/api/github/issues", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "Sec-Fetch-Site": "cross-site",
        },
        body: JSON.stringify({ ticketCode: "BUG-4242" }),
      })
    );

    expect(response.status).toBe(415);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getCurrentWorkspaceContextOrThrowMock).not.toHaveBeenCalled();
    expect(protectMock).not.toHaveBeenCalled();
  });

  it("rejects oversized export requests before ticket lookup", async () => {
    const response = await POST(
      createRequest({
        ticketCode: "BUG-4242",
        padding: "x".repeat(9 * 1024),
      })
    );
    const text = await response.text();

    expect(response.status).toBe(413);
    expect(text).toContain("Export request is too large.");
    expect(getTicketByCodeMock).not.toHaveBeenCalled();
    expect(exportTicketToGitHubIssueMock).not.toHaveBeenCalled();
  });

  it("exports an authorized workspace ticket and never returns the token", async () => {
    const response = await POST(
      createRequest({ ticketCode: "BUG-4242" })
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(text)).toEqual({
      ok: true,
      issueUrl: "https://github.com/skerdiD/BugTriage-AI/issues/42",
      issueNumber: 42,
    });
    expect(claimTicketGitHubExportMock).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      ticketCode: "BUG-4242",
      actorId: "user-1",
    });
    expect(getTicketByCodeMock).toHaveBeenCalledWith("BUG-4242", "workspace-1");
    expect(exportTicketToGitHubIssueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_test_server_token",
      }),
      expect.objectContaining({
        code: "BUG-4242",
      })
    );
    expect(completeTicketGitHubExportMock).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      ticketCode: "BUG-4242",
      actorId: "user-1",
      issueUrl: "https://github.com/skerdiD/BugTriage-AI/issues/42",
      issueNumber: 42,
    });
  });

  it("blocks unauthorized ticket export before calling GitHub", async () => {
    claimTicketGitHubExportMock.mockRejectedValue(
      new AuthorizationErrorMock("Ticket not found or access denied.")
    );

    const response = await POST(
      createRequest({ ticketCode: "BUG-4242" })
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
      new GitHubIssueExportError(
        "GitHub rejected the token. Check that it is valid and has permission to create issues."
      )
    );

    const response = await POST(
      createRequest({ ticketCode: "BUG-4242" })
    );
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(text).toContain("GitHub rejected the token");
    expect(failTicketGitHubExportMock).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      ticketCode: "BUG-4242",
      error:
        "GitHub rejected the token. Check that it is valid and has permission to create issues.",
    });
  });

  it("does not expose arbitrary internal errors that look like GitHub errors", async () => {
    exportTicketToGitHubIssueMock.mockRejectedValue(
      new Error("GitHub token ghp_secret leaked from an internal dependency")
    );

    const response = await POST(createRequest({ ticketCode: "BUG-4242" }));
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).toContain("We couldn't export this ticket right now.");
    expect(text).not.toContain("ghp_secret");
  });

  it("returns a conflict when the ticket was already exported", async () => {
    claimTicketGitHubExportMock.mockRejectedValue(
      new GitHubExportStateErrorMock("This ticket was already exported.")
    );

    const response = await POST(createRequest({ ticketCode: "BUG-4242" }));

    expect(response.status).toBe(409);
    expect(exportTicketToGitHubIssueMock).not.toHaveBeenCalled();
  });
});
