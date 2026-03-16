import { NextRequest, NextResponse } from "next/server";

const NLP_API_URL = (process.env.NLP_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid multipart form data." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${NLP_API_URL}/api/v1/suggest-from-document`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(30_000),
    });

    const json = await upstream.json();
    return NextResponse.json(json, { status: upstream.status });
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError";
    return NextResponse.json(
      {
        detail: isTimeout
          ? "NLP server timed out. Make sure the Python NLP server is running."
          : `Cannot reach NLP server at ${NLP_API_URL}. Make sure the Python NLP server is running (cd nlp_model && python run_api.py).`,
      },
      { status: 503 }
    );
  }
}
