import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { TicketSeverity, TicketStatus } from "@prisma/client";

import { PageHeader } from "@/components/dashboard/page-header";
import { PriorityQueue } from "@/components/dashboard/priority-queue";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { getTickets, type TicketListItem } from "@/lib/data/tickets";
import {
  mapDbSeverityToUiSeverity,
  mapTicketListItemToPriorityQueueItem,
  mapTicketListItemToRecentTicket,
} from "@/lib/data/ticket-mappers";
import { ensureUserWorkspace } from "@/lib/data/workspaces";
import {
  dashboardStats as mockDashboardStats,
  highPriorityQueue as mockHighPriorityQueue,
  recentTickets as mockRecentTickets,
  severityDistribution as mockSeverityDistribution,
  trendData as mockTrendData,
  type DashboardStat,
  type PriorityQueueItem,
  type RecentTicket,
  type SeverityDistributionItem,
  type TrendDataItem,
} from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const statIcons = {
  bugs: Bug,
  critical: AlertTriangle,
  reports: TrendingUp,
  fixed: CheckCircle2,
};

function buildDashboardStats(tickets: TicketListItem[]): DashboardStat[] {
  const fixedThisWeek = tickets.filter((ticket) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
      (ticket.status === TicketStatus.FIXED ||
        ticket.status === TicketStatus.CLOSED) &&
      ticket.updatedAt.getTime() >= sevenDaysAgo
    );
  }).length;

  return [
    {
      icon: "bugs",
      value: tickets.length.toLocaleString(),
      label: "Total Bugs",
      trend: "+ live",
      trendType: "positive",
      accent: "blue",
    },
    {
      icon: "critical",
      value: tickets
        .filter((ticket) => ticket.severity === TicketSeverity.CRITICAL)
        .length.toString(),
      label: "Critical Issues",
      trend: "real",
      trendType: "negative",
      accent: "red",
    },
    {
      icon: "reports",
      value: tickets
        .filter((ticket) => ticket.status === TicketStatus.NEW)
        .length.toString(),
      label: "New Reports",
      trend: "open",
      trendType: "positive",
      accent: "violet",
    },
    {
      icon: "fixed",
      value: fixedThisWeek.toString(),
      label: "Fixed This Week",
      trend: "7d",
      trendType: "positive",
      accent: "green",
    },
  ];
}

function buildSeverityData(tickets: TicketListItem[]): SeverityDistributionItem[] {
  const colors = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#eab308",
    Low: "#3b82f6",
  } as const;

  const counts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  tickets.forEach((ticket) => {
    counts[mapDbSeverityToUiSeverity(ticket.severity)] += 1;
  });

  return Object.entries(counts).map(([name, value]) => ({
    name: name as SeverityDistributionItem["name"],
    value,
    color: colors[name as keyof typeof colors],
  }));
}

function buildTrendData(tickets: TicketListItem[]): TrendDataItem[] {
  const days = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (5 - index));

    return date;
  });

  return days.map((date) => {
    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
    });

    const bugs = tickets.filter((ticket) => {
      return ticket.createdAt.toDateString() === date.toDateString();
    }).length;

    return {
      label,
      bugs,
    };
  });
}

async function loadDashboardData() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated.");

    const context = await ensureUserWorkspace({
      authUserId: user.id,
      email: user.email,
      name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : undefined,
    });

    const dbTickets = await getTickets({
      workspaceId: context.workspace.id,
      take: 500,
    });

    if (dbTickets.length === 0) {
      throw new Error("No database tickets yet.");
    }

    const priorityItems: PriorityQueueItem[] = dbTickets
      .filter(
        (ticket) =>
          (ticket.severity === TicketSeverity.CRITICAL ||
            ticket.severity === TicketSeverity.HIGH) &&
          ticket.status !== TicketStatus.FIXED &&
          ticket.status !== TicketStatus.CLOSED
      )
      .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
      .slice(0, 3)
      .map(mapTicketListItemToPriorityQueueItem);

    return {
      stats: buildDashboardStats(dbTickets),
      severity: buildSeverityData(dbTickets),
      trend: buildTrendData(dbTickets),
      recent: dbTickets.slice(0, 4).map(mapTicketListItemToRecentTicket),
      priority: priorityItems.length > 0 ? priorityItems : mockHighPriorityQueue,
    };
  } catch {
    return {
      stats: mockDashboardStats,
      severity: mockSeverityDistribution,
      trend: mockTrendData,
      recent: mockRecentTickets as RecentTicket[],
      priority: mockHighPriorityQueue,
    };
  }
}

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Engineering Dashboard"
        description="AI-powered bug triage and ticket management"
        badge="Live workspace"
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={statIcons[stat.icon]}
            value={stat.value}
            label={stat.label}
            trend={stat.trend}
            trendType={stat.trendType}
            accent={stat.accent}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
        <SeverityChart data={data.severity} />
        <TrendChart data={data.trend} />
      </section>

      <RecentTickets tickets={data.recent} />

      <PriorityQueue items={data.priority} />
    </div>
  );
}