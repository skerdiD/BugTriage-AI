"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Bot } from "lucide-react";

import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Ticket } from "@/lib/mock-data";

type TicketTableProps = {
  tickets: Ticket[];
};

export function TicketTable({ tickets }: TicketTableProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/[0.025] hover:bg-white/[0.025]">
              <TableHead className="min-w-[330px] px-5 py-4">Ticket</TableHead>
              <TableHead className="min-w-[120px] px-5 py-4">Severity</TableHead>
              <TableHead className="min-w-[145px] px-5 py-4">Status</TableHead>
              <TableHead className="min-w-[140px] px-5 py-4">Category</TableHead>
              <TableHead className="min-w-[180px] px-5 py-4">Assignee</TableHead>
              <TableHead className="min-w-[120px] px-5 py-4">Created</TableHead>
              <TableHead className="min-w-[145px] px-5 py-4 text-right">
                AI Confidence
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/tickets/${ticket.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/tickets/${ticket.id}`);
                  }
                }}
                className="group cursor-pointer border-white/10 transition hover:bg-violet-500/[0.045]"
              >
                <TableCell className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition group-hover:border-violet-500/30 group-hover:bg-violet-500/10">
                      <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-violet-300" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        {ticket.id}
                      </p>
                      <p className="mt-1 line-clamp-2 font-semibold leading-5 text-white">
                        {ticket.title}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-5 py-4">
                  <SeverityBadge severity={ticket.severity} />
                </TableCell>

                <TableCell className="px-5 py-4">
                  <StatusBadge status={ticket.status} />
                </TableCell>

                <TableCell className="px-5 py-4">
                  <Badge className="rounded-full border-white/10 bg-white/[0.06] text-slate-200">
                    {ticket.category}
                  </Badge>
                </TableCell>

                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-xs font-bold text-white shadow-lg shadow-violet-500/20">
                      {ticket.assigneeInitials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {ticket.assignee}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.assigneeRole}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                  {ticket.createdAt}
                </TableCell>

                <TableCell className="px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5">
                    <Bot className="size-3.5 text-violet-300" />
                    <span className="text-sm font-bold text-violet-200">
                      {ticket.confidence}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}