import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateFormFromPrompt } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt || prompt.length < 10) {
      return NextResponse.json({ error: "Prompt too short" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const apiKey = user?.customApiKey ? decrypt(user.customApiKey) : null;

    const result = await generateFormFromPrompt(prompt, apiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
