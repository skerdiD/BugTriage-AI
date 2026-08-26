import { AlertTriangle, Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PriorityQueueItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type PriorityQueueProps = {
  items: PriorityQueueItem[];
  criticalCount: number;
  highCount: number;
};

const priorityStyles = {
  Critical: "border-red-500/25 bg-red-500/15 text-red-300",
  High: "border-orange-500/25 bg-orange-500/15 text-orange-300",
};

export function PriorityQueue({
  items,
  criticalCount,
  highCount,
}: PriorityQueueProps) {
  return (
    <Card className="overflow-hidden rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/12 via-purple-500/7 to-transparent shadow-xl shadow-black/20">
      <CardContent className="relative p-6">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
            <AlertTriangle className="size-5 text-violet-300" />
          </div>

          <div>
            <h3 className="font-semibold text-white">Needs attention</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Open critical and high-severity tickets, ordered by the current
              priority score. Verify the evidence before acting on the ranking.
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="relative mt-6 flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge
                key={item.id}
                className={cn(
                  "rounded-full px-3 py-1.5",
                  priorityStyles[item.severity]
                )}
              >
                {item.id}: {item.title}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="relative mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
            No critical or high-severity tickets need attention right now.
          </div>
        )}

        <div className="relative mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <Flag className="size-4 text-violet-300" />
            <p className="mt-3 text-sm font-semibold">Where to start</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {items.length > 0
                ? "Open the first ticket, verify the impact, and confirm an assignee owns the next step."
                : "Newly reported urgent tickets will appear here."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-bold text-red-300">{criticalCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Critical tickets</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-bold text-orange-300">{highCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">High-severity tickets</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
