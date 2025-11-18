"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// StatusVerteilung Interface (ohne mock-data Abhängigkeit)
interface StatusVerteilung {
  name: string;
  value: number;
  prozent: number;
  status?: string;
  anzahl?: number;
}
import { getStatusBadge } from "@/lib/utils";

interface StatusChartProps {
  daten: StatusVerteilung[];
}

const COLORS = {
  abgeschlossen: "#10b981",
  in_bearbeitung: "#3b82f6",
  planung: "#f59e0b",
};

export function StatusChart({ daten }: StatusChartProps) {
  const chartData = daten.map((item) => {
    const status = item.status || "planung";
    const badge = getStatusBadge(status as "planung" | "in_bearbeitung" | "abgeschlossen" | "ausstehend");
    return {
      name: badge.label,
      value: item.anzahl || item.value,
      prozent: item.prozent,
      status: status,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status-Verteilung</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, payload }: any) => `${name}: ${payload?.prozent?.toFixed(0) || 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status as keyof typeof COLORS] || "#94a3b8"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} Projekte (${props.payload.prozent.toFixed(1)}%)`,
                name,
              ]}
              labelStyle={{ color: "#1e293b" }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

