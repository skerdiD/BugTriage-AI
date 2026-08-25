"use client";

import type { CSSProperties } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SeverityDistributionItem } from "@/lib/dashboard/types";

type SeverityChartProps = {
  data: SeverityDistributionItem[];
};

export function SeverityChart({ data }: SeverityChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const nonEmptyData = data.filter((item) => item.value > 0);
  const chartData =
    nonEmptyData.length > 0
      ? nonEmptyData
      : [{ name: "Low", value: 1, color: "rgba(255,255,255,0.12)" }];

  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-lg">Impact across the queue</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            A quick check on how much high-impact work is still in the mix.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6 pt-3">
        <div
          role="img"
          aria-label={`Severity distribution across ${total} tickets`}
          className="relative mx-auto h-[250px] w-full min-w-0 max-w-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                stroke="rgba(8,8,13,0.9)"
                strokeWidth={4}
                isAnimationActive={false}
              >
                {chartData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>

              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "#111119",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  color: "#ffffff",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                }}
                itemStyle={{
                  color: "#ffffff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border border-white/10 bg-[#101017]/90 px-5 py-4 text-center shadow-xl shadow-black/30">
              <p className="text-3xl font-bold leading-none text-white">{total}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Tickets
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {data.map((item) => (
            <div
              key={item.name}
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 py-3 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full shadow-[0_0_18px_var(--severity-color)]"
                    style={{
                      backgroundColor: item.color,
                      "--severity-color": item.color,
                    } as CSSProperties}
                  />
                  <span className="truncate text-sm font-medium text-white">
                    {item.name}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-semibold text-white">
                    {item.value}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%"}
                  </span>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
