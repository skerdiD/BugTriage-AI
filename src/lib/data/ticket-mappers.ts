import {
  AttachmentType as DbAttachmentType,
  TicketSeverity as DbTicketSeverity,
  TicketStatus as DbTicketStatus,
} from "@prisma/client";
import { format, formatDistanceToNow } from "date-fns";

import type {
  PriorityQueueItem,
  RecentTicket,
  UiTicket,
  UiTicketListItem,
  UiTicketSeverity,
  UiTicketStatus,
} from "@/lib/dashboard/types";
import type { SimilarIssue } from "@/lib/data/similar-issues";
import type { TicketDetail, TicketListItem } from "@/lib/data/tickets";

function initialsFromName(name?: string | null) {
  if (!name) return "NA";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeDate(date: Date) {
  return `${formatDistanceToNow(date, { addSuffix: false })} ago`;
}

function splitSteps(value?: string | null) {
  if (!value) return ["Review the submitted report and reproduce the issue."];

  return value
    .split("\n")
    .map((step) => step.trim().replace(/^\d+\.\s*/, ""))
    .filter(Boolean);
}

function stringArrayFromJson(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

function mapSimilarIssueToUiIssue(issue: SimilarIssue) {
  return {
    id: issue.code,
    title: issue.title,
    severity: mapDbSeverityToUiSeverity(issue.severity),
    status: mapDbStatusToUiStatus(issue.status),
    priorityScore: issue.priorityScore,
    matchPercent: Math.round(issue.similarityScore * 100),
  };
}

export function mapDbSeverityToUiSeverity(
  severity: DbTicketSeverity
): UiTicketSeverity {
  const map: Record<DbTicketSeverity, UiTicketSeverity> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };

  return map[severity];
}

export function mapDbStatusToUiStatus(status: DbTicketStatus): UiTicketStatus {
  const map: Record<DbTicketStatus, UiTicketStatus> = {
    NEW: "New",
    INVESTIGATING: "Investigating",
    IN_PROGRESS: "In Progress",
    FIXED: "Fixed",
    CLOSED: "Closed",
  };

  return map[status];
}

export function mapTicketListItemToUiTicket(
  ticket: TicketListItem
): UiTicketListItem {
  const assigneeName = ticket.assignee?.name ?? "Unassigned";

  return {
    id: ticket.code,
    title: ticket.title,
    severity: mapDbSeverityToUiSeverity(ticket.severity),
    status: mapDbStatusToUiStatus(ticket.status),
    category: ticket.category ?? "Uncategorized",
    assignee: assigneeName,
    assigneeInitials: initialsFromName(assigneeName),
    assigneeRole: "Team Member",
    createdAt: relativeDate(ticket.createdAt),
    confidence: ticket.aiConfidence ?? ticket.aiAnalysis?.confidenceScore ?? 0,
  };
}

export function mapTicketDetailToUiTicket(
  ticket: TicketDetail,
  attachmentDownloadUrls: Record<string, string | null> = {},
  similarIssues: SimilarIssue[] = []
): UiTicket {
  const assigneeName = ticket.assignee?.name ?? "Unassigned";
  const analysisSteps = stringArrayFromJson(ticket.aiAnalysis?.reproductionSteps);
  const tags = stringArrayFromJson(ticket.aiAnalysis?.tags);
  const aiHistory = (ticket.aiAnalysisRuns ?? []).map((run) => ({
    id: run.id,
    severity: mapDbSeverityToUiSeverity(run.severity),
    confidence: run.confidenceScore ?? 0,
    priorityScore: run.priorityScore,
    feedback: run.feedback,
    createdAt: format(run.createdAt, "MMM d, yyyy, HH:mm"),
  }));
  const latestAiRun = aiHistory[0] ?? null;

  return {
    id: ticket.code,
    title: ticket.title,
    severity: mapDbSeverityToUiSeverity(ticket.severity),
    status: mapDbStatusToUiStatus(ticket.status),
    category: ticket.category ?? "Uncategorized",
    assignee: assigneeName,
    assigneeInitials: initialsFromName(assigneeName),
    assigneeRole: "Team Member",
    createdAt: relativeDate(ticket.createdAt),
    confidence: ticket.aiConfidence ?? ticket.aiAnalysis?.confidenceScore ?? 0,
    originalReport: ticket.description,
    aiSummary: ticket.aiAnalysis?.summary ?? ticket.description,
    reproductionSteps:
      analysisSteps.length > 0 ? analysisSteps : splitSteps(ticket.stepsToReproduce),
    possibleRootCause:
      ticket.aiAnalysis?.likelyCause ??
      "AI root cause analysis is not available for this ticket yet.",
    suggestedFix:
      ticket.aiAnalysis?.suggestedFix ??
      "Review the original report and add a suggested fix after investigation.",
    priorityScore: ticket.priorityScore ?? 50,
    tags: tags.length > 0 ? tags : ["manual-review"],
    aiAnalysisRunId: latestAiRun?.id ?? null,
    aiProcessingStatus: ticket.aiProcessingStatus,
    aiFeedback: latestAiRun?.feedback ?? null,
    aiHistory,
    githubExportStatus: ticket.githubExportStatus,
    githubIssueUrl: ticket.githubIssueUrl,
    githubIssueNumber: ticket.githubIssueNumber,
    githubExportedAt: ticket.githubExportedAt
      ? format(ticket.githubExportedAt, "MMM d, yyyy, HH:mm")
      : null,
    githubExportError: ticket.githubExportError,
    attachments: ticket.attachments.map((attachment) => ({
      id: attachment.id,
      type:
        attachment.attachmentType === DbAttachmentType.SCREENSHOT
          ? "screenshot"
          : "console-log",
      name: attachment.filename,
      size: `${Math.max(1, Math.round(attachment.fileSize / 1024))} KB`,
      format: attachment.fileType,
      uploadedAt: relativeDate(attachment.createdAt),
      preview:
        attachment.attachmentType === DbAttachmentType.SCREENSHOT
          ? "Private screenshot stored in Supabase Storage."
          : "Private log file stored in Supabase Storage.",
      downloadUrl: attachmentDownloadUrls[attachment.id] ?? null,
    })),
    browser: ticket.browser ?? "Unknown",
    device: ticket.device ?? "Unknown",
    environment: ticket.environment ?? "Unknown",
    affectedPage: ticket.affectedPage ?? "Unknown",
    createdDate: format(ticket.createdAt, "MMM d, yyyy, HH:mm"),
    updatedDate: format(ticket.updatedAt, "MMM d, yyyy, HH:mm"),
    comments: ticket.comments.map((comment) => ({
      id: comment.id,
      author: comment.author?.name ?? "Unknown user",
      role: "Team Member",
      initials: initialsFromName(comment.author?.name),
      createdAt: relativeDate(comment.createdAt),
      body: comment.body,
    })),
    activity: ticket.activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description ?? "Ticket activity recorded.",
      time: relativeDate(activity.createdAt),
    })),
    similarIssues: similarIssues.map(mapSimilarIssueToUiIssue),
  };
}

export function mapTicketListItemToRecentTicket(
  ticket: TicketListItem
): RecentTicket {
  return {
    id: ticket.code,
    title: ticket.title,
    severity: mapDbSeverityToUiSeverity(ticket.severity),
    category: ticket.category ?? "Uncategorized",
    time: relativeDate(ticket.createdAt),
    assignee: ticket.assignee?.name ?? "Unassigned",
    confidence: ticket.aiConfidence ?? ticket.aiAnalysis?.confidenceScore ?? 0,
  };
}

export function mapTicketListItemToPriorityQueueItem(
  ticket: TicketListItem
): PriorityQueueItem {
  return {
    id: ticket.code,
    title: ticket.title,
    severity:
      ticket.severity === DbTicketSeverity.CRITICAL ? "Critical" : "High",
  };
}
