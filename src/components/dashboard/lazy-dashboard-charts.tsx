"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type {
  AverageResolutionTimeItem,
  BugReportsOverTimeItem,
  BugsByCategoryItem,
  SeverityDistributionItem,
  TrendDataItem,
} from "@/lib/dashboard/types";

function ChartSkeleton({ className }: { className: string }) {
  return <Skeleton className={`${className} rounded-3xl bg-white/10`} />;
}

export const LazySeverityChart = dynamic<{
  data: SeverityDistributionItem[];
}>(
  () =>
    import("@/components/dashboard/severity-chart").then(
      (mod) => mod.SeverityChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton className="h-[360px]" />,
  }
);

export const LazyTrendChart = dynamic<{
  data: TrendDataItem[];
}>(
  () =>
    import("@/components/dashboard/trend-chart").then((mod) => mod.TrendChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton className="h-[360px]" />,
  }
);

export const LazyAnalyticsCharts = dynamic<{
  bugReportsOverTime: BugReportsOverTimeItem[];
  bugsByCategory: BugsByCategoryItem[];
  averageResolutionTime: AverageResolutionTimeItem[];
}>(
  () =>
    import("@/components/dashboard/analytics-charts").then(
      (mod) => mod.AnalyticsCharts
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <ChartSkeleton className="h-[350px]" />
        <section className="grid gap-6 xl:grid-cols-2">
          <ChartSkeleton className="h-[340px]" />
          <ChartSkeleton className="h-[340px]" />
        </section>
      </div>
    ),
  }
);
