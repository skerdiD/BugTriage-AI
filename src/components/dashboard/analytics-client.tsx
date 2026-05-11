"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnalyticsMetricCard } from "@/components/dashboard/analytics-metric-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { RepeatedPatterns } from "@/components/dashboard/repeated-patterns";
import { TopAffectedPages } from "@/components/dashboard/top-affected-pages";
import { WeeklyInsights } from "@/components/dashboard/weekly-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const chartTooltipStyle = {
  background: "#111119",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px",
  color: "#ffffff",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
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
        title="Analytics & Insights"
        description="Track real bug trends, resolution metrics, and workspace-level product health."
        badge="Product health"
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

      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardHeader className="pb-0">
          <div>
            <CardTitle className="text-lg">Bug Reports Over Time</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Weekly report volume across the currently selected workspace scope.
            </p>
          </div>
        </CardHeader>

        <CardContent className="h-[350px] p-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bugReportsOverTime}>
              <defs>
                <linearGradient id="bugReportsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.58} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                cursor={{ stroke: "rgba(139,92,246,0.4)", strokeWidth: 1 }}
                contentStyle={chartTooltipStyle}
                itemStyle={{ color: "#ffffff" }}
              />

              <Area
                type="monotone"
                dataKey="reports"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#bugReportsGradient)"
                activeDot={{ r: 6, fill: "#8b5cf6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader className="pb-0">
            <div>
              <CardTitle className="text-lg">Bugs by Category</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Where issues are concentrated across product areas.
              </p>
            </div>
          </CardHeader>

          <CardContent className="h-[340px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bugsByCategory} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />

                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={96}
                />

                <Tooltip
                  cursor={{ fill: "rgba(139,92,246,0.08)" }}
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#ffffff" }}
                />

                <Bar
                  dataKey="bugs"
                  fill="#8b5cf6"
                  radius={[0, 12, 12, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader className="pb-0">
            <div>
              <CardTitle className="text-lg">Average Resolution Time</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                How fast the team closes bugs week over week.
              </p>
            </div>
          </CardHeader>

          <CardContent className="h-[340px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={averageResolutionTime}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />

                <XAxis
                  dataKey="week"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  cursor={{ stroke: "rgba(16,185,129,0.35)", strokeWidth: 1 }}
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#ffffff" }}
                />

                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TopAffectedPages pages={topAffectedPages} />
        <RepeatedPatterns patterns={repeatedPatterns} />
      </section>

      <WeeklyInsights insights={weeklyInsights} />

      {!hasTickets ? (
        <EmptyState
          title="No analytics yet"
          description="Analytics will populate automatically after this workspace has real tickets, status updates, and closures to analyze."
          actionLabel="Submit a bug report"
          actionHref="/submit-bug"
        />
      ) : null}
    </div>
  );
}
