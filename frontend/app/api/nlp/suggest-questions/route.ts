import { NextRequest, NextResponse } from "next/server";

const NLP_API_URL = process.env.NLP_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${NLP_API_URL}/api/v1/suggest-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // 15 s timeout — model inference can be slow on first call
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "NLP API error");
      return NextResponse.json(
        { error: err },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[nlp/suggest-questions]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to reach NLP service" },
      { status: 503 }
    );
  }
}
