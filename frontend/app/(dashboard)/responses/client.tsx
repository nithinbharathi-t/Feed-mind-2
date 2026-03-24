"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  Download,
  Flag,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/use-toast";
import { markResponseAsSpam, flagResponse, deleteResponse } from "@/server/actions/responses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormItem = {
  id: string;
  title: string;
};

type AnswerItem = {
  questionId: string;
  questionLabel: string;
  questionType: string;
  value: string;
};

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
  preview: string;
  answers: AnswerItem[];
};

type FilterTab = "all" | "valid" | "spam" | "flagged";

const scoreBadge = (score: number | null) => {
  if (score === null) return { label: "Unknown", cls: "bg-muted text-muted-foreground" };
  if (score >= 80) return { label: "Strong", cls: "bg-emerald-500/15 text-emerald-400" };
  if (score >= 50) return { label: "Medium", cls: "bg-amber-500/15 text-amber-400" };
  return { label: "Weak", cls: "bg-rose-500/15 text-rose-400" };
};

function sentimentLabel(score: number | null) {
  if (score === null) return { label: "Neutral", cls: "bg-sky-500/15 text-sky-300" };
  if (score >= 0.2) return { label: "Positive", cls: "bg-emerald-500/15 text-emerald-400" };
  if (score <= -0.2) return { label: "Negative", cls: "bg-rose-500/15 text-rose-400" };
  return { label: "Neutral", cls: "bg-sky-500/15 text-sky-300" };
}

function renderAnswer(answer: AnswerItem) {
  const type = answer.questionType.toUpperCase();

  if (type === "RATING" || type === "LINEAR_SCALE") {
    const value = Number(answer.value);
    const normalized = Number.isFinite(value) ? Math.max(0, Math.min(5, Math.round(value))) : 0;
    return (
      <div className="space-y-1">
        <div className="text-amber-400 tracking-wide">
          {"★".repeat(normalized)}
          <span className="text-muted-foreground">{"★".repeat(Math.max(0, 5 - normalized))}</span>
        </div>
        <p className="text-xs text-muted-foreground">{Number.isFinite(value) ? `${value} / 5` : "No rating"}</p>
      </div>
    );
  }

  if (type === "NPS") {
    const value = Number(answer.value);
    const tier = value >= 9 ? "Promoter" : value >= 7 ? "Passive" : "Detractor";
    const tierClass = value >= 9 ? "text-emerald-400" : value >= 7 ? "text-sky-300" : "text-rose-400";
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5">
        <span className={cn("text-lg font-bold", tierClass)}>{Number.isFinite(value) ? value : "-"}</span>
        <span className="text-xs text-muted-foreground">{tier}</span>
      </div>
    );
  }

  if (type === "YES_NO") {
    return (
      <Badge variant="secondary" className="bg-cyan-500/15 text-cyan-300">
        {answer.value || "No answer"}
      </Badge>
    );
  }

  return <p className="text-sm text-foreground/95 leading-relaxed break-words">{answer.value || "No answer"}</p>;
}

export function ResponsesPageClient({
  responses: initialResponses,
  forms,
}: {
  responses: ResponseItem[];
  forms: FormItem[];
}) {
  const [responses, setResponses] = useState(initialResponses);
  const [activeId, setActiveId] = useState(initialResponses[0]?.id ?? "");
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return responses.filter((r) => {
      if (tab === "valid" && r.isSpam) return false;
      if (tab === "spam" && !r.isSpam) return false;
      if (tab === "flagged" && !r.isFlagged) return false;
      if (formFilter !== "all" && r.formId !== formFilter) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.respondent.toLowerCase().includes(q) ||
        r.formTitle.toLowerCase().includes(q) ||
        r.preview.toLowerCase().includes(q) ||
        r.answers.some((a) => a.value.toLowerCase().includes(q))
      );
    });
  }, [responses, tab, formFilter, search]);

  useEffect(() => {
    if (!filtered.length) {
      setActiveId("");
      return;
    }
    if (!filtered.some((r) => r.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  const active = filtered.find((r) => r.id === activeId);

  const validCount = responses.filter((r) => !r.isSpam).length;
  const spamCount = responses.filter((r) => r.isSpam).length;
  const flaggedCount = responses.filter((r) => r.isFlagged).length;
  const positiveCount = responses.filter((r) => (r.sentimentScore ?? 0) >= 0.2 && !r.isSpam).length;
  const negativeCount = responses.filter((r) => (r.sentimentScore ?? 0) <= -0.2 && !r.isSpam).length;

  const runAction = async (id: string, action: () => Promise<void>) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Action failed";
        toast({ title: "Error", description: message, variant: "destructive" });
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleMarkSpam = (id: string) =>
    runAction(id, async () => {
      await markResponseAsSpam(id);
      setResponses((prev) => prev.map((r) => (r.id === id ? { ...r, isSpam: true } : r)));
      toast({ title: "Response marked as spam" });
    });

  const handleToggleFlag = (id: string, nextFlagged: boolean) =>
    runAction(id, async () => {
      await flagResponse(id, nextFlagged);
      setResponses((prev) => prev.map((r) => (r.id === id ? { ...r, isFlagged: nextFlagged } : r)));
      toast({ title: nextFlagged ? "Response flagged" : "Flag removed" });
    });

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("Delete this response permanently?");
    if (!confirmed) return;

    runAction(id, async () => {
      await deleteResponse(id);
      setResponses((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Response deleted" });
    });
  };

  const exportCsv = () => {
    const rows = filtered.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt,
      form: r.formTitle,
      respondent: r.respondent,
      spam: r.isSpam,
      flagged: r.isFlagged,
      integrityScore: r.integrityScore,
      sentimentScore: r.sentimentScore,
      answers: r.answers.map((a) => `${a.questionLabel}: ${a.value}`).join(" | "),
    }));

    const headers = Object.keys(rows[0] ?? {
      id: "",
      submittedAt: "",
      form: "",
      respondent: "",
      spam: "",
      flagged: "",
      integrityScore: "",
      sentimentScore: "",
      answers: "",
    });

    const escapeValue = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escapeValue(row[h as keyof typeof row])).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `feedmind-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 -mx-9 -mt-6 border-b border-border/40 bg-background/95 px-9 py-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Submissions</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Responses</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {responses.length} total · {validCount} valid · {spamCount} spam · across {forms.length} forms
            </p>
          </div>
          <Button onClick={exportCsv} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Stat title="Valid" value={validCount} className="text-emerald-400" />
          <Stat title="Spam" value={spamCount} className="text-amber-300" />
          <Stat title="Flagged" value={flaggedCount} className="text-rose-300" />
          <Stat title="Positive" value={positiveCount} className="text-cyan-300" />
          <Stat title="Negative" value={negativeCount} className="text-rose-300" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {([
            { key: "all", label: "All" },
            { key: "valid", label: "Valid" },
            { key: "spam", label: "Spam" },
            { key: "flagged", label: "Flagged" },
          ] as const).map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={tab === item.key ? "default" : "outline"}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </Button>
          ))}

          <div className="relative ml-auto min-w-[220px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search responses..."
              className="pl-9"
            />
          </div>

          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Forms</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-260px)] grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3 overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-3">
            <CardTitle className="text-sm font-semibold">{filtered.length} Responses</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[65vh] overflow-y-auto p-0">
            {!filtered.length && (
              <div className="p-6 text-sm text-muted-foreground">No responses match this filter.</div>
            )}
            {filtered.map((item) => {
              const sentiment = sentimentLabel(item.sentimentScore);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "w-full border-b border-border/40 p-3 text-left transition-colors hover:bg-muted/30",
                    item.id === activeId && "border-l-2 border-l-cyan-300 bg-cyan-500/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{item.respondent}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.formTitle}</p>
                  <p className="mt-2 truncate text-xs text-foreground/80">{item.preview}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Badge className={cn("text-[10px]", sentiment.cls)}>{sentiment.label}</Badge>
                    {item.isSpam && <Badge variant="warning">Spam</Badge>}
                    {item.isFlagged && !item.isSpam && <Badge variant="destructive">Flagged</Badge>}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="xl:col-span-6">
          {!active ? (
            <CardContent className="flex min-h-[400px] items-center justify-center text-muted-foreground">
              Select a response to view details.
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-2 border-b border-border/50 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{active.respondent}</CardTitle>
                  {active.isSpam ? <Badge variant="warning">Spam</Badge> : <Badge variant="success">Valid</Badge>}
                  {active.isFlagged && <Badge variant="destructive">Flagged</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(active.submittedAt).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>{active.formTitle}</span>
                  <span>•</span>
                  <Badge className={scoreBadge(active.integrityScore).cls}>
                    Integrity {scoreBadge(active.integrityScore).label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="max-h-[56vh] space-y-5 overflow-y-auto pt-5">
                {active.answers.map((answer, index) => (
                  <div key={`${answer.questionId}-${index}`} className="border-b border-border/40 pb-4 last:border-b-0">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Q{index + 1} · {answer.questionLabel}
                    </p>
                    {renderAnswer(answer)}
                  </div>
                ))}
              </CardContent>

              <div className="flex flex-wrap gap-2 border-t border-border/50 p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleFlag(active.id, !active.isFlagged)}
                  disabled={isPending && pendingId === active.id}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  {active.isFlagged ? "Unflag" : "Flag"}
                </Button>
                {!active.isSpam && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkSpam(active.id)}
                    disabled={isPending && pendingId === active.id}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Mark Spam
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(active.id)}
                  disabled={isPending && pendingId === active.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </>
          )}
        </Card>

        <div className="space-y-4 xl:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sentiment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Bar label="Positive" value={responses.length ? Math.round((positiveCount / responses.length) * 100) : 0} className="bg-emerald-400" />
              <Bar label="Negative" value={responses.length ? Math.round((negativeCount / responses.length) * 100) : 0} className="bg-rose-400" />
              <Bar
                label="Neutral"
                value={responses.length ? Math.max(0, 100 - Math.round((positiveCount / responses.length) * 100) - Math.round((negativeCount / responses.length) * 100)) : 0}
                className="bg-sky-300"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Responses By Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {forms.map((form) => {
                const count = responses.filter((r) => r.formId === form.id).length;
                return (
                  <button
                    key={form.id}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-muted/40"
                    onClick={() => setFormFilter(form.id)}
                  >
                    <span className="truncate text-muted-foreground">{form.title}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <QuickStat label="Total responses" value={responses.length} />
              <QuickStat label="Integrity alerts" value={spamCount + flaggedCount} icon={<Shield className="h-4 w-4 text-amber-300" />} />
              <QuickStat label="Filtered view" value={filtered.length} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, className }: { title: string; value: number; className?: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className={cn("mt-1 text-lg font-semibold", className)}>{value}</p>
    </div>
  );
}

function Bar({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40">
        <div className={cn("h-2 rounded-full", className)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1 font-semibold">
        {icon}
        {value}
      </span>
    </div>
  );
}
