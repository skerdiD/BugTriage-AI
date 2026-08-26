import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import {
  LazySeverityChart,
  LazyTrendChart,
} from "@/components/dashboard/lazy-dashboard-charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { PriorityQueue } from "@/components/dashboard/priority-queue";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    skipAuthorization: true,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Project overview"
        description="Review ticket status, high-impact work, and recent activity."
        badge={context.project?.name ?? context.workspace.name}
      >
        <Button
          asChild
          className="h-11 rounded-xl bg-violet-600 px-4 shadow-lg shadow-violet-500/20 hover:bg-violet-500"
        >
          <Link href="/submit-bug">
            <Plus className="size-4" />
            Report a bug
          </Link>
        </Button>
      </PageHeader>

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
        <LazySeverityChart data={data.severity} />
        <LazyTrendChart data={data.trend} />
      </section>

      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ticket status</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.confidenceSampleCount > 0
              ? `AI confidence averages ${data.averageConfidenceLabel} across ${data.confidenceSampleCount} triaged tickets.`
              : "AI confidence will appear after the first ticket is triaged."}
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
          title="No tickets yet"
          description="Report the first bug to start tracking severity, status, ownership, and activity."
          actionLabel="Report a bug"
          actionHref="/submit-bug"
        />
      ) : null}
    </div>
  );
}
