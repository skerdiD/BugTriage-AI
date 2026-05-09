"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendDataItem } from "@/lib/dashboard/types";

type TrendChartProps = {
  data: TrendDataItem[];
};

export function TrendChart({ data }: TrendChartProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Bug Reports Trend</CardTitle>
      </CardHeader>

      <CardContent className="h-[340px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              cursor={{ fill: "rgba(139,92,246,0.08)" }}
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

            <Bar
              dataKey="bugs"
              fill="#8b5cf6"
              radius={[12, 12, 5, 5]}
              maxBarSize={72}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
