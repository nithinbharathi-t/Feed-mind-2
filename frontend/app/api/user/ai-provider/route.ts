import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, enabled } = await request.json();

    // Validate provider
    if (!["gemini", "grok", "claude"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid AI provider" },
        { status: 400 }
      );
    }

    // Update user with new AI provider preference
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        aiProvider: provider,
        aiProviderEnabled: enabled,
      },
    });

    return NextResponse.json({
      success: true,
      provider: user.aiProvider,
      enabled: user.aiProviderEnabled,
    });
  } catch (error) {
    console.error("Error updating AI provider:", error);
    return NextResponse.json(
      { error: "Failed to update AI provider" },
      { status: 500 }
    );
  }
}
