"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface IntegrityChartProps {
  clean: number;
  flagged: number;
  spam: number;
}

const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

export function IntegrityChart({ clean, flagged, spam }: IntegrityChartProps) {
  const data = [
    { name: "Clean", value: clean },
    { name: "Flagged", value: flagged },
    { name: "Spam", value: spam },
  ].filter((d) => d.value > 0);

  const total = clean + flagged + spam;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Response Quality</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            No responses yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240 6% 10%)",
                  border: "1px solid hsl(240 4% 16%)",
                  borderRadius: "8px",
                  color: "hsl(0 0% 98%)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
