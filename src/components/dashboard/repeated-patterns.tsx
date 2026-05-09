import { Repeat2 } from "lucide-react";

import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RepeatedIssuePattern } from "@/lib/dashboard/types";

type RepeatedPatternsProps = {
  patterns: RepeatedIssuePattern[];
};

export function RepeatedPatterns({ patterns }: RepeatedPatternsProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Repeat2 className="size-5 text-sky-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Repeated Issue Patterns</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Recurring failures AI detected across reports.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {patterns.length > 0 ? (
          patterns.map((pattern) => (
            <div
              key={pattern.name}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{pattern.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Last seen {pattern.lastSeen}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-white/10 bg-white/[0.06] text-slate-200">
                    {pattern.category}
                  </Badge>
                  <SeverityBadge severity={pattern.severity} />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Repetition count</p>
                  <p className="mt-1 text-2xl font-bold text-white">{pattern.count}x</p>
                </div>

                <p className="max-w-xs text-right text-xs leading-5 text-muted-foreground">
                  Similar reports grouped by category, browser, component, and root-cause hints.
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
            Repeated issue clusters will appear here after the workspace has enough
            tickets to reveal recurring patterns.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
