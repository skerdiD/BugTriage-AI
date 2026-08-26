import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative";
  accent: "blue" | "red" | "violet" | "green";
};

const accentStyles = {
  blue: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  red: "text-red-300 bg-red-500/10 border-red-500/20",
  violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  green: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
};

export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  trendType,
  accent,
}: StatCardProps) {
  return (
    <Card className="group overflow-hidden rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20 transition-[border-color,background-color] hover:border-violet-500/25 hover:bg-white/[0.05]">
      <CardContent className="relative p-4 sm:p-6">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

        <div className="relative flex items-start justify-between">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-xl border sm:size-11 sm:rounded-2xl",
              accentStyles[accent]
            )}
          >
            <Icon className="size-5" />
          </div>

          <span
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-semibold sm:px-2.5 sm:text-xs",
              trendType === "positive"
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-red-500/10 text-red-300"
            )}
          >
            {trend}
          </span>
        </div>

        <div className="relative mt-5 sm:mt-6">
          <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{value}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
