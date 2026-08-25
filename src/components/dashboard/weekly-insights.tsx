import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Compass,
  Gauge,
  Telescope,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyInsight } from "@/lib/dashboard/types";

type WeeklyInsightsProps = {
  insights: WeeklyInsight[];
};

const insightIcons: Record<WeeklyInsight["type"], LucideIcon> = {
  focus: Compass,
  browser: Gauge,
  velocity: Activity,
};

const insightStyles: Record<WeeklyInsight["type"], string> = {
  focus: "border-red-500/20 bg-red-500/10 text-red-300",
  browser: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  velocity: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
};

export function WeeklyInsights({ insights }: WeeklyInsightsProps) {
  return (
    <Card className="overflow-hidden rounded-3xl border-violet-500/20 bg-gradient-to-br from-violet-500/12 via-purple-500/7 to-transparent shadow-xl shadow-black/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
            <Telescope className="size-5 text-violet-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Signals worth a second look</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Leads pulled from volume, impact, and resolution history—not conclusions.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-3">
        {insights.length > 0 ? (
          insights.map((insight) => {
            const Icon = insightIcons[insight.type];

            return (
              <div
                key={insight.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-violet-500/30 hover:bg-white/[0.06]"
              >
                <div
                  className={`flex size-11 items-center justify-center rounded-2xl border ${insightStyles[insight.type]}`}
                >
                  <Icon className="size-5" />
                </div>

                <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {insight.label}
                </p>

                <h3 className="mt-2 font-semibold text-white">{insight.title}</h3>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {insight.description}
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-medium text-violet-200">A useful next check</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {insight.recommendation}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground md:col-span-3">
            A little more ticket history is needed before these signals are reliable.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
