import {
  AiProcessingStatus,
  GitHubExportStatus,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  exportTicketToGitHubIssue,
  formatTicketAsGitHubIssueBody,
  getSafeGitHubErrorMessage,
  getGitHubIssueExportConfig,
  githubIssueExportSchema,
  parseGitHubRepository,
} from "@/lib/integrations/github-issues";
import type { TicketDetail } from "@/lib/data/tickets";

const fetchMock = vi.fn();

function createTicket(overrides: Partial<TicketDetail> = {}) {
  return {
    id: "ticket-1",
    code: "BUG-4242",
    workspaceId: "workspace-1",
    projectId: "project-1",
    reporterId: "user-1",
    assigneeId: null,
    title: "Checkout payment form fails on Safari",
    description: "Users cannot submit payment on Safari mobile.",
    expectedBehavior: "Payment should submit successfully.",
    actualBehavior: "The submit button stays disabled.",
    stepsToReproduce: "1. Open checkout\n2. Enter card details\n3. Submit",
    browser: "safari",
    device: "ios-mobile",
    environment: "production",
    affectedPage: "/checkout",
    severity: TicketSeverity.HIGH,
    status: TicketStatus.NEW,
    category: "Payment",
    priorityScore: 88,
    aiConfidence: 91,
    aiProcessingStatus: AiProcessingStatus.COMPLETED,
    aiProcessingJobId: "ticket-analysis-ticket-1-test",
    aiProcessingError: null,
    aiProcessingStartedAt: new Date("2026-05-12T10:00:00Z"),
    aiProcessingCompletedAt: new Date("2026-05-12T10:00:10Z"),
    aiProcessingRequestedById: "user-1",
    aiInputContext: null,
    githubExportStatus: GitHubExportStatus.NOT_EXPORTED,
    githubIssueUrl: null,
    githubIssueNumber: null,
    githubExportedAt: null,
    githubExportError: null,
    createdAt: new Date("2026-05-12T10:00:00Z"),
    updatedAt: new Date("2026-05-12T10:00:00Z"),
    reporter: {
      id: "user-1",
      name: "Test User",
    },
    assignee: null,
    workspace: {
      id: "workspace-1",
      name: "Workspace",
      slug: "workspace",
    },
    project: {
      id: "project-1",
      name: "Project",
      slug: "project",
    },
    aiAnalysis: {
      id: "analysis-1",
      ticketId: "ticket-1",
      summary: "Safari users cannot complete checkout payments.",
      likelyCause: "Safari validation events are not updating button state.",
      suggestedFix: "Normalize validation events and add Safari coverage.",
      reproductionSteps: [
        "Open checkout on Safari.",
        "Enter valid card details.",
        "Observe disabled submit button.",
      ],
      tags: ["checkout", "safari"],
      confidenceScore: 91,
      createdAt: new Date("2026-05-12T10:00:00Z"),
      updatedAt: new Date("2026-05-12T10:00:00Z"),
    },
    aiAnalysisRuns: [],
    attachments: [],
    comments: [],
    activities: [],
    ...overrides,
  } satisfies TicketDetail;
}

describe("GitHub Issues export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("validates ticket input without accepting client credentials", () => {
    const result = githubIssueExportSchema.safeParse({
      ticketCode: "bad-ticket",
    });

    expect(result.success).toBe(false);
  });

  it("reads repository credentials only from server environment variables", () => {
    expect(getGitHubIssueExportConfig()).toEqual({
      owner: "skerdiD",
      repo: "BugTriage-AI",
      token: "ghp_test_server_token",
    });
  });

  it("parses GitHub repository slugs and URLs", () => {
    expect(parseGitHubRepository("skerdiD/BugTriage-AI")).toEqual({
      ok: true,
      owner: "skerdiD",
      repo: "BugTriage-AI",
    });
    expect(parseGitHubRepository("https://github.com/skerdiD/BugTriage-AI.git")).toEqual({
      ok: true,
      owner: "skerdiD",
      repo: "BugTriage-AI",
    });
    expect(parseGitHubRepository("skerdiD/Bug Triage")).toEqual({
      ok: false,
      error:
        "Repository name can only contain letters, numbers, dots, underscores, and hyphens.",
    });
  });

  it("creates a GitHub issue and ignores best-effort label failures", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          html_url: "https://github.com/skerdiD/BugTriage-AI/issues/12",
          number: 12,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

    const result = await exportTicketToGitHubIssue(
      {
        owner: "skerdiD",
        repo: "BugTriage-AI",
        token: "ghp_valid_test_token",
      },
      createTicket()
    );

    expect(result).toEqual({
      issueUrl: "https://github.com/skerdiD/BugTriage-AI/issues/12",
      issueNumber: 12,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/repos/skerdiD/BugTriage-AI/issues"
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      title: "Checkout payment form fails on Safari",
      body: expect.stringContaining("## Suggested Fix"),
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      labels: [
        "bug",
        "severity: high",
        "category: payment",
        "priority: high",
        "ai: checkout",
        "ai: safari",
      ],
    });
  });

  it("returns a safe error when GitHub rejects the export", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        message: "Bad credentials",
      }),
    });

    await expect(
      exportTicketToGitHubIssue(
        {
          owner: "skerdiD",
          repo: "BugTriage-AI",
          token: "ghp_invalid_test_token",
        },
        createTicket()
      )
    ).rejects.toThrow(
      "GitHub rejected the token. Check that it is valid and has permission to create issues."
    );
  });

  it("maps rate limit and network failures to safe human messages", async () => {
    expect(
      getSafeGitHubErrorMessage(
        403,
        new Response("{}", {
          status: 403,
          headers: {
            "x-ratelimit-remaining": "0",
          },
        })
      )
    ).toBe("GitHub rate limit reached. Wait a few minutes, then try again.");

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(
      exportTicketToGitHubIssue(
        {
          owner: "skerdiD",
          repo: "BugTriage-AI",
          token: "ghp_valid_test_token",
        },
        createTicket()
      )
    ).rejects.toThrow(
      "GitHub export failed because GitHub could not be reached."
    );
  });

  it("formats ticket AI analysis as clean Markdown", () => {
    const body = formatTicketAsGitHubIssueBody(createTicket());

    expect(body).toContain("# BUG-4242: Checkout payment form fails on Safari");
    expect(body).toContain("## Triage summary");
    expect(body).toContain("## Original Bug Report");
    expect(body).toContain("| Priority score | 88 |");
    expect(body).toContain("| Draft confidence | 91 |");
    expect(body).toContain("| Affected page | /checkout |");
    expect(body).toContain("## Steps to Reproduce");
    expect(body).toContain("1. Open checkout on Safari.");
    expect(body).toContain("## Likely Cause");
    expect(body).toContain("## Suggested Fix");
    expect(body).toContain("## Additional Context");
    expect(body).toContain("Exported from BugTriage ticket `BUG-4242`.");
  });

  it("formats missing optional ticket fields without empty sections", () => {
    const body = formatTicketAsGitHubIssueBody(
      createTicket({
        expectedBehavior: null,
        actualBehavior: null,
        stepsToReproduce: null,
        category: null,
        priorityScore: null,
        aiConfidence: null,
        aiAnalysis: null,
      })
    );

    expect(body).toContain("Not provided.");
    expect(body).toContain("## Steps to Reproduce\nNot provided.");
  });

  it("escapes table separators and preserves code fences around untrusted text", () => {
    const body = formatTicketAsGitHubIssueBody(
      createTicket({
        category: "Payments | Checkout",
        affectedPage: "/checkout\n/admin | hidden",
        stepsToReproduce:
          "1. Open checkout\n2. Paste ```malicious fence```\n3. Submit",
        aiAnalysis: null,
      })
    );

    expect(body).toContain("| Category | Payments \\| Checkout |");
    expect(body).toContain("| Affected page | /checkout<br />/admin \\| hidden |");
    expect(body).toContain("````text\n1. Open checkout");
    expect(body).toContain("Paste ```malicious fence```");
  });
});
