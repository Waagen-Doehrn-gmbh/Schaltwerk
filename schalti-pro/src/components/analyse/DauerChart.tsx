"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyseDaten } from "@/types";
import { formatStunden } from "@/lib/utils";

interface DauerChartProps {
  daten: AnalyseDaten[];
}

export function DauerChart({ daten }: DauerChartProps) {
  const chartData = daten
    .sort((a, b) => b.dauer - a.dauer)
    .map((item) => ({
      name: item.projektName,
      dauer: Number(item.dauer.toFixed(1)),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dauer pro Projekt</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => formatStunden(value)}
              labelStyle={{ color: "#1e293b" }}
            />
            <Bar dataKey="dauer" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

