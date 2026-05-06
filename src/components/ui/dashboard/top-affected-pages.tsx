import { Code2, ExternalLink } from "lucide-react";

import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopAffectedPage } from "@/lib/mock-data";

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
            <CardTitle className="text-lg">Top Affected Pages</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Product surfaces creating the most bug volume.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {pages.map((page, index) => (
          <div
            key={page.path}
            className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-bold text-muted-foreground">
                {index + 1}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-mono text-sm font-semibold text-violet-300">
                    {page.path}
                  </p>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {page.bugCount} bugs reported
                </p>
              </div>
            </div>

            <SeverityBadge severity={page.severity} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}