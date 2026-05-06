import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PriorityQueue } from "@/components/dashboard/priority-queue";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import {
  dashboardStats,
  highPriorityQueue,
  recentTickets,
  severityDistribution,
  trendData,
} from "@/lib/mock-data";

const statIcons = {
  bugs: Bug,
  critical: AlertTriangle,
  reports: TrendingUp,
  fixed: CheckCircle2,
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Engineering Dashboard"
        description="AI-powered bug triage and ticket management"
        badge="Live workspace"
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
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
        <SeverityChart data={severityDistribution} />
        <TrendChart data={trendData} />
      </section>

      <RecentTickets tickets={recentTickets} />

      <PriorityQueue items={highPriorityQueue} />
    </div>
  );
}