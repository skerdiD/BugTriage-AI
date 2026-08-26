import { TicketSeverity, TicketStatus } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildAnalyticsPageData,
  buildDashboardPageData,
} from "@/lib/data/dashboard";

type ReportingTicket = Parameters<typeof buildDashboardPageData>[0][number];
type RecentActivity = NonNullable<Parameters<typeof buildDashboardPageData>[1]>[number];

function createReportingTicket(
  overrides: Partial<ReportingTicket> & Pick<ReportingTicket, "code" | "title">
): ReportingTicket {
  return {
    id: overrides.id ?? overrides.code,
    code: overrides.code,
    title: overrides.title,
    severity: overrides.severity ?? TicketSeverity.MEDIUM,
    status: overrides.status ?? TicketStatus.NEW,
    category: overrides.category ?? "General",
    priorityScore: overrides.priorityScore ?? 50,
    aiConfidence: overrides.aiConfidence ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-05-08T10:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-05-08T12:00:00.000Z"),
    affectedPage: overrides.affectedPage ?? "/dashboard",
    assignee: overrides.assignee ?? null,
    aiAnalysis: overrides.aiAnalysis ?? null,
  };
}

describe("dashboard and analytics reporting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns clean empty-state reporting data for workspaces with no tickets", () => {
    const dashboard = buildDashboardPageData([], []);
    const analytics = buildAnalyticsPageData([]);

    expect(dashboard).toMatchObject({
      hasTickets: false,
      recent: [],
      priority: [],
      recentActivity: [],
      averageConfidenceLabel: "N/A",
      confidenceSampleCount: 0,
      criticalOpenCount: 0,
      highOpenCount: 0,
    });
    expect(dashboard.stats.map((stat) => stat.value)).toEqual(["0", "0", "0", "0"]);
    expect(dashboard.severity.map((item) => item.value)).toEqual([0, 0, 0, 0]);
    expect(dashboard.statusSummary.map((item) => item.count)).toEqual([0, 0, 0, 0, 0]);

    expect(analytics).toMatchObject({
      hasTickets: false,
      bugsByCategory: [],
      topAffectedPages: [],
      repeatedPatterns: [],
      weeklyInsights: [],
    });
    expect(analytics.metrics.map((metric) => metric.value)).toEqual([
      "0.0h",
      "0",
      "0.0%",
      "N/A",
    ]);
  });

  it("calculates dashboard metrics, distributions, recent items, and analytics from real ticket data", () => {
    const tickets: ReportingTicket[] = [
      createReportingTicket({
        code: "BUG-1001",
        title: "Login fails on mobile Safari",
        severity: TicketSeverity.CRITICAL,
        status: TicketStatus.NEW,
        category: "Authentication",
        priorityScore: 97,
        aiConfidence: 95,
        createdAt: new Date("2026-05-08T09:00:00.000Z"),
        updatedAt: new Date("2026-05-08T09:30:00.000Z"),
        affectedPage: "/login",
        assignee: {
          name: "Alex",
        },
        aiAnalysis: {
          summary: "Safari mobile sessions appear to fail after auth redirect.",
          confidenceScore: 95,
        },
      }),
      createReportingTicket({
        code: "BUG-1002",
        title: "Dashboard chart freezes after filtering",
        severity: TicketSeverity.HIGH,
        status: TicketStatus.IN_PROGRESS,
        category: "Dashboard",
        priorityScore: 84,
        aiConfidence: null,
        createdAt: new Date("2026-05-07T11:00:00.000Z"),
        updatedAt: new Date("2026-05-08T13:00:00.000Z"),
        affectedPage: "/dashboard",
        assignee: {
          name: "Priya",
        },
        aiAnalysis: {
          summary: "Repeated filter transitions leave stale chart state behind.",
          confidenceScore: 70,
        },
      }),
      createReportingTicket({
        code: "BUG-1003",
        title: "Invite redirect lands in wrong workspace",
        severity: TicketSeverity.MEDIUM,
        status: TicketStatus.FIXED,
        category: "Authentication",
        priorityScore: 66,
        aiConfidence: 80,
        createdAt: new Date("2026-05-05T10:00:00.000Z"),
        updatedAt: new Date("2026-05-07T10:00:00.000Z"),
        affectedPage: "/login",
      }),
      createReportingTicket({
        code: "BUG-1004",
        title: "Upload fails for large PNG",
        severity: TicketSeverity.HIGH,
        status: TicketStatus.CLOSED,
        category: "Uploads",
        priorityScore: 71,
        aiConfidence: null,
        createdAt: new Date("2026-04-30T14:00:00.000Z"),
        updatedAt: new Date("2026-05-03T14:00:00.000Z"),
        affectedPage: "/submit-bug",
      }),
      createReportingTicket({
        code: "BUG-1005",
        title: "Password reset email not received",
        severity: TicketSeverity.HIGH,
        status: TicketStatus.NEW,
        category: "Authentication",
        priorityScore: 79,
        aiConfidence: 60,
        createdAt: new Date("2026-05-07T15:00:00.000Z"),
        updatedAt: new Date("2026-05-07T16:00:00.000Z"),
        affectedPage: "/login",
      }),
    ];

    const recentActivity: RecentActivity[] = [
      {
        id: "activity-1",
        title: "Status changed",
        description: "Ticket moved from New to In Progress.",
        time: "2 hours ago",
        ticketId: "BUG-1002",
        ticketTitle: "Dashboard chart freezes after filtering",
      },
      {
        id: "activity-2",
        title: "Comment added",
        description: "A new internal comment was added.",
        time: "5 hours ago",
        ticketId: "BUG-1001",
        ticketTitle: "Login fails on mobile Safari",
      },
    ];

    const dashboard = buildDashboardPageData(tickets, recentActivity);
    const analytics = buildAnalyticsPageData(tickets);

    expect(dashboard.hasTickets).toBe(true);
    expect(dashboard.stats.map((stat) => stat.value)).toEqual(["5", "3", "4", "2"]);
    expect(dashboard.averageConfidenceLabel).toBe("76%");
    expect(dashboard.confidenceSampleCount).toBe(4);
    expect(dashboard.criticalOpenCount).toBe(1);
    expect(dashboard.highOpenCount).toBe(2);
    expect(dashboard.statusSummary).toEqual([
      { status: "New", count: 2 },
      { status: "Investigating", count: 0 },
      { status: "In Progress", count: 1 },
      { status: "Fixed", count: 1 },
      { status: "Closed", count: 1 },
    ]);
    expect(dashboard.severity).toEqual([
      { name: "Critical", value: 1, color: "#ef4444" },
      { name: "High", value: 3, color: "#f97316" },
      { name: "Medium", value: 1, color: "#eab308" },
      { name: "Low", value: 0, color: "#3b82f6" },
    ]);
    expect(dashboard.recent.map((ticket) => ticket.id)).toEqual([
      "BUG-1001",
      "BUG-1002",
      "BUG-1003",
      "BUG-1004",
    ]);
    expect(dashboard.priority.map((ticket) => ticket.id)).toEqual([
      "BUG-1001",
      "BUG-1002",
      "BUG-1005",
    ]);
    expect(dashboard.recentActivity).toEqual(recentActivity);
    expect(dashboard.trend.reduce((sum, item) => sum + item.bugs, 0)).toBe(4);

    expect(analytics.hasTickets).toBe(true);
    expect(analytics.metrics.map((metric) => metric.value)).toEqual([
      "60.0h",
      "2",
      "80.0%",
      "76%",
    ]);
    expect(analytics.bugsByCategory).toEqual([
      { category: "Authentication", bugs: 3 },
      { category: "Dashboard", bugs: 1 },
      { category: "Uploads", bugs: 1 },
    ]);
    expect(analytics.topAffectedPages[0]).toEqual({
      path: "/login",
      bugCount: 3,
      severity: "Critical",
    });
    expect(analytics.repeatedPatterns).toEqual([
      {
        name: "Authentication tickets on /login",
        lastSeen: "1 day ago",
        count: 3,
        category: "Authentication",
        severity: "Critical",
      },
    ]);
    expect(analytics.bugReportsOverTime.reduce((sum, item) => sum + item.reports, 0)).toBe(
      5
    );
    expect(analytics.weeklyInsights).toHaveLength(3);
    expect(analytics.weeklyInsights[0]?.title).toContain("Authentication");
  });
});
