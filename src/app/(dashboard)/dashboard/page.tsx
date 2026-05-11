import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { PriorityQueue } from "@/components/dashboard/priority-queue";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { getDashboardPageData } from "@/lib/data/dashboard";

const statIcons = {
  bugs: Bug,
  critical: AlertTriangle,
  reports: TrendingUp,
  fixed: CheckCircle2,
};

const statusStyles = {
  New: "border-violet-500/25 bg-violet-500/15 text-violet-300",
  Investigating: "border-sky-500/25 bg-sky-500/15 text-sky-300",
  "In Progress": "border-yellow-500/25 bg-yellow-500/15 text-yellow-300",
  Fixed: "border-emerald-500/25 bg-emerald-500/15 text-emerald-300",
  Closed: "border-slate-500/25 bg-slate-500/15 text-slate-300",
} as const;

export default async function DashboardPage() {
  const context = await getCurrentWorkspaceContextOrRedirect();
  const data = await getDashboardPageData({
    workspaceId: context.workspace.id,
    projectId: context.project?.id,
    userId: context.user.id,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Engineering Dashboard"
        description="Real-time bug triage, ticket health, and workspace activity from your selected project scope."
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

      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ticket Status Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Average AI confidence: {data.averageConfidenceLabel}
            {data.confidenceSampleCount > 0
              ? ` across ${data.confidenceSampleCount} scored tickets.`
              : " because this scope has not recorded AI scores yet."}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {data.statusSummary.map((item) => (
            <div
              key={item.status}
              className={`rounded-2xl border p-4 ${statusStyles[item.status]}`}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-current/80">
                {item.status}
              </p>
              <p className="mt-3 text-3xl font-bold text-white">{item.count}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <RecentTickets tickets={data.recent} />

      <RecentActivityFeed items={data.recentActivity} />

      <PriorityQueue
        items={data.priority}
        criticalCount={data.criticalOpenCount}
        highCount={data.highOpenCount}
      />

      {!data.hasTickets ? (
        <EmptyState
          title="No dashboard data yet"
          description="Create the first bug report to populate the dashboard, charts, and activity feed with real workspace data."
          actionLabel="Submit a bug report"
          actionHref="/submit-bug"
        />
      ) : null}
    </div>
  );
}
