"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { de } from "date-fns/locale";
// ZeitverlaufDaten Interface (ohne mock-data Abhängigkeit)
interface ZeitverlaufDaten {
  datum: string;
  stunden: number;
  projektName?: string;
}
import { formatStunden } from "@/lib/utils";

interface ZeitverlaufChartProps {
  daten: ZeitverlaufDaten[];
}

export function ZeitverlaufChart({ daten }: ZeitverlaufChartProps) {
  const chartData = daten.map((item) => ({
    datum: format(new Date(item.datum), "dd.MM", { locale: de }),
    stunden: Number(item.stunden.toFixed(1)),
    vollstaendigesDatum: item.datum,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zeitverlauf</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="datum"
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => formatStunden(value)}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const vollstaendigesDatum = payload[0].payload.vollstaendigesDatum;
                  return format(
                    new Date(vollstaendigesDatum),
                    "dd.MM.yyyy",
                    { locale: de }
                  );
                }
                return label;
              }}
              labelStyle={{ color: "#1e293b" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="stunden"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
              name="Stunden"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

