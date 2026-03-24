import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResponsesPageClient } from "./client";

function toRespondentFromAnswers(answers: Array<{ value: string }>) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const email = answers.find((a) => emailRegex.test(a.value))?.value;
  if (email) return email;
  return "Anonymous respondent";
}

function toPreviewFromAnswers(answers: Array<{ value: string }>) {
  const firstFilled = answers.find((a) => a.value && a.value.trim().length > 0)?.value;
  if (!firstFilled) return "No answer content";
  return firstFilled.length > 90 ? `${firstFilled.slice(0, 90)}...` : firstFilled;
}

export default async function ResponsesPage() {
  if (!process.env.DATABASE_URL) {
    redirect("/auth?error=DatabaseNotConfigured");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth");

  const responses = await prisma.response.findMany({
    where: { form: { userId: user.id } },
    include: {
      form: {
        select: {
          id: true,
          title: true,
        },
      },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              label: true,
              type: true,
            },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const responseData = responses.map((response) => ({
    id: response.id,
    formId: response.form.id,
    formTitle: response.form.title,
    submittedAt: response.submittedAt.toISOString(),
    integrityScore: response.integrityScore,
    sentimentScore: response.sentimentScore,
    isSpam: response.isSpam,
    isFlagged: response.isFlagged,
    respondent: toRespondentFromAnswers(response.answers),
    preview: toPreviewFromAnswers(response.answers),
    answers: response.answers.map((answer) => ({
      questionId: answer.question.id,
      questionLabel: answer.question.label,
      questionType: answer.question.type,
      value: answer.value,
    })),
  }));

  const forms = Array.from(
    new Map(
      responseData.map((r) => [r.formId, { id: r.formId, title: r.formTitle }])
    ).values()
  );

  return <ResponsesPageClient responses={responseData} forms={forms} />;
}
