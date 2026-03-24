import { getFormById } from "@/server/actions/forms";
import { redirect } from "next/navigation";
import { EditFormClient } from "./client";

export default async function EditFormPage({ params }: { params: { formId: string } }) {
  const form = await getFormById(params.formId);
  if (!form) redirect("/dashboard");

  return (
    <EditFormClient
      formId={form.id}
      initialData={{
        title: form.title,
        description: form.description || "",
        questions: form.questions.map((q: (typeof form.questions)[number]) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          placeholder: q.placeholder || "",
          required: q.required,
          options: (q.options as string[]) || [],
          order: q.order,
          aiGenerated: q.aiGenerated,
        })),
        isPublished: form.isPublished,
        isAnonymous: form.isAnonymous,
        allowMultiple: form.allowMultiple,
        emailCollection: form.emailCollection as "NONE" | "VERIFIED" | "INPUT",
      }}
    />
  );
}
