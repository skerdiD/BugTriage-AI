import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnalyticsMetricCardProps = {
  icon: LucideIcon;
  trendIcon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  trend: string;
  trendTone: "positive" | "negative" | "warning";
  accent: "violet" | "green" | "red" | "blue";
};

const accentStyles = {
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  red: "border-red-500/20 bg-red-500/10 text-red-300",
  blue: "border-sky-500/20 bg-sky-500/10 text-sky-300",
};

const trendStyles = {
  positive: "bg-emerald-500/10 text-emerald-300",
  negative: "bg-red-500/10 text-red-300",
  warning: "bg-yellow-500/10 text-yellow-300",
};

export function AnalyticsMetricCard({
  icon: Icon,
  trendIcon: TrendIcon,
  label,
  value,
  helper,
  trend,
  trendTone,
  accent,
}: AnalyticsMetricCardProps) {
  return (
    <Card className="group overflow-hidden rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-white/[0.055]">
      <CardContent className="relative p-6">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

        <div className="relative flex items-start justify-between gap-4">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl border",
              accentStyles[accent]
            )}
          >
            <Icon className="size-5" />
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              trendStyles[trendTone]
            )}
          >
            <TrendIcon className="size-3.5" />
            {trend}
          </span>
        </div>

        <div className="relative mt-7">
          <p className="text-4xl font-bold tracking-tight text-white">{value}</p>
          <p className="mt-2 text-sm font-medium text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}