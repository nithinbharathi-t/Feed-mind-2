"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface QuestionBreakdownProps {
  question: {
    id: string;
    label: string;
    type: string;
  };
  answers: string[];
}

export function QuestionBreakdown({ question, answers }: QuestionBreakdownProps) {
  const isChoice = ["MULTIPLE_CHOICE", "CHECKBOX", "DROPDOWN", "YES_NO"].includes(question.type);
  const isNumeric = ["RATING", "NPS", "LINEAR_SCALE"].includes(question.type);


  if (isChoice) {
    const counts: Record<string, number> = {};
    answers.forEach((a) => {
      a.split(", ").forEach((v) => {
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
    });
    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{question.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
              <XAxis type="number" stroke="hsl(240 5% 64.9%)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(240 5% 64.9%)" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240 6% 10%)",
                  border: "1px solid hsl(240 4% 16%)",
                  borderRadius: "8px",
                  color: "hsl(0 0% 98%)",
                }}
              />
              <Bar dataKey="value" fill="hsl(239 84% 67%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  if (isNumeric) {
    const numericAnswers = answers.map(Number).filter((n) => !isNaN(n));
    const avg = numericAnswers.length > 0 ? (numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length).toFixed(1) : "N/A";
    const counts: Record<string, number> = {};
    numericAnswers.forEach((n) => {
      counts[String(n)] = (counts[String(n)] || 0) + 1;
    });
    const data = Object.entries(counts)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([score, count]) => ({ score, count }));

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{question.label}</CardTitle>
            <span className="text-2xl font-bold text-primary">{avg}</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
              <XAxis dataKey="score" stroke="hsl(240 5% 64.9%)" fontSize={12} />
              <YAxis stroke="hsl(240 5% 64.9%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240 6% 10%)",
                  border: "1px solid hsl(240 4% 16%)",
                  borderRadius: "8px",
                  color: "hsl(0 0% 98%)",
                }}
              />
              <Bar dataKey="count" fill="hsl(239 84% 67%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Text answers
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{question.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {answers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No responses</p>
          ) : (
            answers.slice(0, 10).map((a, i) => (
              <p key={i} className="text-sm border-l-2 border-primary/30 pl-3 py-1">{a || <span className="text-muted-foreground italic">Empty</span>}</p>
            ))
          )}
          {answers.length > 10 && (
            <p className="text-xs text-muted-foreground">...and {answers.length - 10} more</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
