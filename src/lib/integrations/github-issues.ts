import "server-only";

import { z } from "zod";

import type { TicketDetail } from "@/lib/data/tickets";
import { getSafeGitHubIssueUrl } from "@/lib/security/urls";

const GITHUB_API_TIMEOUT_MS = 10_000;
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_USER_AGENT = "BugTriage-AI";
const MAX_GITHUB_TITLE_LENGTH = 256;
const MAX_GITHUB_BODY_LENGTH = 60_000;
const MAX_GITHUB_LABEL_LENGTH = 50;

const githubOwnerSchema = z
  .string()
  .trim()
  .min(1, "Repository owner is required.")
  .max(39, "Repository owner is too long.")
  .regex(
    /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/,
    "Repository owner can only contain letters, numbers, and hyphens."
  );

const githubRepoSchema = z
  .string()
  .trim()
  .min(1, "Repository name is required.")
  .max(100, "Repository name is too long.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Repository name can only contain letters, numbers, dots, underscores, and hyphens."
  )
  .refine((value) => value !== "." && value !== "..", {
    message: "Repository name is invalid.",
  });

export const githubIssueExportSchema = z.object({
  ticketCode: z
    .string()
    .trim()
    .min(1, "Ticket code is required.")
    .max(24, "Ticket code is invalid.")
    .regex(/^BUG-\d{4,12}$/, "Ticket code is invalid."),
});

export type GitHubIssueExportInput = z.infer<typeof githubIssueExportSchema>;

export type GitHubIssueExportConfig = {
  owner: string;
  repo: string;
  token: string;
};

export type GitHubIssueExportResult = {
  issueUrl: string;
  issueNumber: number;
  labelsApplied: boolean;
};

export class GitHubIssueExportError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "GitHubIssueExportError";
    this.status = status;
  }
}

type GitHubIssueResponse = {
  html_url?: unknown;
  number?: unknown;
};

export function parseGitHubRepository(input: string) {
  const normalizedInput = input.trim().replace(/^https:\/\/github\.com\//i, "");
  const [owner, repo, ...extra] = normalizedInput
    .replace(/\.git$/i, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!owner || !repo || extra.length > 0) {
    return {
      ok: false as const,
      error: "Enter the repository as owner/repo, for example skerdiD/BugTriage-AI.",
    };
  }

  const parsedOwner = githubOwnerSchema.safeParse(owner);
  if (!parsedOwner.success) {
    return {
      ok: false as const,
      error: parsedOwner.error.issues[0]?.message ?? "Repository owner is invalid.",
    };
  }

  const parsedRepo = githubRepoSchema.safeParse(repo);
  if (!parsedRepo.success) {
    return {
      ok: false as const,
      error: parsedRepo.error.issues[0]?.message ?? "Repository name is invalid.",
    };
  }

  return {
    ok: true as const,
    owner: parsedOwner.data,
    repo: parsedRepo.data,
  };
}

export function getGitHubIssueExportConfig(): GitHubIssueExportConfig {
  const owner = githubOwnerSchema.safeParse(process.env.GITHUB_REPOSITORY_OWNER);
  const repo = githubRepoSchema.safeParse(process.env.GITHUB_REPOSITORY_NAME);
  const token = z
    .string()
    .trim()
    .min(16)
    .max(500)
    .regex(/^[\x21-\x7e]+$/)
    .safeParse(process.env.GITHUB_TOKEN);

  if (!owner.success || !repo.success || !token.success) {
    throw new GitHubIssueExportError(
      "GitHub export is not configured. Check the server repository and token settings.",
      503
    );
  }

  return {
    owner: owner.data,
    repo: repo.data,
    token: token.data,
  };
}

function sanitizeGitHubText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/@(?=[A-Za-z0-9_-])/g, "@\u200b");
}

function normalizeMarkdownValue(value?: string | null) {
  const normalizedValue = value ? sanitizeGitHubText(value).trim() : "";

  return normalizedValue || "Not provided.";
}

function normalizeSingleLineMarkdownValue(value: string) {
  return sanitizeGitHubText(value).replace(/\s+/g, " ").trim();
}

function escapeMarkdownTableValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br />")
    .trim();
}

function section(title: string, value?: string | null) {
  return `## ${title}\n${normalizeMarkdownValue(value)}`;
}

function metadataRow(label: string, value?: string | number | null) {
  const normalizedValue =
    typeof value === "number" ? value.toString() : normalizeMarkdownValue(value);

  return `| ${escapeMarkdownTableValue(label)} | ${escapeMarkdownTableValue(normalizedValue)} |`;
}

function truncateForGitHub(value: string, maxLength: number) {
  const characters = Array.from(value);

  if (characters.length <= maxLength) {
    return value;
  }

  return `${characters.slice(0, maxLength - 31).join("").trimEnd()}\n\n_Trimmed for GitHub export._`;
}

function buildIssueTitle(ticket: TicketDetail) {
  const title =
    normalizeSingleLineMarkdownValue(ticket.title) || `${ticket.code} bug report`;

  return truncateForGitHub(title, MAX_GITHUB_TITLE_LENGTH);
}

function formatOptionalTags(tags: unknown) {
  const tagList = readStringArray(tags);

  return tagList.length > 0 ? tagList.join(", ") : "Not provided.";
}

function formatReporter(ticket: TicketDetail) {
  return ticket.reporter?.name ?? "Not provided.";
}

function formatAssignee(ticket: TicketDetail) {
  return ticket.assignee?.name ?? "Unassigned.";
}

function sectionWithCodeFence(title: string, value?: string | null) {
  const normalizedValue = value ? sanitizeGitHubText(value).trim() : "";

  if (!normalizedValue) {
    return `## ${title}\nNot provided.`;
  }

  let fence = "```";

  while (normalizedValue.includes(fence)) {
    fence += "`";
  }

  return `## ${title}\n\n${fence}text\n${normalizedValue}\n${fence}`;
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
  const body = [
    `# ${ticket.code}: ${buildIssueTitle(ticket)}`,
    section("Triage summary", ticket.aiAnalysis?.summary ?? ticket.description),
    section("Original bug report", ticket.description),
    "## Triage metadata",
    [
      "| Field | Value |",
      "| --- | --- |",
      metadataRow("Severity", ticket.severity.toLowerCase()),
      metadataRow("Status", ticket.status.toLowerCase().replaceAll("_", " ")),
      metadataRow("Priority score", ticket.priorityScore),
      metadataRow(
        "AI confidence",
        ticket.aiAnalysis?.confidenceScore ?? ticket.aiConfidence
      ),
      metadataRow("Category", ticket.category),
      metadataRow("Tags", formatOptionalTags(ticket.aiAnalysis?.tags)),
      metadataRow("Workspace", ticket.workspace.name),
      metadataRow("Project", ticket.project.name),
      metadataRow("Reporter", formatReporter(ticket)),
      metadataRow("Assignee", formatAssignee(ticket)),
    ].join("\n"),
    "## Environment",
    [
      "| Field | Value |",
      "| --- | --- |",
      metadataRow("Browser", ticket.browser),
      metadataRow("Device", ticket.device),
      metadataRow("Environment", ticket.environment),
      metadataRow("Affected page", ticket.affectedPage),
    ].join("\n"),
    section("Steps to reproduce", steps),
    section("Expected behavior", ticket.expectedBehavior),
    section("Actual behavior", ticket.actualBehavior),
    section("Likely cause", ticket.aiAnalysis?.likelyCause),
    section("Suggested fix", ticket.aiAnalysis?.suggestedFix),
    sectionWithCodeFence(
      "Submitted reproduction notes",
      ticket.stepsToReproduce
    ),
    "## Additional context",
    [
      `Exported from BugTriage ticket \`${ticket.code}\`.`,
      `Created: ${ticket.createdAt.toISOString()}`,
      `Updated: ${ticket.updatedAt.toISOString()}`,
    ].join("\n"),
  ].join("\n\n");

  return truncateForGitHub(body, MAX_GITHUB_BODY_LENGTH);
}

export function getGitHubLabelsForTicket(ticket: TicketDetail) {
  function normalizeLabel(label: string) {
    return normalizeSingleLineMarkdownValue(label).slice(0, MAX_GITHUB_LABEL_LENGTH);
  }

  const labels = [
    "bug",
    `severity: ${ticket.severity.toLowerCase()}`,
    ticket.category ? `category: ${ticket.category.toLowerCase()}` : null,
    ticket.priorityScore && ticket.priorityScore >= 80 ? "priority: high" : null,
    ...readStringArray(ticket.aiAnalysis?.tags).map((tag) => `ai: ${tag}`),
  ];

  return Array.from(
    new Set(
      labels
        .filter((label): label is string => Boolean(label))
        .map((label) => normalizeLabel(label))
    )
  )
    .filter(Boolean)
    .slice(0, 10) as string[];
}

export function getSafeGitHubErrorMessage(status: number, response?: Response) {
  if (status === 401) {
    return "GitHub rejected the token. Check that it is valid and has permission to create issues.";
  }

  if (status === 403) {
    const remaining = response?.headers.get("x-ratelimit-remaining");

    if (remaining === "0") {
      return "GitHub rate limit reached. Wait a few minutes, then try again.";
    }

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

async function githubFetch(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GITHUB_API_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GitHubIssueExportError(
        "GitHub export timed out. Please try again."
      );
    }

    throw new GitHubIssueExportError(
      "GitHub export failed because GitHub could not be reached."
    );
  } finally {
    clearTimeout(timeout);
  }
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": GITHUB_USER_AGENT,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

export async function exportTicketToGitHubIssue(
  config: GitHubIssueExportConfig,
  ticket: TicketDetail
): Promise<GitHubIssueExportResult> {
  const title = buildIssueTitle(ticket);
  const body = formatTicketAsGitHubIssueBody(ticket);

  if (!title.trim() || !body.trim()) {
    throw new GitHubIssueExportError(
      "GitHub issue payload is empty. Check the ticket details."
    );
  }

  const issueResponse = await githubFetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
    {
      method: "POST",
      headers: githubHeaders(config.token),
      body: JSON.stringify({
        title,
        body,
      }),
    }
  );

  const issuePayload = await readGitHubJson(issueResponse);

  if (!issueResponse.ok) {
    throw new GitHubIssueExportError(
      getSafeGitHubErrorMessage(issueResponse.status, issueResponse)
    );
  }

  if (
    typeof issuePayload.number !== "number" ||
    !Number.isSafeInteger(issuePayload.number) ||
    issuePayload.number < 1
  ) {
    throw new GitHubIssueExportError(
      "GitHub created the issue but returned an unexpected response."
    );
  }

  const issueUrl =
    typeof issuePayload.html_url === "string"
      ? getSafeGitHubIssueUrl(issuePayload.html_url, issuePayload.number)
      : null;

  if (!issueUrl) {
    throw new GitHubIssueExportError(
      "GitHub created the issue but returned an unexpected response."
    );
  }

  const labels = getGitHubLabelsForTicket(ticket);
  let labelsApplied = false;

  try {
    const labelResponse = await githubFetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${issuePayload.number}/labels`,
      {
        method: "POST",
        headers: githubHeaders(config.token),
        body: JSON.stringify({
          labels,
        }),
      }
    );

    labelsApplied = labelResponse.ok;
  } catch {
    // Label creation is best-effort. The issue export itself should remain useful.
  }

  return {
    issueUrl,
    issueNumber: issuePayload.number,
    labelsApplied,
  };
}
