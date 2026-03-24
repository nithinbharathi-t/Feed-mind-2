import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    return NextResponse.json(
      {
        error:
          "Database is not configured. Set DATABASE_URL and DIRECT_URL in frontend/.env.local and restart the app.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Environment variable not found: DATABASE_URL") ||
        error.message.includes("Environment variable not found: DIRECT_URL"))
    ) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Set DATABASE_URL and DIRECT_URL in frontend/.env.local and restart the app.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to register account." }, { status: 500 });
  }
}
