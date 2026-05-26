export type DashboardStat = {
  icon: "bugs" | "critical" | "reports" | "fixed";
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative";
  accent: "blue" | "red" | "violet" | "green";
};

export type SeverityDistributionItem = {
  name: "Critical" | "High" | "Medium" | "Low";
  value: number;
  color: string;
};

export type TrendDataItem = {
  label: string;
  bugs: number;
};

export type RecentTicket = {
  id: string;
  title: string;
  severity: UiTicketSeverity;
  category: string;
  time: string;
  assignee: string;
  confidence: number;
};

export type PriorityQueueItem = {
  id: string;
  title: string;
  severity: Extract<UiTicketSeverity, "Critical" | "High">;
};

export type UiTicketSeverity = "Critical" | "High" | "Medium" | "Low";

export type UiTicketStatus =
  | "New"
  | "Investigating"
  | "In Progress"
  | "Fixed"
  | "Closed";

export type UiTicketListItem = {
  id: string;
  title: string;
  severity: UiTicketSeverity;
  status: UiTicketStatus;
  category: string;
  assignee: string;
  assigneeInitials: string;
  assigneeRole: string;
  createdAt: string;
  confidence: number;
};

export type UiTicketAttachment = {
  id: string;
  type: "screenshot" | "console-log";
  name: string;
  size: string;
  format: string;
  uploadedAt: string;
  preview: string;
  downloadUrl?: string | null;
};

export type UiTicketComment = {
  id: string;
  author: string;
  role: string;
  initials: string;
  createdAt: string;
  body: string;
};

export type UiTicketActivity = {
  id: string;
  title: string;
  description: string;
  time: string;
};

export type UiSimilarIssue = {
  id: string;
  title: string;
  severity: UiTicketSeverity;
  status: UiTicketStatus;
  priorityScore: number | null;
  matchPercent: number;
};

export type UiTicket = {
  id: string;
  title: string;
  severity: UiTicketSeverity;
  status: UiTicketStatus;
  category: string;
  assignee: string;
  assigneeInitials: string;
  assigneeRole: string;
  createdAt: string;
  confidence: number;
  originalReport: string;
  aiSummary: string;
  reproductionSteps: string[];
  possibleRootCause: string;
  suggestedFix: string;
  priorityScore: number;
  tags: string[];
  attachments: UiTicketAttachment[];
  browser: string;
  device: string;
  environment: string;
  affectedPage: string;
  createdDate: string;
  updatedDate: string;
  comments: UiTicketComment[];
  activity: UiTicketActivity[];
  similarIssues: UiSimilarIssue[];
};

export type AnalyticsMetric = {
  icon: "clock" | "resolved" | "critical" | "accuracy";
  label: string;
  value: string;
  helper: string;
  trend: string;
  trendDirection: "up" | "down";
  trendTone: "positive" | "negative" | "warning";
  accent: "violet" | "green" | "red" | "blue";
};

export type BugReportsOverTimeItem = {
  date: string;
  reports: number;
};

export type BugsByCategoryItem = {
  category: string;
  bugs: number;
};

export type AverageResolutionTimeItem = {
  week: string;
  hours: number;
};

export type TopAffectedPage = {
  path: string;
  bugCount: number;
  severity: UiTicketSeverity;
};

export type RepeatedIssuePattern = {
  name: string;
  lastSeen: string;
  count: number;
  category: string;
  severity: UiTicketSeverity;
};

export type WeeklyInsight = {
  type: "focus" | "browser" | "velocity";
  label: string;
  title: string;
  description: string;
  recommendation: string;
};

export type RecentActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  ticketId: string;
  ticketTitle: string;
};
