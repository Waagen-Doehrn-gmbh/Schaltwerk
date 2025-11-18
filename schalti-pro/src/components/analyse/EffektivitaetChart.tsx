"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyseDaten } from "@/types";

interface EffektivitaetChartProps {
  daten: AnalyseDaten[];
}

export function EffektivitaetChart({ daten }: EffektivitaetChartProps) {
  const chartData = daten
    .filter((item) => item.effektivitaet > 0)
    .sort((a, b) => a.effektivitaet - b.effektivitaet)
    .map((item) => ({
      name: item.projektName,
      effektivitaet: Number(item.effektivitaet.toFixed(2)),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effektivität (Stunden pro Komponente)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)} Std/Komp`}
              labelStyle={{ color: "#1e293b" }}
            />
            <Bar dataKey="effektivitaet" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

