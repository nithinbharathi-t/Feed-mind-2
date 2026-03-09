import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIP } from "@/lib/utils";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const form = await prisma.form.findUnique({
      where: { id: params.formId },
      include: { questions: true },
    });

    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    if (!form.isPublished) return NextResponse.json({ error: "Form not published" }, { status: 403 });
    if (form.expiresAt && new Date() > form.expiresAt)
      return NextResponse.json({ error: "Form expired" }, { status: 410 });

    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const ipHash = hashIP(ip);

    if (!form.allowMultiple) {
      const existing = await prisma.response.findFirst({ where: { formId: form.id, ipHash } });
      if (existing) return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    const { answers, respondentEmail, metadata } = await req.json();

    // Validate required questions
    for (const question of form.questions) {
      if (question.required) {
        const answer = answers?.find((a: any) => a.questionId === question.id);
        if (!answer || !answer.value?.trim()) {
          return NextResponse.json(
            { error: `Question "${question.label}" is required` },
            { status: 400 }
          );
        }
      }
    }

    // Check for potential spam (time too fast)
    const timeOnForm = metadata?.timeOnForm || 0;
    const isSpam = timeOnForm < 10;

    const response = await prisma.response.create({
      data: {
        formId: form.id,
        ipHash,
        isSpam,
        isFlagged: isSpam,
        metadata: {
          ...(metadata || {}),
          ...(respondentEmail ? { respondentEmail } : {}),
        },
        answers: {
          create: (answers || []).map((a: any) => ({
            questionId: a.questionId,
            value: a.value || "",
          })),
        },
      },
      include: { answers: true },
    });

    // Async integrity/sentiment scoring will be triggered separately
    return NextResponse.json({ success: true, responseId: response.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
