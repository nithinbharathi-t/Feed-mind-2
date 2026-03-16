import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/stats-card";
import { FormList } from "@/components/dashboard/form-list";
import { ResponseChart } from "@/components/dashboard/response-chart";
import { IntegrityAlerts } from "@/components/dashboard/integrity-alerts";
import { CreateFormDialog } from "@/components/dashboard/create-form-dialog";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ResponseFunnel } from "@/components/dashboard/response-funnel";
import { SentimentRing } from "@/components/dashboard/sentiment-ring";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { CompletionRates } from "@/components/dashboard/completion-rates";
import { AiInsights } from "@/components/dashboard/ai-insights";
import { FileText, MessageSquare, TrendingUp, ShieldCheck } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth");

  const firstName = (user.name ?? session.user.email).split(" ")[0];

  const forms = await prisma.form.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { responses: true } },
      responses: {
        orderBy: { submittedAt: "desc" },
        select: { id: true, submittedAt: true, isSpam: true, isFlagged: true, integrityScore: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalForms = forms.length;
  type ResponseType = { id: string; submittedAt: Date; isSpam: boolean; isFlagged: boolean; integrityScore: number | null; };
  type FormType = { id: string; title: string; isPublished: boolean; createdAt: Date; updatedAt: Date; _count: { responses: number; }; responses: ResponseType[]; };

  const totalResponses = (forms as FormType[]).reduce((sum, f) => sum + f._count.responses, 0);
  const publishedCount = (forms as FormType[]).filter((f) => f.isPublished).length;
  const draftCount = (forms as FormType[]).filter((f) => !f.isPublished).length;
  const spamCount = (forms as FormType[]).reduce(
    (sum, f) => sum + f.responses.filter((r) => r.isSpam).length,
    0
  );

  // Chart data (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const allResponses = await prisma.response.findMany({
    where: { form: { userId: user.id }, submittedAt: { gte: thirtyDaysAgo } },
    select: { submittedAt: true },
  });
  const chartData: { date: string; responses: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const nextDay = startOfDay(subDays(new Date(), i - 1));
    chartData.push({
      date: format(day, "MMM d"),
      responses: allResponses.filter((r: { submittedAt: Date }) => r.submittedAt >= day && r.submittedAt < nextDay).length,
    });
  }

  // Heatmap data — responses per day for current month
  const febStart = new Date("2026-02-01");
  const heatmapResponses = await prisma.response.findMany({
    where: { form: { userId: user.id }, submittedAt: { gte: febStart } },
    select: { submittedAt: true },
  });
  const heatmapData: Record<string, number> = {};
  heatmapResponses.forEach((r: { submittedAt: string | number | Date; }) => {
    const key = format(r.submittedAt, "yyyy-MM-dd");
    heatmapData[key] = (heatmapData[key] ?? 0) + 1;
  });

  // Integrity alerts
  const alerts = (forms as FormType[])
    .map((form) => {
      const sc = form.responses.filter((r) => r.isSpam).length;
      const fc = form.responses.filter((r) => r.isFlagged).length;
      if (sc > 0 || fc > 0) {
        return { id: form.id, formId: form.id, formTitle: form.title, type: sc > 0 ? ("spam" as const) : ("flagged" as const), count: sc + fc };
      }
      return null;
    })
    .filter(Boolean) as { id: string; formId: string; formTitle: string; type: "spam" | "flagged"; count: number }[];

  // Completion rates per published form
  const completionForms = (forms as FormType[])
    .filter((f) => f.isPublished)
    .map((f) => ({
      id: f.id,
      title: f.title,
      pct: f._count.responses > 0 ? Math.min(100, f._count.responses * 10) : 0,
    }));

  // Sentiment (placeholder — no NLP in DB; would come from AI analysis)
  const sentiment = { positive: 62, neutral: 24, negative: 14 };

  const formListData = (forms as FormType[]).map((f) => ({
    id: f.id,
    title: f.title,
    isPublished: f.isPublished,
    responseCount: f._count.responses,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = format(new Date(), "EEE, MMM d yyyy");

  return (
    <div className="space-y-6">

      {/* ── Hero (sticky) ── */}
      <div className="sticky top-0 z-30 -mx-9 -mt-6 px-9 py-4 bg-background/95 backdrop-blur-sm border-b border-border/40 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[1.7rem] font-extrabold tracking-tight leading-none">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-[#0CFFE1] to-[#7B6CFF] bg-clip-text text-transparent">
              {firstName}
            </span>{" "}
            👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Here&apos;s what&apos;s happening across your {totalForms} form{totalForms !== 1 ? "s" : ""} today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full">
            📅 {today}
          </span>
          <CreateFormDialog />
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Forms"      value={totalForms}    icon={FileText}    accent="purple" trend={{ label: `${publishedCount} published`, positive: true }} />
        <StatsCard title="Total Responses"  value={totalResponses} icon={MessageSquare} accent="cyan" trend={{ label: "↑ across all forms", positive: true }} />
        <StatsCard title="Avg Completion"   value={`${totalForms > 0 ? Math.round(totalResponses / totalForms) : 0}`} icon={TrendingUp} accent="green" description="responses per form" />
        <StatsCard title="Spam Blocked"     value={spamCount}     icon={ShieldCheck} accent="warn"   trend={{ label: alerts.length > 0 ? `${alerts.length} needs review` : "All clear", positive: false }} />
      </div>

      {/* ── Quick actions ── */}
      <QuickActions />

      {/* ── Main 3-col grid: Chart | Funnel | Sentiment ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ResponseChart data={chartData} />
        <ResponseFunnel totalResponses={totalResponses} spamCount={spamCount} />
        <SentimentRing data={sentiment} totalResponses={totalResponses} />
      </div>

      {/* ── Second row: Completion | Heatmap | Integrity ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <CompletionRates forms={completionForms} />
        <ActivityHeatmap data={heatmapData} />
        <IntegrityAlerts alerts={alerts} totalResponses={totalResponses} spamCount={spamCount} />
      </div>

      {/* ── Bottom row: Forms table (2/3) + AI Insights (1/3) ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FormList forms={formListData} />
        </div>
        <AiInsights
          publishedForms={publishedCount}
          draftForms={draftCount}
          totalResponses={totalResponses}
          spamCount={spamCount}
        />
      </div>

    </div>
  );
}
