import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const forms = await prisma.form.findMany({
      where: { userId: user.id },
      include: { _count: { select: { responses: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(forms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const data = await req.json();

    const form = await prisma.form.create({
      data: {
        title: data.title,
        description: data.description,
        userId: user.id,
        isAnonymous: data.isAnonymous || false,
        allowMultiple: data.allowMultiple || false,
        theme: data.theme,
        questions: {
          create: (data.questions || []).map((q: any, i: number) => ({
            type: q.type,
            label: q.label,
            placeholder: q.placeholder,
            required: q.required || false,
            options: q.options,
            order: q.order ?? i,
            aiGenerated: q.aiGenerated || false,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
