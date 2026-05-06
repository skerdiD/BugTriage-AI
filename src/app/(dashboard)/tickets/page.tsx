"use client";

import {
  Download,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tickets = [
  {
    id: "BUG-2847",
    title: "Payment form fails on Safari mobile",
    severity: "Critical",
    status: "Investigating",
    category: "Payment",
    assignee: "Alex Rivera",
    created: "2h ago",
    confidence: "94%",
  },
  {
    id: "BUG-2846",
    title: "Dashboard widgets not loading for EU users",
    severity: "High",
    status: "In Progress",
    category: "Performance",
    assignee: "Jordan Lee",
    created: "5h ago",
    confidence: "89%",
  },
  {
    id: "BUG-2845",
    title: "Profile image upload shows incorrect error",
    severity: "Medium",
    status: "New",
    category: "UI/UX",
    assignee: "Taylor Morgan",
    created: "1d ago",
    confidence: "92%",
  },
  {
    id: "BUG-2844",
    title: "Email notifications delayed by 15+ minutes",
    severity: "High",
    status: "In Progress",
    category: "Backend",
    assignee: "Sam Chen",
    created: "1d ago",
    confidence: "87%",
  },
  {
    id: "BUG-2843",
    title: "Search autocomplete returns outdated results",
    severity: "Medium",
    status: "New",
    category: "Search",
    assignee: "Casey Kim",
    created: "2d ago",
    confidence: "85%",
  },
  {
    id: "BUG-2842",
    title: "CSV export includes extra columns",
    severity: "Low",
    status: "New",
    category: "Export",
    assignee: "Riley Park",
    created: "2d ago",
    confidence: "91%",
  },
  {
    id: "BUG-2841",
    title: "Mobile menu does not close after navigation",
    severity: "Medium",
    status: "Investigating",
    category: "UI/UX",
    assignee: "Morgan Ellis",
    created: "3d ago",
    confidence: "88%",
  },
  {
    id: "BUG-2840",
    title: "API rate limit headers missing",
    severity: "Low",
    status: "Fixed",
    category: "API",
    assignee: "Jamie Foster",
    created: "3d ago",
    confidence: "93%",
  },
];

function severityClass(severity: string) {
  if (severity === "Critical") return "bg-red-500/15 text-red-300 border-red-500/25";
  if (severity === "High") return "bg-orange-500/15 text-orange-300 border-orange-500/25";
  if (severity === "Medium") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/25";
  return "bg-blue-500/15 text-blue-300 border-blue-500/25";
}

function statusClass(status: string) {
  if (status === "Fixed") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
  if (status === "In Progress") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/25";
  if (status === "Investigating") return "bg-sky-500/15 text-sky-300 border-sky-500/25";
  return "bg-violet-500/15 text-violet-300 border-violet-500/25";
}

export default function TicketsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tickets"
        description="Manage and track AI-triaged bug reports."
        badge="8 active"
      >
        <Button className="rounded-xl bg-violet-600 hover:bg-violet-500">
          <Plus className="mr-2 size-4" />
          Submit New Bug
        </Button>
      </PageHeader>

      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                className="h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
              >
                <Filter className="mr-2 size-4" />
                Filters
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
              >
                <Download className="mr-2 size-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="rounded-2xl border border-white/10 bg-white/[0.04] p-1">
          <TabsTrigger value="all" className="rounded-xl">All (8)</TabsTrigger>
          <TabsTrigger value="new" className="rounded-xl">New (3)</TabsTrigger>
          <TabsTrigger value="investigating" className="rounded-xl">Investigating (2)</TabsTrigger>
          <TabsTrigger value="progress" className="rounded-xl">In Progress (2)</TabsTrigger>
          <TabsTrigger value="fixed" className="rounded-xl">Fixed (1)</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-[34%]">Ticket</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">AI Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="border-white/10 transition hover:bg-violet-500/[0.04]"
              >
                <TableCell>
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{ticket.id}</p>
                    <p className="mt-1 font-semibold text-white">{ticket.title}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={severityClass(ticket.severity)}>
                    {ticket.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusClass(ticket.status)}>{ticket.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{ticket.category}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
                      {ticket.assignee
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </div>
                    <span className="font-medium">{ticket.assignee}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{ticket.created}</TableCell>
                <TableCell className="text-right font-semibold text-violet-300">
                  {ticket.confidence}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="size-5 text-violet-300" />
          <div>
            <p className="font-semibold">Smart ticket views coming later</p>
            <p className="text-sm text-muted-foreground">
              Saved filters, duplicate detection, and AI priority queues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}