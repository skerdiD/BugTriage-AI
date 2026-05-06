"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  Sparkles,
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

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reportData = [
  { date: "Apr 1", bugs: 18 },
  { date: "Apr 8", bugs: 24 },
  { date: "Apr 15", bugs: 29 },
  { date: "Apr 22", bugs: 22 },
  { date: "Apr 29", bugs: 35 },
  { date: "May 6", bugs: 37 },
];

const categoryData = [
  { category: "Payment", bugs: 88 },
  { category: "UI/UX", bugs: 136 },
  { category: "Performance", bugs: 57 },
  { category: "Backend", bugs: 93 },
  { category: "API", bugs: 42 },
  { category: "Search", bugs: 38 },
];

const resolutionData = [
  { week: "W1", hours: 18.7 },
  { week: "W2", hours: 16.2 },
  { week: "W3", hours: 14.8 },
  { week: "W4", hours: 15.3 },
  { week: "W5", hours: 13.1 },
  { week: "W6", hours: 12.4 },
];

const affectedPages = [
  { page: "/checkout/payment", count: "23 bugs reported", severity: "Critical" },
  { page: "/dashboard", count: "18 bugs reported", severity: "High" },
  { page: "/profile/settings", count: "15 bugs reported", severity: "Medium" },
  { page: "/search", count: "12 bugs reported", severity: "Medium" },
  { page: "/api/v1/users", count: "9 bugs reported", severity: "High" },
];

const repeatedPatterns = [
  { title: "Form validation on Safari", seen: "Last seen: 2h ago", count: "7x" },
  { title: "API timeout in EU region", seen: "Last seen: 1d ago", count: "5x" },
  { title: "Image upload failure", seen: "Last seen: 3d ago", count: "4x" },
  { title: "Mobile menu navigation", seen: "Last seen: 5d ago", count: "3x" },
];

function severityClass(severity: string) {
  if (severity === "Critical") return "bg-red-500/15 text-red-300 border-red-500/25";
  if (severity === "High") return "bg-orange-500/15 text-orange-300 border-orange-500/25";
  return "bg-yellow-500/15 text-yellow-300 border-yellow-500/25";
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Insights"
        description="Track bug trends, resolution metrics, AI accuracy, and team performance."
        badge="Updated weekly"
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Clock3 className="size-5 text-emerald-300" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-300">
                <TrendingDown className="size-3" />
                -15%
              </span>
            </div>
            <p className="mt-6 text-3xl font-bold">12.4h</p>
            <p className="mt-1 text-sm text-muted-foreground">Avg Resolution Time</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <CheckCircle2 className="size-5 text-emerald-300" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-red-300">
                <TrendingUp className="size-3" />
                +12%
              </span>
            </div>
            <p className="mt-6 text-3xl font-bold">89</p>
            <p className="mt-1 text-sm text-muted-foreground">Bugs Resolved / Week</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <AlertTriangle className="size-5 text-red-300" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-red-300">
                <TrendingUp className="size-3" />
                +2%
              </span>
            </div>
            <p className="mt-6 text-3xl font-bold">7.4%</p>
            <p className="mt-1 text-sm text-muted-foreground">Critical Bug Rate</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Crosshair className="size-5 text-violet-300" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-red-300">
                <TrendingUp className="size-3" />
                +3%
              </span>
            </div>
            <p className="mt-6 text-3xl font-bold">92%</p>
            <p className="mt-1 text-sm text-muted-foreground">AI Accuracy</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardHeader>
          <CardTitle>Bug Reports Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[330px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reportData}>
              <defs>
                <linearGradient id="bugGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#111119",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="bugs"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#bugGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Bugs by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={92}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111119",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="bugs" fill="#8b5cf6" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resolutionData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#111119",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Top Affected Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {affectedPages.map((item, index) => (
              <div key={item.page} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs text-muted-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-violet-300">{item.page}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.count}</p>
                  </div>
                </div>
                <Badge className={severityClass(item.severity)}>{item.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Repeated Issue Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {repeatedPatterns.map((pattern) => (
              <div
                key={pattern.title}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div>
                  <p className="font-semibold">{pattern.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{pattern.seen}</p>
                </div>
                <Badge className="border-orange-500/25 bg-orange-500/15 text-orange-300">
                  {pattern.count}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent shadow-xl shadow-black/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-violet-300" />
            <CardTitle>AI Insights for This Week</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-muted-foreground">Focus Area</p>
            <p className="mt-2 font-semibold">Payment & Checkout Flow</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              23% of critical bugs are in payment, highest impact to revenue.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-muted-foreground">Browser Priority</p>
            <p className="mt-2 font-semibold">Safari iOS Compatibility</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Similar Safari-specific issues suggest broader compatibility review.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-muted-foreground">Team Velocity</p>
            <p className="mt-2 font-semibold text-emerald-300">+15% Improvement</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Resolution time decreased this week, team performance improving.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}