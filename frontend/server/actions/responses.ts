"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashIP } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function submitResponse(formId: string, data: {
  answers: Array<{ questionId: string; value: string }>;
  ipAddress?: string;
  metadata?: object;
}) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new Error("Form not found");
  if (!form.isPublished) throw new Error("Form is not published");
  if (form.expiresAt && new Date() > form.expiresAt) throw new Error("Form has expired");

  const ipHash = data.ipAddress ? hashIP(data.ipAddress) : null;

  if (!form.allowMultiple && ipHash) {
    const existing = await prisma.response.findFirst({
      where: { formId, ipHash },
    });
    if (existing) throw new Error("You have already submitted a response");
  }

  const response = await prisma.response.create({
    data: {
      formId,
      ipHash,
      metadata: data.metadata as any,
      answers: {
        create: data.answers.map((a) => ({
          questionId: a.questionId,
          value: a.value,
        })),
      },
    },
    include: { answers: true },
  });

  revalidatePath(`/forms/${formId}/responses`);
  revalidatePath(`/forms/${formId}/analytics`);
  return response;
}

export async function getFormResponses(formId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  return prisma.response.findMany({
    where: { formId },
    include: {
      answers: {
        include: { question: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function markResponseAsSpam(responseId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { form: true },
  });
  if (!response) throw new Error("Response not found");

  const updated = await prisma.response.update({
    where: { id: responseId },
    data: { isSpam: true },
  });

  revalidatePath(`/forms/${response.formId}/responses`);
  return updated;
}

export async function flagResponse(responseId: string, flagged: boolean) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { form: true },
  });
  if (!response) throw new Error("Response not found");

  const updated = await prisma.response.update({
    where: { id: responseId },
    data: { isFlagged: flagged },
  });

  revalidatePath(`/forms/${response.formId}/responses`);
  return updated;
}

export async function deleteResponse(responseId: string) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { form: true },
  });
  if (!response) throw new Error("Response not found");

  await prisma.response.delete({ where: { id: responseId } });
  revalidatePath(`/forms/${response.formId}/responses`);
}
