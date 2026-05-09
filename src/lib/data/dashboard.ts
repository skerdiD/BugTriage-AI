import "server-only";

import { Prisma, TicketSeverity, TicketStatus } from "@prisma/client";
import {
  differenceInHours,
  format,
  formatDistanceToNow,
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";

import {
  assertCanAccessProject,
  assertWorkspaceMember,
  AuthorizationError,
} from "@/lib/auth/authorization";
import {
  type AnalyticsMetric,
  type AverageResolutionTimeItem,
  type BugReportsOverTimeItem,
  type BugsByCategoryItem,
  type DashboardStat,
  type PriorityQueueItem,
  type RecentActivityItem,
  type RecentTicket,
  type RepeatedIssuePattern,
  type SeverityDistributionItem,
  type TopAffectedPage,
  type TrendDataItem,
  type UiTicketSeverity,
  type UiTicketStatus,
  type WeeklyInsight,
} from "@/lib/dashboard/types";
import {
  mapDbSeverityToUiSeverity,
  mapDbStatusToUiStatus,
} from "@/lib/data/ticket-mappers";
import { prisma } from "@/lib/prisma";

const reportingTicketSelect = {
  id: true,
  code: true,
  title: true,
  severity: true,
  status: true,
  category: true,
  priorityScore: true,
  aiConfidence: true,
  createdAt: true,
  updatedAt: true,
  affectedPage: true,
  assignee: {
    select: {
      name: true,
    },
  },
  aiAnalysis: {
    select: {
      summary: true,
      confidenceScore: true,
    },
  },
} satisfies Prisma.TicketSelect;

const recentActivitySelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  ticket: {
    select: {
      code: true,
      title: true,
    },
  },
} satisfies Prisma.TicketActivitySelect;

type ReportingTicket = Prisma.TicketGetPayload<{
  select: typeof reportingTicketSelect;
}>;

type RecentActivityRecord = Prisma.TicketActivityGetPayload<{
  select: typeof recentActivitySelect;
}>;

export type ReportingScopeInput = {
  workspaceId: string;
  projectId?: string | null;
  userId?: string;
};

export type DashboardPageData = {
  hasTickets: boolean;
  stats: DashboardStat[];
  severity: SeverityDistributionItem[];
  trend: TrendDataItem[];
  recent: RecentTicket[];
  priority: PriorityQueueItem[];
  recentActivity: RecentActivityItem[];
  averageConfidenceLabel: string;
  confidenceSampleCount: number;
  criticalOpenCount: number;
  highOpenCount: number;
  statusSummary: Array<{
    status: UiTicketStatus;
    count: number;
  }>;
};

export type AnalyticsPageData = {
  hasTickets: boolean;
  metrics: AnalyticsMetric[];
  bugReportsOverTime: BugReportsOverTimeItem[];
  bugsByCategory: BugsByCategoryItem[];
  averageResolutionTime: AverageResolutionTimeItem[];
  topAffectedPages: TopAffectedPage[];
  repeatedPatterns: RepeatedIssuePattern[];
  weeklyInsights: WeeklyInsight[];
};

function getTicketConfidence(ticket: ReportingTicket) {
  return ticket.aiConfidence ?? ticket.aiAnalysis?.confidenceScore ?? null;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatRelativeDate(date: Date) {
  return `${formatDistanceToNow(date, { addSuffix: false })} ago`;
}

function percentage(part: number, total: number) {
  if (total === 0) return 0;
  return (part / total) * 100;
}

function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

function ensureScopeWhere(input: ReportingScopeInput): Prisma.TicketWhereInput {
  return {
    workspaceId: input.workspaceId,
    ...(input.projectId ? { projectId: input.projectId } : {}),
  };
}

async function assertReportingScope(input: ReportingScopeInput) {
  await assertWorkspaceMember(input.workspaceId, input.userId);

  if (input.projectId) {
    const projectAccess = await assertCanAccessProject(input.projectId, input.userId);

    if (projectAccess.project.workspaceId !== input.workspaceId) {
      throw new AuthorizationError(
        "Project does not belong to the selected workspace."
      );
    }
  }
}

async function queryReportingTickets(input: ReportingScopeInput) {
  return prisma.ticket.findMany({
    where: ensureScopeWhere(input),
    orderBy: {
      createdAt: "desc",
    },
    select: reportingTicketSelect,
  });
}

async function queryRecentActivities(input: ReportingScopeInput, take = 6) {
  const activities = await prisma.ticketActivity.findMany({
    where: {
      ticket: ensureScopeWhere(input),
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
    select: recentActivitySelect,
  });

  return activities.map(mapRecentActivityRecord);
}

function mapRecentActivityRecord(activity: RecentActivityRecord): RecentActivityItem {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description ?? "Ticket activity recorded.",
    time: formatRelativeDate(activity.createdAt),
    ticketId: activity.ticket.code,
    ticketTitle: activity.ticket.title,
  };
}

function buildStatusSummary(tickets: ReportingTicket[]) {
  const counts: Record<UiTicketStatus, number> = {
    New: 0,
    Investigating: 0,
    "In Progress": 0,
    Fixed: 0,
    Closed: 0,
  };

  for (const ticket of tickets) {
    counts[mapDbStatusToUiStatus(ticket.status)] += 1;
  }

  return Object.entries(counts).map(([status, count]) => ({
    status: status as UiTicketStatus,
    count,
  }));
}

function buildSeverityDistribution(
  tickets: ReportingTicket[]
): SeverityDistributionItem[] {
  const colors: Record<UiTicketSeverity, string> = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#eab308",
    Low: "#3b82f6",
  };
  const counts: Record<UiTicketSeverity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  for (const ticket of tickets) {
    counts[mapDbSeverityToUiSeverity(ticket.severity)] += 1;
  }

  return (Object.keys(counts) as UiTicketSeverity[]).map((name) => ({
    name,
    value: counts[name],
    color: colors[name],
  }));
}

function buildDailyTrend(tickets: ReportingTicket[], days = 7): TrendDataItem[] {
  return Array.from({ length: days }, (_, index) => {
    const date = startOfDay(subDays(new Date(), days - index - 1));

    return {
      label: format(date, "EEE"),
      bugs: tickets.filter(
        (ticket) => startOfDay(ticket.createdAt).getTime() === date.getTime()
      ).length,
    };
  });
}

function buildRecentTickets(tickets: ReportingTicket[]): RecentTicket[] {
  return tickets.slice(0, 4).map((ticket) => ({
    id: ticket.code,
    title: ticket.title,
    severity: mapDbSeverityToUiSeverity(ticket.severity),
    category: ticket.category ?? "Uncategorized",
    time: formatRelativeDate(ticket.createdAt),
    assignee: ticket.assignee?.name ?? "Unassigned",
    confidence: getTicketConfidence(ticket) ?? 0,
  }));
}

function buildPriorityQueue(tickets: ReportingTicket[]): PriorityQueueItem[] {
  return tickets
    .filter(
      (ticket) =>
        (ticket.severity === TicketSeverity.CRITICAL ||
          ticket.severity === TicketSeverity.HIGH) &&
        ticket.status !== TicketStatus.FIXED &&
        ticket.status !== TicketStatus.CLOSED
    )
    .sort((a, b) => {
      const priorityDelta = (b.priorityScore ?? 0) - (a.priorityScore ?? 0);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 3)
    .map((ticket) => ({
      id: ticket.code,
      title: ticket.title,
      severity:
        ticket.severity === TicketSeverity.CRITICAL ? "Critical" : "High",
    }));
}

function buildDashboardStats(tickets: ReportingTicket[]): DashboardStat[] {
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status !== TicketStatus.FIXED && ticket.status !== TicketStatus.CLOSED
  ).length;
  const criticalHighTickets = tickets.filter(
    (ticket) =>
      ticket.severity === TicketSeverity.CRITICAL ||
      ticket.severity === TicketSeverity.HIGH
  ).length;
  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === TicketStatus.FIXED || ticket.status === TicketStatus.CLOSED
  ).length;
  const recentWindow = subDays(new Date(), 7).getTime();
  const newInLastWeek = tickets.filter(
    (ticket) => ticket.createdAt.getTime() >= recentWindow
  ).length;
  const resolvedInLastWeek = tickets.filter(
    (ticket) =>
      (ticket.status === TicketStatus.FIXED ||
        ticket.status === TicketStatus.CLOSED) &&
      ticket.updatedAt.getTime() >= recentWindow
  ).length;

  return [
    {
      icon: "bugs",
      value: totalTickets.toLocaleString(),
      label: "Total Tickets",
      trend: `${newInLastWeek} in 7d`,
      trendType: "positive",
      accent: "blue",
    },
    {
      icon: "reports",
      value: openTickets.toLocaleString(),
      label: "Open Tickets",
      trend: formatPercent(percentage(openTickets, totalTickets)),
      trendType: "positive",
      accent: "violet",
    },
    {
      icon: "critical",
      value: criticalHighTickets.toLocaleString(),
      label: "Critical / High",
      trend: formatPercent(percentage(criticalHighTickets, totalTickets)),
      trendType: criticalHighTickets > 0 ? "negative" : "positive",
      accent: "red",
    },
    {
      icon: "fixed",
      value: resolvedTickets.toLocaleString(),
      label: "Resolved / Closed",
      trend: `${resolvedInLastWeek} in 7d`,
      trendType: "positive",
      accent: "green",
    },
  ];
}

function buildBugReportsOverTime(
  tickets: ReportingTicket[],
  weeks = 6
): BugReportsOverTimeItem[] {
  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = startOfWeek(subWeeks(new Date(), weeks - index - 1), {
      weekStartsOn: 1,
    });
    const weekEnd = startOfWeek(subWeeks(new Date(), weeks - index - 2), {
      weekStartsOn: 1,
    });

    return {
      date: format(weekStart, "MMM d"),
      reports: tickets.filter(
        (ticket) =>
          ticket.createdAt >= weekStart &&
          (index === weeks - 1 ? true : ticket.createdAt < weekEnd)
      ).length,
    };
  });
}

function buildBugsByCategory(tickets: ReportingTicket[]): BugsByCategoryItem[] {
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    const category = ticket.category?.trim() || "Uncategorized";
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([category, bugs]) => ({
      category,
      bugs,
    }));
}

function buildAverageResolutionTime(
  tickets: ReportingTicket[],
  weeks = 6
): AverageResolutionTimeItem[] {
  const resolvedTickets = tickets.filter(
    (ticket) =>
      (ticket.status === TicketStatus.FIXED || ticket.status === TicketStatus.CLOSED) &&
      ticket.updatedAt >= subWeeks(new Date(), weeks)
  );

  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = startOfWeek(subWeeks(new Date(), weeks - index - 1), {
      weekStartsOn: 1,
    });
    const weekEnd = startOfWeek(subWeeks(new Date(), weeks - index - 2), {
      weekStartsOn: 1,
    });
    const items = resolvedTickets.filter(
      (ticket) =>
        ticket.updatedAt >= weekStart &&
        (index === weeks - 1 ? true : ticket.updatedAt < weekEnd)
    );
    const hours = average(
      items.map((ticket) =>
        Math.max(0, differenceInHours(ticket.updatedAt, ticket.createdAt))
      )
    );

    return {
      week: `W${index + 1}`,
      hours: Number(hours.toFixed(1)),
    };
  });
}

function severityRank(severity: TicketSeverity) {
  const ranks: Record<TicketSeverity, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return ranks[severity];
}

function buildTopAffectedPages(tickets: ReportingTicket[]): TopAffectedPage[] {
  const pages = new Map<
    string,
    { bugCount: number; severity: TicketSeverity }
  >();

  for (const ticket of tickets) {
    const path = ticket.affectedPage?.trim();

    if (!path) continue;

    const current = pages.get(path);

    if (!current) {
      pages.set(path, {
        bugCount: 1,
        severity: ticket.severity,
      });
      continue;
    }

    current.bugCount += 1;

    if (severityRank(ticket.severity) > severityRank(current.severity)) {
      current.severity = ticket.severity;
    }
  }

  return [...pages.entries()]
    .sort((a, b) => b[1].bugCount - a[1].bugCount || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([path, value]) => ({
      path,
      bugCount: value.bugCount,
      severity: mapDbSeverityToUiSeverity(value.severity),
    }));
}

function buildRepeatedPatterns(tickets: ReportingTicket[]): RepeatedIssuePattern[] {
  const patterns = new Map<
    string,
    {
      name: string;
      lastSeenAt: Date;
      count: number;
      category: string;
      severity: TicketSeverity;
    }
  >();

  for (const ticket of tickets) {
    const category = ticket.category?.trim() || "Uncategorized";
    const affectedPage = ticket.affectedPage?.trim() || "shared flow";
    const name = `${category} issues on ${affectedPage}`;
    const key = `${category.toLowerCase()}|${affectedPage.toLowerCase()}`;
    const current = patterns.get(key);

    if (!current) {
      patterns.set(key, {
        name,
        lastSeenAt: ticket.createdAt,
        count: 1,
        category,
        severity: ticket.severity,
      });
      continue;
    }

    current.count += 1;

    if (ticket.createdAt > current.lastSeenAt) {
      current.lastSeenAt = ticket.createdAt;
    }

    if (severityRank(ticket.severity) > severityRank(current.severity)) {
      current.severity = ticket.severity;
    }
  }

  return [...patterns.values()]
    .filter((pattern) => pattern.count > 1)
    .sort((a, b) => b.count - a.count || b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
    .slice(0, 4)
    .map((pattern) => ({
      name: pattern.name,
      lastSeen: formatRelativeDate(pattern.lastSeenAt),
      count: pattern.count,
      category: pattern.category,
      severity: mapDbSeverityToUiSeverity(pattern.severity),
    }));
}

function buildWeeklyInsights(
  tickets: ReportingTicket[],
  topCategories: BugsByCategoryItem[],
  topPages: TopAffectedPage[]
): WeeklyInsight[] {
  if (tickets.length === 0) {
    return [];
  }

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === TicketStatus.FIXED || ticket.status === TicketStatus.CLOSED
  );
  const avgResolutionHours = average(
    resolvedTickets.map((ticket) =>
      Math.max(0, differenceInHours(ticket.updatedAt, ticket.createdAt))
    )
  );
  const topCategory = topCategories[0];
  const topPage = topPages[0];
  const browserSignals = tickets
    .map((ticket) => ticket.aiAnalysis?.summary?.toLowerCase() ?? "")
    .filter(Boolean);
  const mentionSafari = browserSignals.filter((summary) =>
    summary.includes("safari")
  ).length;
  const confidenceValues = tickets
    .map(getTicketConfidence)
    .filter((value): value is number => value !== null);
  const averageConfidence = average(confidenceValues);

  return [
    {
      type: "focus",
      label: "Focus Area",
      title: topCategory
        ? `${topCategory.category} is driving the most tickets`
        : "Triage focus is still emerging",
      description: topCategory
        ? `${topCategory.bugs} tickets in this workspace are currently grouped under ${topCategory.category}, making it the strongest signal in the backlog.`
        : "As more tickets arrive, this workspace will surface its clearest issue cluster automatically.",
      recommendation: topPage
        ? `Start review with ${topPage.path}, because it is the most affected surface tied to the current ticket volume.`
        : "Review new tickets as they arrive and watch for a recurring category or page cluster.",
    },
    {
      type: "browser",
      label: "Browser Priority",
      title:
        mentionSafari > 0
          ? "Safari is appearing in AI triage signals"
          : "Cross-browser signals are limited right now",
      description:
        mentionSafari > 0
          ? `${mentionSafari} AI summaries mention Safari-specific behavior, which is a strong hint to validate browser-specific edge cases first.`
          : "There are not enough browser-specific clues in the current workspace data to prioritize one browser family yet.",
      recommendation:
        mentionSafari > 0
          ? "Run a focused Safari regression pass on the highest-severity open tickets this week."
          : "Capture browser details consistently in new bug reports so future insights are sharper.",
    },
    {
      type: "velocity",
      label: "Team Velocity",
      title:
        resolvedTickets.length > 0
          ? `${resolvedTickets.length} tickets have already been resolved`
          : "Resolution velocity is still building",
      description:
        resolvedTickets.length > 0
          ? `Resolved tickets in this workspace are averaging ${formatHours(avgResolutionHours)} from report to closure, with AI confidence averaging ${formatPercent(averageConfidence, 0)} when available.`
          : "No tickets have been fixed or closed yet, so resolution-time insights will appear after the first completed issues.",
      recommendation:
        resolvedTickets.length > 0
          ? "Keep status updates and comments flowing so the activity log stays useful for future triage and retrospectives."
          : "Close the loop on early tickets and keep comment history up to date to establish a reliable baseline for analytics.",
    },
  ];
}

export function buildDashboardPageData(
  tickets: ReportingTicket[],
  recentActivity: RecentActivityItem[] = []
): DashboardPageData {
  const confidenceValues = tickets
    .map(getTicketConfidence)
    .filter((value): value is number => value !== null);
  const openPriorityTickets = tickets.filter(
    (ticket) =>
      ticket.status !== TicketStatus.FIXED &&
      ticket.status !== TicketStatus.CLOSED &&
      (ticket.severity === TicketSeverity.CRITICAL ||
        ticket.severity === TicketSeverity.HIGH)
  );

  return {
    hasTickets: tickets.length > 0,
    stats: buildDashboardStats(tickets),
    severity: buildSeverityDistribution(tickets),
    trend: buildDailyTrend(tickets),
    recent: buildRecentTickets(tickets),
    priority: buildPriorityQueue(tickets),
    recentActivity,
    averageConfidenceLabel:
      confidenceValues.length > 0
        ? formatPercent(average(confidenceValues), 0)
        : "N/A",
    confidenceSampleCount: confidenceValues.length,
    criticalOpenCount: openPriorityTickets.filter(
      (ticket) => ticket.severity === TicketSeverity.CRITICAL
    ).length,
    highOpenCount: openPriorityTickets.filter(
      (ticket) => ticket.severity === TicketSeverity.HIGH
    ).length,
    statusSummary: buildStatusSummary(tickets),
  };
}

export function buildAnalyticsPageData(
  tickets: ReportingTicket[]
): AnalyticsPageData {
  const resolvedThisWeek = tickets.filter(
    (ticket) =>
      (ticket.status === TicketStatus.FIXED || ticket.status === TicketStatus.CLOSED) &&
      ticket.updatedAt >= subDays(new Date(), 7)
  ).length;
  const criticalHighCount = tickets.filter(
    (ticket) =>
      ticket.severity === TicketSeverity.CRITICAL ||
      ticket.severity === TicketSeverity.HIGH
  ).length;
  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === TicketStatus.FIXED || ticket.status === TicketStatus.CLOSED
  );
  const avgResolutionHours = average(
    resolvedTickets.map((ticket) =>
      Math.max(0, differenceInHours(ticket.updatedAt, ticket.createdAt))
    )
  );
  const confidenceValues = tickets
    .map(getTicketConfidence)
    .filter((value): value is number => value !== null);
  const avgConfidence = average(confidenceValues);
  const topCategories = buildBugsByCategory(tickets);
  const topPages = buildTopAffectedPages(tickets);

  return {
    hasTickets: tickets.length > 0,
    metrics: [
      {
        icon: "clock",
        label: "Avg Resolution Time",
        value: formatHours(avgResolutionHours),
        helper: "Average time from ticket creation to fixed or closed status.",
        trend: `${resolvedTickets.length} resolved`,
        trendDirection: "down",
        trendTone: resolvedTickets.length > 0 ? "positive" : "warning",
        accent: "green",
      },
      {
        icon: "resolved",
        label: "Resolved in 7 Days",
        value: resolvedThisWeek.toLocaleString(),
        helper: "Tickets moved to fixed or closed in the last 7 days.",
        trend: `${formatPercent(percentage(resolvedThisWeek, tickets.length), 0)}`,
        trendDirection: "up",
        trendTone: resolvedThisWeek > 0 ? "positive" : "warning",
        accent: "violet",
      },
      {
        icon: "critical",
        label: "Critical / High Rate",
        value: formatPercent(percentage(criticalHighCount, tickets.length)),
        helper: "Share of tickets currently marked high or critical severity.",
        trend: criticalHighCount.toLocaleString(),
        trendDirection: criticalHighCount > 0 ? "up" : "down",
        trendTone: criticalHighCount > 0 ? "negative" : "positive",
        accent: "red",
      },
      {
        icon: "accuracy",
        label: "Average AI Confidence",
        value: confidenceValues.length > 0 ? formatPercent(avgConfidence, 0) : "N/A",
        helper: "Average confidence across tickets with AI-generated triage data.",
        trend: `${confidenceValues.length} scored`,
        trendDirection: "up",
        trendTone: confidenceValues.length > 0 ? "positive" : "warning",
        accent: "blue",
      },
    ],
    bugReportsOverTime: buildBugReportsOverTime(tickets),
    bugsByCategory: topCategories,
    averageResolutionTime: buildAverageResolutionTime(tickets),
    topAffectedPages: topPages,
    repeatedPatterns: buildRepeatedPatterns(tickets),
    weeklyInsights: buildWeeklyInsights(tickets, topCategories, topPages),
  };
}

export async function getDashboardPageData(
  input: ReportingScopeInput
): Promise<DashboardPageData> {
  await assertReportingScope(input);

  const [tickets, recentActivity] = await Promise.all([
    queryReportingTickets(input),
    queryRecentActivities(input),
  ]);

  return buildDashboardPageData(tickets, recentActivity);
}

export async function getAnalyticsPageData(
  input: ReportingScopeInput
): Promise<AnalyticsPageData> {
  await assertReportingScope(input);
  const tickets = await queryReportingTickets(input);

  return buildAnalyticsPageData(tickets);
}
