import { getFormById } from "@/server/actions/forms";
import { getFormResponses } from "@/server/actions/responses";
import { redirect } from "next/navigation";
import { ResponsesClient } from "./client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "./copy-link-button";
import Link from "next/link";
import { BarChart3, Edit } from "lucide-react";

export default async function ResponsesPage({ params }: { params: { formId: string } }) {
  const form = await getFormById(params.formId);
  if (!form) redirect("/dashboard");

  const responses = await getFormResponses(params.formId);

  return (
    <div className="space-y-6">
      <PageHeader heading={`Responses: ${form.title}`} description={`${responses.length} total responses`}>
        <Button variant="outline" asChild>
          <Link href={`/forms/${params.formId}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit Form</Link>
        </Button>
        <CopyLinkButton formId={params.formId} />
        <Button variant="outline" asChild>
          <Link href={`/forms/${params.formId}/analytics`}><BarChart3 className="h-4 w-4 mr-2" /> Analytics</Link>
        </Button>
      </PageHeader>
      <ResponsesClient
        formId={params.formId}
        questions={form.questions}
        responses={responses.map((r) => ({
          id: r.id,
          submittedAt: r.submittedAt.toISOString(),
          integrityScore: r.integrityScore,
          sentimentScore: r.sentimentScore,
          isSpam: r.isSpam,
          isFlagged: r.isFlagged,
          answers: r.answers.map((a) => ({
            questionId: a.questionId,
            questionLabel: a.question.label,
            value: a.value,
          })),
        }))}
      />
    </div>
  );
}
