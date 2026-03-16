import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicFormClient } from "./client";

export default async function PublicFormPage({ params }: { params: { formId: string } }) {
  const form = await prisma.form.findUnique({
    where: { id: params.formId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!form || !form.isPublished) notFound();
  if (form.expiresAt && new Date() > form.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Form Expired</h1>
          <p className="text-muted-foreground">This form is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  return (
    <PublicFormClient
      form={{
        id: form.id,
        title: form.title,
        description: form.description,
        isAnonymous: form.isAnonymous,
        emailCollection: form.emailCollection as "NONE" | "VERIFIED" | "INPUT",
        theme: form.theme as any,
        questions: form.questions.map((q) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          placeholder: q.placeholder,
          required: q.required,
          options: q.options as string[] | null,
        })),
      }}
    />
  );
}
