import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentTicket } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type RecentTicketsProps = {
  tickets: RecentTicket[];
};

const severityStyles = {
  Critical: "border-red-500/25 bg-red-500/15 text-red-300",
  High: "border-orange-500/25 bg-orange-500/15 text-orange-300",
  Medium: "border-yellow-500/25 bg-yellow-500/15 text-yellow-300",
  Low: "border-sky-500/25 bg-sky-500/15 text-sky-300",
};

export function RecentTickets({ tickets }: RecentTicketsProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg">Recently triaged tickets</CardTitle>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300 transition hover:text-violet-200"
        >
          View all tickets
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>

      <CardContent className="space-y-3">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="group flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-violet-500/30 hover:bg-violet-500/[0.045] lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {ticket.id}
                  </span>

                  <Badge
                    className={cn(
                      "rounded-full",
                      severityStyles[ticket.severity]
                    )}
                  >
                    {ticket.severity}
                  </Badge>

                  <Badge className="rounded-full border-white/10 bg-white/[0.07] text-slate-200">
                    {ticket.category}
                  </Badge>
                </div>

                <h3 className="mt-3 text-base font-semibold tracking-tight text-white">
                  {ticket.title}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-4" />
                    {ticket.time}
                  </span>
                  <span>Assigned to {ticket.assignee}</span>
                </div>
              </div>

              <div className="shrink-0 text-left lg:min-w-28 lg:text-right">
                <p className="text-xs text-muted-foreground">AI confidence</p>
                <p className="mt-1 text-xl font-bold text-violet-300">
                  {ticket.confidence}%
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
            Recently triaged tickets will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
