import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decodeUserSecrets, encodeUserSecrets } from "@/lib/user-secrets";

function isValidSlackWebhook(url: string) {
  return /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_\-\/]+$/.test(url);
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { webhookUrl } = (await req.json()) as { webhookUrl?: string | null };
    const normalized = typeof webhookUrl === "string" ? webhookUrl.trim() : "";

    if (normalized && !isValidSlackWebhook(normalized)) {
      return NextResponse.json({ error: "Invalid Slack webhook URL" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { customApiKey: true },
    });

    const currentSecrets = decodeUserSecrets(user?.customApiKey);
    const encrypted = encodeUserSecrets({
      ...currentSecrets,
      slackWebhookUrl: normalized || undefined,
    });

    await prisma.user.update({
      where: { email: session.user.email },
      data: { customApiKey: encrypted },
    });

    return NextResponse.json({ success: true, connected: Boolean(normalized) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
