"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ResponseVolumeChartProps {
  data: { date: string; count: number }[];
}

export function ResponseVolumeChart({ data }: ResponseVolumeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Response Volume</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
              <XAxis dataKey="date" stroke="hsl(240 5% 64.9%)" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(240 5% 64.9%)" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240 6% 10%)",
                  border: "1px solid hsl(240 4% 16%)",
                  borderRadius: "8px",
                  color: "hsl(0 0% 98%)",
                }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(239 84% 67%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
