import { z } from "zod";

import type { TicketDetail } from "@/lib/data/tickets";

export const githubIssueExportSchema = z.object({
  ticketCode: z
    .string()
    .trim()
    .min(1, "Ticket code is required.")
    .max(24, "Ticket code is invalid.")
    .regex(/^BUG-\d{4,12}$/, "Ticket code is invalid."),
  owner: z
    .string()
    .trim()
    .min(1, "Repository owner is required.")
    .max(39, "Repository owner is too long.")
    .regex(
      /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/,
      "Repository owner can only contain letters, numbers, and hyphens."
    ),
  repo: z
    .string()
    .trim()
    .min(1, "Repository name is required.")
    .max(100, "Repository name is too long.")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Repository name can only contain letters, numbers, dots, underscores, and hyphens."
    ),
  token: z
    .string()
    .trim()
    .min(8, "GitHub token is required.")
    .max(300, "GitHub token is too long."),
});

export type GitHubIssueExportInput = z.infer<typeof githubIssueExportSchema>;

export type GitHubIssueExportResult = {
  issueUrl: string;
  issueNumber: number;
};

type GitHubIssueResponse = {
  html_url?: unknown;
  number?: unknown;
};

function section(title: string, value?: string | null) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return `## ${title}\nNot provided.`;
  }

  return `## ${title}\n${normalizedValue}`;
}

function formatSteps(steps?: string | null) {
  const normalizedSteps = steps
    ?.split("\n")
    .map((step) => step.trim().replace(/^\d+\.\s*/, ""))
    .filter(Boolean);

  if (!normalizedSteps?.length) {
    return "Not provided.";
  }

  return normalizedSteps.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

export function formatTicketAsGitHubIssueBody(ticket: TicketDetail) {
  const aiSteps = readStringArray(ticket.aiAnalysis?.reproductionSteps);
  const steps =
    aiSteps.length > 0
      ? aiSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")
      : formatSteps(ticket.stepsToReproduce);

  return [
    "# Bug Summary",
    ticket.aiAnalysis?.summary?.trim() || ticket.description,
    section("Severity", ticket.severity.toLowerCase()),
    section("Category", ticket.category),
    section("Steps to Reproduce", steps),
    section("Expected Behavior", ticket.expectedBehavior),
    section("Actual Behavior", ticket.actualBehavior),
    section("Likely Cause", ticket.aiAnalysis?.likelyCause),
    section("Suggested Fix", ticket.aiAnalysis?.suggestedFix),
    "## Additional Context",
    "Generated from BugTriage AI.",
  ].join("\n\n");
}

export function getGitHubLabelsForTicket(ticket: TicketDetail) {
  return ["bug", `severity: ${ticket.severity.toLowerCase()}`];
}

function getSafeGitHubErrorMessage(status: number) {
  if (status === 401) {
    return "GitHub rejected the token. Check that it is valid and has permission to create issues.";
  }

  if (status === 403) {
    return "GitHub denied the request. Check token permissions or rate limits.";
  }

  if (status === 404) {
    return "GitHub repository was not found or the token cannot access it.";
  }

  if (status === 410) {
    return "GitHub Issues are disabled for this repository.";
  }

  if (status === 422) {
    return "GitHub could not create the issue. Check the repository and issue settings.";
  }

  return "GitHub export failed. Please try again.";
}

async function readGitHubJson(response: Response): Promise<GitHubIssueResponse> {
  try {
    return (await response.json()) as GitHubIssueResponse;
  } catch {
    return {};
  }
}

export async function exportTicketToGitHubIssue(
  input: GitHubIssueExportInput,
  ticket: TicketDetail
): Promise<GitHubIssueExportResult> {
  const issueResponse = await fetch(
    `https://api.github.com/repos/${input.owner}/${input.repo}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
        "User-Agent": "BugTriage-AI",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: ticket.title,
        body: formatTicketAsGitHubIssueBody(ticket),
      }),
    }
  );

  const issuePayload = await readGitHubJson(issueResponse);

  if (!issueResponse.ok) {
    throw new Error(getSafeGitHubErrorMessage(issueResponse.status));
  }

  if (
    typeof issuePayload.html_url !== "string" ||
    typeof issuePayload.number !== "number"
  ) {
    throw new Error("GitHub created the issue but returned an unexpected response.");
  }

  const labels = getGitHubLabelsForTicket(ticket);

  try {
    await fetch(
      `https://api.github.com/repos/${input.owner}/${input.repo}/issues/${issuePayload.number}/labels`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${input.token}`,
          "Content-Type": "application/json",
          "User-Agent": "BugTriage-AI",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          labels,
        }),
      }
    );
  } catch {
    // Label creation is best-effort. The issue export itself should remain useful.
  }

  return {
    issueUrl: issuePayload.html_url,
    issueNumber: issuePayload.number,
  };
}
