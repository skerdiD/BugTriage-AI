import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { AnalyticsMetricCard } from "@/components/dashboard/analytics-metric-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LazyAnalyticsCharts } from "@/components/dashboard/lazy-dashboard-charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { RepeatedPatterns } from "@/components/dashboard/repeated-patterns";
import { TopAffectedPages } from "@/components/dashboard/top-affected-pages";
import { WeeklyInsights } from "@/components/dashboard/weekly-insights";
import type {
  AnalyticsMetric,
  AverageResolutionTimeItem,
  BugReportsOverTimeItem,
  BugsByCategoryItem,
  RepeatedIssuePattern,
  TopAffectedPage,
  WeeklyInsight,
} from "@/lib/dashboard/types";

const metricIcons = {
  clock: Clock3,
  resolved: CheckCircle2,
  critical: AlertTriangle,
  accuracy: Crosshair,
};

const metricTrendIcons = {
  up: TrendingUp,
  down: TrendingDown,
};

type AnalyticsClientProps = {
  hasTickets: boolean;
  metrics: AnalyticsMetric[];
  bugReportsOverTime: BugReportsOverTimeItem[];
  bugsByCategory: BugsByCategoryItem[];
  averageResolutionTime: AverageResolutionTimeItem[];
  topAffectedPages: TopAffectedPage[];
  repeatedPatterns: RepeatedIssuePattern[];
  weeklyInsights: WeeklyInsight[];
};

export function AnalyticsClient({
  hasTickets,
  metrics,
  bugReportsOverTime,
  bugsByCategory,
  averageResolutionTime,
  topAffectedPages,
  repeatedPatterns,
  weeklyInsights,
}: AnalyticsClientProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Spot recurring problem areas and see how quickly the team is resolving them."
        badge="Project health"
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <AnalyticsMetricCard
            key={metric.label}
            icon={metricIcons[metric.icon]}
            trendIcon={metricTrendIcons[metric.trendDirection]}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            trend={metric.trend}
            trendTone={metric.trendTone}
            accent={metric.accent}
          />
        ))}
      </section>

      <LazyAnalyticsCharts
        bugReportsOverTime={bugReportsOverTime}
        bugsByCategory={bugsByCategory}
        averageResolutionTime={averageResolutionTime}
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TopAffectedPages pages={topAffectedPages} />
        <RepeatedPatterns patterns={repeatedPatterns} />
      </section>

      <WeeklyInsights insights={weeklyInsights} />

      {!hasTickets ? (
        <EmptyState
          title="No analytics yet"
          description="Charts will appear once this project has a few tickets and status changes to learn from."
          actionLabel="Report a bug"
          actionHref="/submit-bug"
        />
      ) : null}
    </div>
  );
}
