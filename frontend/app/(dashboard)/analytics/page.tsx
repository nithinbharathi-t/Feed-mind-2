import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnalyticsPageClient } from "./client";

type AnswerWithQuestion = {
  value: string;
  question: {
    id: string;
    label: string;
    type: string;
  };
};

function parseNpsFromAnswers(answers: AnswerWithQuestion[]) {
  const values = answers
    .filter((a) => a.question.type === "NPS")
    .map((a) => Number(a.value))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 10);

  if (!values.length) {
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      total: 0,
    };
  }

  const promoters = values.filter((v) => v >= 9).length;
  const passives = values.filter((v) => v >= 7 && v <= 8).length;
  const detractors = values.filter((v) => v <= 6).length;
  const score = Math.round((promoters / values.length) * 100 - (detractors / values.length) * 100);

  return {
    score,
    promoters,
    passives,
    detractors,
    total: values.length,
  };
}

function respondentFromAnswers(answers: AnswerWithQuestion[]) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const email = answers.find((a) => emailRegex.test(a.value))?.value;
  return email ?? "anonymous";
}

export default async function AnalyticsPage() {
  if (!process.env.DATABASE_URL) {
    redirect("/auth?error=DatabaseNotConfigured");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth");

  const forms = await prisma.form.findMany({
    where: { userId: user.id },
    include: {
      questions: {
        select: { id: true, label: true, type: true },
        orderBy: { order: "asc" },
      },
      responses: {
        include: {
          answers: {
            include: {
              question: {
                select: { id: true, label: true, type: true },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const responses = forms.flatMap((form) =>
    form.responses.map((response) => ({
      id: response.id,
      formId: form.id,
      formTitle: form.title,
      submittedAt: response.submittedAt.toISOString(),
      integrityScore: response.integrityScore,
      sentimentScore: response.sentimentScore,
      isSpam: response.isSpam,
      isFlagged: response.isFlagged,
      respondent: respondentFromAnswers(response.answers),
      answersCount: response.answers.filter((a) => a.value.trim().length > 0).length,
      questionCount: form.questions.length,
      answers: response.answers.map((a) => ({
        questionId: a.question.id,
        questionLabel: a.question.label,
        questionType: a.question.type,
        value: a.value,
      })),
    }))
  );

  const nps = parseNpsFromAnswers(
    responses.flatMap((r) =>
      r.answers.map((a) => ({
        value: a.value,
        question: {
          id: a.questionId,
          label: a.questionLabel,
          type: a.questionType,
        },
      }))
    )
  );

  const formOptions = forms.map((f) => ({ id: f.id, title: f.title }));

  const dropoffData = forms.map((form) => ({
    formId: form.id,
    formTitle: form.title,
    questions: form.questions,
    responses: form.responses.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt.toISOString(),
      answers: r.answers.map((a) => ({
        questionId: a.question.id,
        value: a.value,
      })),
    })),
  }));

  return (
    <AnalyticsPageClient
      forms={formOptions}
      responses={responses}
      nps={nps}
      dropoffData={dropoffData}
    />
  );
}
