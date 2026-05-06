"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SeverityDistributionItem } from "@/lib/mock-data";

type SeverityChartProps = {
  data: SeverityDistributionItem[];
};

export function SeverityChart({ data }: SeverityChartProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Severity Distribution</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_0.75fr] lg:items-center">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={112}
                paddingAngle={4}
                stroke="rgba(8,8,13,0.9)"
                strokeWidth={5}
              >
                {data.map((item) => (
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
        </div>

        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-white">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}