import { TicketSeverity, TicketStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  exportTicketToGitHubIssue,
  formatTicketAsGitHubIssueBody,
  githubIssueExportSchema,
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
      rawAiResponse: {},
      createdAt: new Date("2026-05-12T10:00:00Z"),
      updatedAt: new Date("2026-05-12T10:00:00Z"),
    },
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

  it("validates owner, repo, token, and ticket input", () => {
    const result = githubIssueExportSchema.safeParse({
      ticketCode: "BUG-4242",
      owner: "-bad-owner",
      repo: "bad repo",
      token: "short",
    });

    expect(result.success).toBe(false);
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
        ticketCode: "BUG-4242",
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
      labels: ["bug", "severity: high"],
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
          ticketCode: "BUG-4242",
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

  it("formats ticket AI analysis as clean Markdown", () => {
    const body = formatTicketAsGitHubIssueBody(createTicket());

    expect(body).toContain("# Bug Summary");
    expect(body).toContain("## Steps to Reproduce");
    expect(body).toContain("1. Open checkout on Safari.");
    expect(body).toContain("## Additional Context");
    expect(body).toContain("Generated from BugTriage AI.");
  });
});
