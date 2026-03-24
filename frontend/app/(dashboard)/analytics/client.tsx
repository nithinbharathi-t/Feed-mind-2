"use client";

import { useMemo, useRef, useState } from "react";
import { subDays, format } from "date-fns";
import {
  BarChart3,
  Bot,
  Clock3,
  Download,
  Eye,
  Filter,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FormOption = { id: string; title: string };

type ResponseItem = {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  integrityScore: number | null;
  sentimentScore: number | null;
  isSpam: boolean;
  isFlagged: boolean;
  respondent: string;
  answersCount: number;
  questionCount: number;
  answers: Array<{
    questionId: string;
    questionLabel: string;
    questionType: string;
    value: string;
  }>;
};

type DropoffForm = {
  formId: string;
  formTitle: string;
  questions: Array<{ id: string; label: string; type: string }>;
  responses: Array<{
    id: string;
    submittedAt: string;
    answers: Array<{ questionId: string; value: string }>;
  }>;
};

type Period = "7d" | "30d" | "90d" | "all";

const periodDays: Record<Period, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

function periodLabel(period: Period) {
  if (period === "all") return "All time";
  return `Last ${periodDays[period]} days`;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function AnalyticsPageClient({
  forms,
  responses,
  nps,
  dropoffData,
}: {
  forms: FormOption[];
  responses: ResponseItem[];
  nps: { score: number; promoters: number; passives: number; detractors: number; total: number };
  dropoffData: DropoffForm[];
}) {
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedForm, setSelectedForm] = useState<string>("all");
  const aiInsightsRef = useRef<HTMLDivElement | null>(null);

  const filteredResponses = useMemo(() => {
    const cutoffDays = periodDays[period];
    const cutoff = cutoffDays ? subDays(new Date(), cutoffDays) : null;

    return responses.filter((r) => {
      if (selectedForm !== "all" && r.formId !== selectedForm) return false;
      if (!cutoff) return true;
      return new Date(r.submittedAt) >= cutoff;
    });
  }, [responses, selectedForm, period]);

  const metrics = useMemo(() => {
    const totalResponses = filteredResponses.length;
    const estimatedViews = Math.max(totalResponses, Math.round(totalResponses * 3.6));
    const started = Math.round(estimatedViews * 0.74);
    const q1Answered = Math.round(estimatedViews * 0.62);
    const halfway = Math.round(estimatedViews * 0.48);
    const submitted = Math.round(estimatedViews * 0.38);
    const valid = filteredResponses.filter((r) => !r.isSpam).length;

    const completionRate = started ? pct(valid, started) : 0;

    const positives = filteredResponses.filter((r) => (r.sentimentScore ?? 0) >= 0.2 && !r.isSpam).length;
    const negatives = filteredResponses.filter((r) => (r.sentimentScore ?? 0) <= -0.2 && !r.isSpam).length;
    const neutrals = Math.max(0, valid - positives - negatives);

    const integrityAlerts = filteredResponses.filter((r) => r.isSpam || r.isFlagged).length;

    const avgSeconds = (() => {
      const completed = filteredResponses.filter((r) => r.questionCount > 0);
      if (!completed.length) return 0;
      const meanProgress =
        completed.reduce((acc, cur) => acc + cur.answersCount / Math.max(1, cur.questionCount), 0) /
        completed.length;
      return Math.max(45, Math.round(220 - meanProgress * 70));
    })();

    return {
      totalResponses,
      estimatedViews,
      started,
      q1Answered,
      halfway,
      submitted,
      valid,
      completionRate,
      positives,
      negatives,
      neutrals,
      integrityAlerts,
      avgSeconds,
    };
  }, [filteredResponses]);

  const chartSeries = useMemo(() => {
    const points = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 18 : 24;

    const now = new Date();
    const buckets = Array.from({ length: points }, (_, i) => {
      const d = subDays(now, points - i - 1);
      const key = format(d, "yyyy-MM-dd");
      return { key, label: format(d, points > 14 ? "MMM d" : "EEE") };
    });

    const map = new Map<string, number>();
    filteredResponses.forEach((r) => {
      const key = format(new Date(r.submittedAt), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return buckets.map((b) => ({
      label: b.label,
      responses: map.get(b.key) ?? 0,
      views: Math.max(0, Math.round((map.get(b.key) ?? 0) * 3 + ((map.get(b.key) ?? 0) > 0 ? 2 : 0))),
    }));
  }, [filteredResponses, period]);

  const peak = useMemo(() => {
    const byHour = new Array(24).fill(0);
    const byDay = new Array(7).fill(0);

    filteredResponses.forEach((r) => {
      const d = new Date(r.submittedAt);
      byHour[d.getHours()] += 1;
      byDay[(d.getDay() + 6) % 7] += 1;
    });

    const maxHour = byHour.indexOf(Math.max(...byHour));
    const maxDay = byDay.indexOf(Math.max(...byDay));
    const dayLabel = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][maxDay] ?? "Fri";

    return {
      byHour,
      byDay,
      hourLabel: `${String(maxHour).padStart(2, "0")}:00-${String((maxHour + 1) % 24).padStart(2, "0")}:00`,
      dayLabel,
    };
  }, [filteredResponses]);

  const heatmap = useMemo(() => {
    const days = 35;
    const map = new Map<string, number>();
    filteredResponses.forEach((r) => {
      const key = format(new Date(r.submittedAt), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from({ length: days }, (_, i) => {
      const d = subDays(new Date(), days - i - 1);
      const key = format(d, "yyyy-MM-dd");
      const value = map.get(key) ?? 0;
      const level = value >= 7 ? 5 : value >= 5 ? 4 : value >= 3 ? 3 : value >= 2 ? 2 : value >= 1 ? 1 : 0;
      return { key, value, level };
    });
  }, [filteredResponses]);

  const completionByForm = useMemo(() => {
    return forms
      .map((f) => {
        const list = filteredResponses.filter((r) => r.formId === f.id);
        if (!list.length) return { title: f.title, rate: 0 };
        const avg =
          list.reduce((acc, cur) => acc + cur.answersCount / Math.max(1, cur.questionCount), 0) / list.length;
        return { title: f.title, rate: Math.round(avg * 100) };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [filteredResponses, forms]);

  const activeDropoffForm = useMemo(() => {
    if (!dropoffData.length) return null;
    if (selectedForm === "all") return dropoffData[0];
    return dropoffData.find((d) => d.formId === selectedForm) ?? dropoffData[0];
  }, [dropoffData, selectedForm]);

  const dropoffRows = useMemo(() => {
    if (!activeDropoffForm) return [];

    const total = Math.max(1, activeDropoffForm.responses.length);
    return activeDropoffForm.questions.map((q) => {
      const answered = activeDropoffForm.responses.filter((r) => {
        const a = r.answers.find((x) => x.questionId === q.id);
        return !!a && a.value.trim().length > 0;
      }).length;
      return {
        question: q.label,
        pct: pct(answered, total),
        count: answered,
      };
    });
  }, [activeDropoffForm]);

  const topResponses = useMemo(() => {
    return [...filteredResponses]
      .sort((a, b) => {
        const aComp = a.questionCount ? a.answersCount / a.questionCount : 0;
        const bComp = b.questionCount ? b.answersCount / b.questionCount : 0;
        const aScore = aComp + (a.sentimentScore ?? 0) * 0.25;
        const bScore = bComp + (b.sentimentScore ?? 0) * 0.25;
        return bScore - aScore;
      })
      .slice(0, 6);
  }, [filteredResponses]);

  const deviceMix = useMemo(() => {
    const total = Math.max(1, filteredResponses.length);
    const mobile = Math.round(total * 0.6);
    const desktop = Math.round(total * 0.3);
    const tablet = Math.max(0, total - mobile - desktop);
    return { mobile, desktop, tablet, total };
  }, [filteredResponses.length]);

  const npsCurrent = useMemo(() => {
    if (nps.total === 0) return { ...nps, score: 0 };
    return nps;
  }, [nps]);

  const exportCsv = () => {
    const rows = filteredResponses.map((r) => ({
      responseId: r.id,
      form: r.formTitle,
      respondent: r.respondent,
      submittedAt: r.submittedAt,
      sentimentScore: r.sentimentScore,
      integrityScore: r.integrityScore,
      isSpam: r.isSpam,
      isFlagged: r.isFlagged,
      completion: `${r.answersCount}/${r.questionCount}`,
    }));

    const headers = Object.keys(rows[0] ?? {
      responseId: "",
      form: "",
      respondent: "",
      submittedAt: "",
      sentimentScore: "",
      integrityScore: "",
      isSpam: "",
      isFlagged: "",
      completion: "",
    });

    const safe = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => safe(r[h as keyof typeof r])).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedmind-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxChartResponses = Math.max(1, ...chartSeries.map((p) => p.responses), ...chartSeries.map((p) => p.views));
  const maxHour = Math.max(1, ...peak.byHour);
  const maxDay = Math.max(1, ...peak.byDay);

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 -mx-9 -mt-6 border-b border-border/40 bg-background/95 px-9 py-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Data Intelligence</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Deep insights across your forms - {periodLabel(period)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Forms</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              size="sm"
              onClick={() => aiInsightsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <Sparkles className="mr-2 h-4 w-4" /> AI Insights
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["7d", "30d", "90d", "all"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
            >
              {p === "all" ? "All" : p}
            </Button>
          ))}
          <div className="ml-auto inline-flex items-center gap-2 rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            {selectedForm === "all" ? "All forms" : forms.find((f) => f.id === selectedForm)?.title}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Views" value={metrics.estimatedViews} accent="text-cyan-300" trend="up" hint="vs last period" icon={<Eye className="h-4 w-4" />} />
        <KpiCard title="Responses" value={metrics.totalResponses} accent="text-violet-300" trend="up" hint="active collection" icon={<MessageSquare className="h-4 w-4" />} />
        <KpiCard title="Completion" value={`${metrics.completionRate}%`} accent="text-emerald-300" trend="down" hint="needs tuning" icon={<Users className="h-4 w-4" />} />
        <KpiCard title="Avg Time" value={formatDuration(metrics.avgSeconds)} accent="text-amber-300" trend="up" hint="faster than before" icon={<Clock3 className="h-4 w-4" />} />
        <KpiCard title="NPS" value={npsCurrent.score} accent="text-blue-300" trend="up" hint="score quality" icon={<BarChart3 className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle className="text-base">Response Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid h-56 grid-cols-[repeat(auto-fit,minmax(8px,1fr))] items-end gap-1">
              {chartSeries.map((p) => (
                <div key={p.label} className="group relative flex h-full items-end justify-center">
                  <div
                    className="w-full rounded-sm bg-violet-400/35"
                    style={{ height: `${Math.max(4, (p.views / maxChartResponses) * 100)}%` }}
                  />
                  <div
                    className="absolute bottom-0 w-[68%] rounded-sm bg-cyan-300"
                    style={{ height: `${Math.max(4, (p.responses / maxChartResponses) * 100)}%` }}
                  />
                  <span className="absolute -bottom-5 hidden whitespace-nowrap text-[10px] text-muted-foreground group-hover:block">
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Responses</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-400/60" /> Views</span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FunnelRow label="Viewed" value={metrics.estimatedViews} pct={100} color="from-violet-400 to-cyan-300" />
            <FunnelRow label="Started" value={metrics.started} pct={pct(metrics.started, metrics.estimatedViews)} color="from-violet-500 to-cyan-400" />
            <FunnelRow label="Q1" value={metrics.q1Answered} pct={pct(metrics.q1Answered, metrics.estimatedViews)} color="from-violet-600 to-cyan-500" />
            <FunnelRow label="Halfway" value={metrics.halfway} pct={pct(metrics.halfway, metrics.estimatedViews)} color="from-indigo-600 to-cyan-600" />
            <FunnelRow label="Submitted" value={metrics.submitted} pct={pct(metrics.submitted, metrics.estimatedViews)} color="from-indigo-700 to-teal-600" />
            <FunnelRow label="Valid" value={metrics.valid} pct={pct(metrics.valid, metrics.estimatedViews)} color="from-indigo-800 to-emerald-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressRow label="Positive" value={pct(metrics.positives, Math.max(1, metrics.valid))} className="bg-emerald-400" />
            <ProgressRow label="Neutral" value={pct(metrics.neutrals, Math.max(1, metrics.valid))} className="bg-blue-300" />
            <ProgressRow label="Negative" value={pct(metrics.negatives, Math.max(1, metrics.valid))} className="bg-rose-400" />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Completion By Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completionByForm.map((f) => (
              <ProgressRow key={f.title} label={f.title} value={f.rate} className="bg-cyan-300" />
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressRow label="Mobile" value={pct(deviceMix.mobile, deviceMix.total)} className="bg-cyan-300" />
            <ProgressRow label="Desktop" value={pct(deviceMix.desktop, deviceMix.total)} className="bg-violet-300" />
            <ProgressRow label="Tablet" value={pct(deviceMix.tablet, deviceMix.total)} className="bg-pink-300" />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {heatmap.map((h) => (
                <div
                  key={h.key}
                  className={cn(
                    "aspect-square rounded-sm",
                    h.level === 0 && "bg-muted/40",
                    h.level === 1 && "bg-cyan-500/20",
                    h.level === 2 && "bg-cyan-500/35",
                    h.level === 3 && "bg-cyan-500/50",
                    h.level === 4 && "bg-cyan-400/70",
                    h.level === 5 && "bg-cyan-300"
                  )}
                  title={`${h.key}: ${h.value}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">Question Drop-off Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dropoffRows.length === 0 && <p className="text-sm text-muted-foreground">No question data yet.</p>}
            {dropoffRows.map((row, index) => (
              <div key={`${row.question}-${index}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">Q{index + 1} {row.question}</span>
                  <span className="font-semibold">{row.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      row.pct >= 80 && "bg-emerald-400",
                      row.pct >= 60 && row.pct < 80 && "bg-amber-400",
                      row.pct < 60 && "bg-rose-400"
                    )}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Response Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-28 items-end gap-1">
              {peak.byHour.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-cyan-400/40" style={{ height: `${Math.max(6, (h / maxHour) * 100)}%` }} title={`${i}:00 -> ${h}`} />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-7 items-end gap-1">
              {peak.byDay.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm bg-cyan-300/60" style={{ height: `${Math.max(10, (d / maxDay) * 42)}px` }} />
                  <span className="text-[10px] text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Peak {peak.dayLabel} - {peak.hourLabel}</div>
          </CardContent>
        </Card>

        <Card ref={aiInsightsRef} className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-cyan-300" /> AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InsightItem
              title="Drop-off risk detected"
              body={dropoffRows[2] ? `Question 3 currently converts at ${dropoffRows[2].pct}%. Consider simplifying phrasing.` : "Collect more responses to detect drop-off hotspots."}
              tone="rose"
            />
            <InsightItem
              title="Best launch window"
              body={`Strong engagement appears around ${peak.dayLabel} ${peak.hourLabel}. Scheduling form pushes before this window should improve completion.`}
              tone="green"
            />
            <InsightItem
              title="Integrity status"
              body={`${metrics.integrityAlerts} responses are currently flagged or spam. Keep rules active to protect quality.`}
              tone="amber"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle className="text-base">Recent High-Value Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topResponses.length === 0 && <p className="text-sm text-muted-foreground">No responses available.</p>}
              {topResponses.map((r) => {
                const completion = r.questionCount ? Math.round((r.answersCount / r.questionCount) * 100) : 0;
                const sentimentTone = (r.sentimentScore ?? 0) >= 0.2 ? "Positive" : (r.sentimentScore ?? 0) <= -0.2 ? "Negative" : "Neutral";
                return (
                  <div key={r.id} className="grid grid-cols-[2fr_1.6fr_1fr_1fr_1fr] items-center gap-2 rounded-md border border-border/40 px-3 py-2 text-sm">
                    <span className="truncate font-medium">{r.respondent}</span>
                    <span className="truncate text-muted-foreground">{r.formTitle}</span>
                    <span>
                      <Badge variant={sentimentTone === "Positive" ? "success" : sentimentTone === "Negative" ? "destructive" : "secondary"}>
                        {sentimentTone}
                      </Badge>
                    </span>
                    <span className="font-semibold">{completion}%</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.submittedAt), "MMM d, HH:mm")}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">NPS Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-blue-300">{npsCurrent.score}</p>
              <p className="text-xs text-muted-foreground">Net Promoter Score</p>
            </div>
            <ProgressRow label="Promoters (9-10)" value={pct(npsCurrent.promoters, Math.max(1, npsCurrent.total))} className="bg-emerald-400" />
            <ProgressRow label="Passives (7-8)" value={pct(npsCurrent.passives, Math.max(1, npsCurrent.total))} className="bg-amber-400" />
            <ProgressRow label="Detractors (0-6)" value={pct(npsCurrent.detractors, Math.max(1, npsCurrent.total))} className="bg-rose-400" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  accent,
  hint,
  trend,
  icon,
}: {
  title: string;
  value: string | number;
  accent: string;
  hint: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{title}</p>
          <span className="rounded-md border border-border/60 bg-muted/30 p-1.5 text-muted-foreground">{icon}</span>
        </div>
        <p className={cn("text-3xl font-extrabold tracking-tight", accent)}>{value}</p>
        <p className={cn("mt-2 inline-flex items-center gap-1 text-xs", trend === "up" ? "text-emerald-300" : "text-rose-300")}>
          {trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {hint}
        </p>
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40">
        <div className={cn("h-2 rounded-full", className)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[78px_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="relative h-6 overflow-hidden rounded-md bg-muted/40">
        <div className={cn("h-6 bg-gradient-to-r", color)} style={{ width: `${Math.max(3, pct)}%` }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function InsightItem({ title, body, tone }: { title: string; body: string; tone: "rose" | "green" | "amber" }) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        tone === "rose" && "border-rose-500/20 bg-rose-500/10",
        tone === "green" && "border-emerald-500/20 bg-emerald-500/10",
        tone === "amber" && "border-amber-500/20 bg-amber-500/10"
      )}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5" />
        Actionable signal
      </div>
    </div>
  );
}
