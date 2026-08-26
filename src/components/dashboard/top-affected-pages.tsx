import { Code2 } from "lucide-react";

import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopAffectedPage } from "@/lib/dashboard/types";

type TopAffectedPagesProps = {
  pages: TopAffectedPage[];
};

export function TopAffectedPages({ pages }: TopAffectedPagesProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Code2 className="size-5 text-violet-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Most affected pages</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              The routes and product areas linked to the most tickets.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {pages.length > 0 ? (
          pages.map((page, index) => (
            <div
              key={page.path}
              className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-bold text-muted-foreground">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-violet-300">
                    {page.path}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {page.bugCount} {page.bugCount === 1 ? "ticket" : "tickets"}
                  </p>
                </div>
              </div>

              <SeverityBadge severity={page.severity} />
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
            Routes will appear here once tickets include specific page or component
            details.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
