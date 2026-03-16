import { getFormById } from "@/server/actions/forms";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ResponseVolumeChart } from "@/components/analytics/response-volume-chart";
import { QuestionBreakdown } from "@/components/analytics/question-breakdown";
import { IntegrityChart } from "@/components/analytics/integrity-chart";
import { AiInsightsPanel } from "@/components/analytics/ai-insights-panel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, TrendingUp, Clock, Target, Eye, Edit } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

export default async function AnalyticsPage({ params }: { params: { formId: string } }) {
  const form = await getFormById(params.formId);
  if (!form) redirect("/dashboard");

  const responses = form.responses;
  const totalResponses = responses.length;
  const spamCount = responses.filter((r) => r.isSpam).length;
  const flaggedCount = responses.filter((r) => r.isFlagged && !r.isSpam).length;
  const cleanCount = totalResponses - spamCount - flaggedCount;

  // NPS calculation
  const npsQuestion = form.questions.find((q) => q.type === "NPS");
  let npsScore: number | null = null;
  if (npsQuestion) {
    const npsAnswers = responses
      .flatMap((r) => r.answers)
      .filter((a) => a.questionId === npsQuestion.id)
      .map((a) => parseInt(a.value))
      .filter((n) => !isNaN(n));
    if (npsAnswers.length > 0) {
      const promoters = npsAnswers.filter((n) => n >= 9).length;
      const detractors = npsAnswers.filter((n) => n <= 6).length;
      npsScore = Math.round(((promoters - detractors) / npsAnswers.length) * 100);
    }
  }

  // Volume chart
  const chartData: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const nextDay = startOfDay(subDays(new Date(), i - 1));
    const count = responses.filter(
      (r) => r.submittedAt >= day && r.submittedAt < nextDay
    ).length;
    chartData.push({ date: format(day, "MMM d"), count });
  }

  // Per-question answers
  const questionAnswers = form.questions.map((q) => ({
    question: { id: q.id, label: q.label, type: q.type },
    answers: responses
      .flatMap((r) => r.answers)
      .filter((a) => a.questionId === q.id)
      .map((a) => a.value),
  }));

  return (
    <div className="space-y-6">
      <PageHeader heading={`Analytics: ${form.title}`} description="Detailed analytics and AI insights">
        <Button variant="outline" asChild>
          <Link href={`/forms/${params.formId}/responses`}><Eye className="h-4 w-4 mr-2" /> Responses</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/forms/${params.formId}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Responses" value={totalResponses} icon={MessageSquare} />
        <StatsCard
          title="Completion Rate"
          value={totalResponses > 0 ? "100%" : "0%"}
          icon={TrendingUp}
        />
        <StatsCard title="Avg. Questions" value={form.questions.length} icon={Clock} />
        {npsScore !== null && (
          <StatsCard title="NPS Score" value={npsScore} icon={Target} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <ResponseVolumeChart data={chartData} />
        </div>
        <div className="lg:col-span-3">
          <IntegrityChart clean={cleanCount} flagged={flaggedCount} spam={spamCount} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Per-Question Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {questionAnswers.map((qa) => (
            <QuestionBreakdown
              key={qa.question.id}
              question={qa.question}
              answers={qa.answers}
            />
          ))}
        </div>
      </div>

      <AiInsightsPanel formId={params.formId} hasResponses={totalResponses > 0} />
    </div>
  );
}
