"use client";

import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const trendData = [
  { day: "Mon", bugs: 142 },
  { day: "Tue", bugs: 179 },
  { day: "Wed", bugs: 156 },
  { day: "Thu", bugs: 201 },
  { day: "Fri", bugs: 168 },
  { day: "Sat", bugs: 191 },
];

const severityData = [
  { name: "Critical", value: 23, color: "#ef4444" },
  { name: "High", value: 84, color: "#f97316" },
  { name: "Medium", value: 192, color: "#eab308" },
  { name: "Low", value: 331, color: "#3b82f6" },
];

const tickets = [
  {
    id: "BUG-2847",
    title: "Payment form fails on Safari mobile",
    severity: "Critical",
    category: "Payment",
    assignee: "Alex Rivera",
    confidence: "94%",
    time: "12 min ago",
  },
  {
    id: "BUG-2846",
    title: "Dashboard widgets not loading for users in EU region",
    severity: "High",
    category: "Performance",
    assignee: "Jordan Lee",
    confidence: "89%",
    time: "1 hour ago",
  },
  {
    id: "BUG-2845",
    title: "Profile image upload shows incorrect file size error",
    severity: "Medium",
    category: "UI/UX",
    assignee: "Taylor Morgan",
    confidence: "92%",
    time: "3 hours ago",
  },
  {
    id: "BUG-2844",
    title: "Email notifications delayed by 15+ minutes",
    severity: "High",
    category: "Backend",
    assignee: "Sam Chen",
    confidence: "87%",
    time: "5 hours ago",
  },
];

const statCards = [
  {
    title: "Total Bugs",
    value: "1,247",
    change: "+12%",
    icon: Bug,
    tone: "text-sky-300",
  },
  {
    title: "Critical Issues",
    value: "23",
    change: "-8%",
    icon: AlertTriangle,
    tone: "text-red-300",
  },
  {
    title: "New Reports",
    value: "47",
    change: "+23%",
    icon: TrendingUp,
    tone: "text-violet-300",
  },
  {
    title: "Fixed This Week",
    value: "89",
    change: "+15%",
    icon: CheckCircle2,
    tone: "text-emerald-300",
  },
];

function severityClass(severity: string) {
  if (severity === "Critical") return "bg-red-500/15 text-red-300 border-red-500/25";
  if (severity === "High") return "bg-orange-500/15 text-orange-300 border-orange-500/25";
  if (severity === "Medium") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/25";
  return "bg-blue-500/15 text-blue-300 border-blue-500/25";
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Engineering Dashboard"
        description="AI-powered bug triage and ticket management."
        badge="Live workspace"
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <stat.icon className={`size-5 ${stat.tone}`} />
                </div>
                <span
                  className={
                    stat.change.startsWith("-")
                      ? "text-sm font-medium text-red-300"
                      : "text-sm font-medium text-emerald-300"
                  }
                >
                  {stat.change}
                </span>
              </div>

              <div className="mt-7">
                <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#111119",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Bug Reports Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(139,92,246,0.08)" }}
                  contentStyle={{
                    background: "#111119",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="bugs" radius={[10, 10, 4, 4]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recently AI-Triaged Tickets</CardTitle>
          <span className="text-sm font-medium text-violet-300">View all ↗</span>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04] lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                  <Badge className={severityClass(ticket.severity)}>{ticket.severity}</Badge>
                  <Badge variant="secondary" className="border-white/10 bg-white/[0.06]">
                    {ticket.category}
                  </Badge>
                </div>

                <h3 className="mt-3 font-semibold tracking-tight text-white">
                  {ticket.title}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-4" />
                    {ticket.time}
                  </span>
                  <span>Assigned to {ticket.assignee}</span>
                </div>
              </div>

              <div className="text-left lg:text-right">
                <p className="text-xs text-muted-foreground">AI Confidence</p>
                <p className="mt-1 text-xl font-bold text-violet-300">{ticket.confidence}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent shadow-xl shadow-black/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-violet-300" />
            <h3 className="font-semibold">High Priority Queue</h3>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            AI recommends addressing these critical issues first based on user impact,
            severity, confidence score, and affected revenue flows.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge className="border-red-500/25 bg-red-500/15 text-red-300">
              BUG-2847: Payment form fails
            </Badge>
            <Badge className="border-orange-500/25 bg-orange-500/15 text-orange-300">
              BUG-2846: Dashboard loading issue
            </Badge>
            <Badge className="border-orange-500/25 bg-orange-500/15 text-orange-300">
              BUG-2844: Email delays
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}