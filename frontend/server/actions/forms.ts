"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { formSchema, questionSchema } from "@/lib/validations";
import { z } from "zod";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");
  return user;
}

export async function createForm(data: {
  title: string;
  description?: string;
  questions: Array<{
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    order: number;
    aiGenerated?: boolean;
  }>;
  isAnonymous?: boolean;
  allowMultiple?: boolean;
  emailCollection?: "NONE" | "VERIFIED" | "INPUT";
  expiresAt?: string | null;
  theme?: object;
}) {
  const user = await getCurrentUser();

  const form = await prisma.form.create({
    data: {
      title: data.title,
      description: data.description,
      userId: user.id,
      isAnonymous: data.isAnonymous || false,
      allowMultiple: data.allowMultiple || false,
      emailCollection: data.emailCollection || "NONE",
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      theme: data.theme as any,
      questions: {
        create: data.questions.map((q, i) => ({
          type: q.type as any,
          label: q.label,
          placeholder: q.placeholder,
          required: q.required,
          options: q.options as any,
          order: q.order ?? i,
          aiGenerated: q.aiGenerated || false,
        })),
      },
    },
    include: { questions: true },
  });

  revalidatePath("/dashboard");
  return form;
}

export async function updateForm(formId: string, data: {
  title?: string;
  description?: string;
  isAnonymous?: boolean;
  allowMultiple?: boolean;
  emailCollection?: "NONE" | "VERIFIED" | "INPUT";
  expiresAt?: string | null;
  theme?: object;
}) {
  const user = await getCurrentUser();

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  const updated = await prisma.form.update({
    where: { id: formId },
    data: {
      title: data.title,
      description: data.description,
      isAnonymous: data.isAnonymous,
      allowMultiple: data.allowMultiple,
      emailCollection: data.emailCollection,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      theme: data.theme as any,
    },
  });

  revalidatePath(`/forms/${formId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteForm(formId: string) {
  const user = await getCurrentUser();

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  await prisma.form.delete({ where: { id: formId } });
  revalidatePath("/dashboard");
}

export async function publishForm(formId: string, publish: boolean) {
  const user = await getCurrentUser();

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  const updated = await prisma.form.update({
    where: { id: formId },
    data: { isPublished: publish },
  });

  revalidatePath(`/forms/${formId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function getUserForms() {
  const user = await getCurrentUser();

  return prisma.form.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { responses: true } },
      questions: { orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFormById(formId: string) {
  const user = await getCurrentUser();

  return prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: { answers: true },
        orderBy: { submittedAt: "desc" },
      },
      _count: { select: { responses: true } },
    },
  });
}

export async function addQuestion(formId: string, question: {
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
  aiGenerated?: boolean;
}) {
  const user = await getCurrentUser();

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  const created = await prisma.question.create({
    data: {
      formId,
      type: question.type as any,
      label: question.label,
      placeholder: question.placeholder,
      required: question.required,
      options: question.options as any,
      order: question.order,
      aiGenerated: question.aiGenerated || false,
    },
  });

  revalidatePath(`/forms/${formId}`);
  return created;
}

export async function updateQuestion(questionId: string, data: {
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  type?: string;
}) {
  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      label: data.label,
      placeholder: data.placeholder,
      required: data.required,
      options: data.options as any,
      type: data.type as any,
    },
  });

  revalidatePath(`/forms/${updated.formId}`);
  return updated;
}

export async function deleteQuestion(questionId: string) {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new Error("Question not found");

  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/forms/${question.formId}`);
}

export async function reorderQuestions(formId: string, questionIds: string[]) {
  const updates = questionIds.map((id, index) =>
    prisma.question.update({ where: { id }, data: { order: index } })
  );
  await prisma.$transaction(updates);
  revalidatePath(`/forms/${formId}`);
}
