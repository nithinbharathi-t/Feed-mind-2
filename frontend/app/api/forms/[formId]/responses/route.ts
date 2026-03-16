import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const form = await prisma.form.findFirst({ where: { id: params.formId, userId: user.id } });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const responses = await prisma.response.findMany({
      where: { formId: params.formId },
      include: { answers: { include: { question: true } } },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(responses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
