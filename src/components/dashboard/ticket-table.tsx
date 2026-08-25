"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UiTicketListItem as Ticket } from "@/lib/dashboard/types";

type TicketTableProps = {
  tickets: Ticket[];
};

export function getCompactRelativeDate(relativeDate: string) {
  if (relativeDate === "less than a minute ago") return "Just now";

  return relativeDate
    .replace(/^about /, "")
    .replace(/^almost /, "~")
    .replace(/^over /, ">")
    .replace(/\bminutes?\b/, "min")
    .replace(/\bhours?\b/, "hr")
    .replace(/\bmonths?\b/, "mo")
    .replace(/\byears?\b/, "yr");
}

function Assignee({ ticket }: { ticket: Ticket }) {
  return (
    <div
      className="flex min-w-0 items-center gap-2.5"
      title={`${ticket.assignee} · ${ticket.assigneeRole}`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-[11px] font-bold text-white shadow-md shadow-violet-500/15">
        {ticket.assigneeInitials}
      </div>
      <span className="truncate text-sm font-medium text-white">
        {ticket.assignee}
      </span>
    </div>
  );
}

function AiConfidence({ confidence }: { confidence: number }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1"
      title={`AI confidence: ${confidence}%`}
    >
      <Bot className="size-3.5 text-violet-300" />
      <span className="text-xs font-bold text-violet-200">{confidence}%</span>
    </div>
  );
}

export function TicketTable({ tickets }: TicketTableProps) {
  const router = useRouter();

  return (
    <>
      <Card className="hidden overflow-hidden rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20 md:block">
        <Table className="table-fixed">
          <TableCaption className="sr-only">
            Ticket list with severity, status, assignee, created date, and AI
            confidence for the current workspace scope.
          </TableCaption>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/[0.025] hover:bg-white/[0.025]">
              <TableHead className="w-auto px-4 py-2.5 text-xs">Ticket</TableHead>
              <TableHead className="w-24 px-3 py-2.5 text-xs">
                Severity
              </TableHead>
              <TableHead className="w-[124px] px-3 py-2.5 text-xs">
                Status
              </TableHead>
              <TableHead className="hidden w-[118px] px-3 py-2.5 text-xs min-[1400px]:table-cell">
                Category
              </TableHead>
              <TableHead className="w-[152px] px-3 py-2.5 text-xs">
                Assignee
              </TableHead>
              <TableHead className="hidden w-[108px] px-3 py-2.5 text-xs min-[1400px]:table-cell">
                Created
              </TableHead>
              <TableHead className="hidden w-[118px] px-3 py-2.5 text-right text-xs xl:table-cell">
                AI Confidence
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tickets.map((ticket) => {
              const compactCreatedAt = getCompactRelativeDate(ticket.createdAt);

              return (
                <TableRow
                  key={ticket.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ticket ${ticket.id}: ${ticket.title}`}
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/tickets/${ticket.id}`);
                    }
                  }}
                  className="group h-16 cursor-pointer border-white/10 transition hover:bg-violet-500/[0.045] focus-visible:bg-violet-500/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-inset"
                >
                  <TableCell className="min-w-0 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] leading-4 text-muted-foreground">
                        {ticket.id}
                      </p>
                      <p
                        className="truncate font-semibold leading-5 text-white"
                        title={ticket.title}
                      >
                        {ticket.title}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <SeverityBadge severity={ticket.severity} />
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <StatusBadge status={ticket.status} />
                  </TableCell>

                  <TableCell className="hidden px-3 py-3 min-[1400px]:table-cell">
                    <Badge
                      className="max-w-full rounded-full border-white/10 bg-white/[0.06] px-2.5 py-1 text-slate-200"
                      title={ticket.category}
                    >
                      <span className="truncate">{ticket.category}</span>
                    </Badge>
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <Assignee ticket={ticket} />
                  </TableCell>

                  <TableCell
                    className="hidden px-3 py-3 text-sm text-muted-foreground min-[1400px]:table-cell"
                    title={ticket.createdAt}
                  >
                    {compactCreatedAt}
                  </TableCell>

                  <TableCell className="hidden px-3 py-3 text-right xl:table-cell">
                    <AiConfidence confidence={ticket.confidence} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="divide-y divide-white/10 overflow-hidden rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20 md:hidden">
        {tickets.map((ticket) => {
          const compactCreatedAt = getCompactRelativeDate(ticket.createdAt);

          return (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              aria-label={`Open ticket ${ticket.id}: ${ticket.title}`}
              className="group block px-4 py-4 transition hover:bg-violet-500/[0.045] focus-visible:bg-violet-500/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-inset"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {ticket.id}
                </span>
                <AiConfidence confidence={ticket.confidence} />
              </div>

              <h3
                className="mt-1.5 line-clamp-2 font-semibold leading-5 text-white"
                title={ticket.title}
              >
                {ticket.title}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SeverityBadge severity={ticket.severity} />
                <StatusBadge status={ticket.status} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                <div className="min-w-0 flex-1">
                  <Assignee ticket={ticket} />
                </div>
                <p className="max-w-[45%] truncate text-right text-xs text-muted-foreground">
                  <span title={ticket.category}>{ticket.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span title={ticket.createdAt}>{compactCreatedAt}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </Card>
    </>
  );
}
