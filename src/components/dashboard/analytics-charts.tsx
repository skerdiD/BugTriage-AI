"use client";

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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AverageResolutionTimeItem,
  BugReportsOverTimeItem,
  BugsByCategoryItem,
} from "@/lib/dashboard/types";

const chartTooltipStyle = {
  background: "#111119",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px",
  color: "#ffffff",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

type AnalyticsChartsProps = {
  bugReportsOverTime: BugReportsOverTimeItem[];
  bugsByCategory: BugsByCategoryItem[];
  averageResolutionTime: AverageResolutionTimeItem[];
};

export function AnalyticsCharts({
  bugReportsOverTime,
  bugsByCategory,
  averageResolutionTime,
}: AnalyticsChartsProps) {
  return (
    <>
      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardHeader className="pb-0">
          <div>
            <CardTitle className="text-lg">New reports by week</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              How many reports entered the selected project each week.
            </p>
          </div>
        </CardHeader>

        <CardContent className="h-[310px] px-3 pb-5 pt-4 sm:h-[350px] sm:p-6">
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
              <CardTitle className="text-lg">Reports by product area</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                The product areas carrying the most reported problems.
              </p>
            </div>
          </CardHeader>

          <CardContent className="h-[310px] px-2 pb-5 pt-4 sm:h-[340px] sm:p-6">
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
              <CardTitle className="text-lg">Time to resolution</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Average time from report submission to Fixed or Closed.
              </p>
            </div>
          </CardHeader>

          <CardContent className="h-[310px] px-3 pb-5 pt-4 sm:h-[340px] sm:p-6">
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
    </>
  );
}
