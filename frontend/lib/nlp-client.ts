/**
 * Typed client for the FeedMind trained NLP model API (v2).
 *
 * The model server exposes:
 *   POST /analyze-feedback  – sentiment + suggestion + keywords for a single text
 *   GET  /health            – liveness / readiness probe
 *
 * Start the model server from the project root:
 *   cd nlp_model && python run_api.py
 */

const NLP_API_URL = (process.env.NLP_API_URL || "http://localhost:8000").replace(/\/$/, "");

export interface NlpFeedbackResult {
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  suggestion: string;
  keywords: string[];
}

export interface NlpBatchItem {
  text: string;
  /** Star rating 1–5. Defaults to 3 (neutral) when not provided. */
  rating?: number;
  category?: string;
}

/**
 * Analyse a single piece of feedback text using the trained model.
 * @param feedbackText  Raw text to analyse.
 * @param rating        Star rating 1-5 (defaults to 3).
 * @param category      Optional product category hint (e.g. "ui").
 */
export async function analyzeFeedback(
  feedbackText: string,
  rating: number = 3,
  category?: string
): Promise<NlpFeedbackResult> {
  const body: Record<string, unknown> = {
    feedback_text: feedbackText.trim(),
    rating: Math.max(1, Math.min(5, Math.round(rating))),
  };
  if (category) body.category = category;

  const res = await fetch(`${NLP_API_URL}/analyze-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // 30-second server-side timeout guard
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = await res.json();
      message = err?.detail?.message ?? err?.message ?? message;
    } catch {}
    throw new Error(`NLP API ${res.status}: ${message}`);
  }

  return res.json() as Promise<NlpFeedbackResult>;
}

/**
 * Analyse multiple feedback texts in parallel.
 * The v2 API does not expose a batch endpoint, so requests run concurrently
 * with a concurrency cap to avoid overwhelming the model server.
 */
export async function analyzeFeedbackBatch(
  items: NlpBatchItem[],
  concurrency = 5
): Promise<NlpFeedbackResult[]> {
  const results: NlpFeedbackResult[] = new Array(items.length);

  // Process in chunks of `concurrency`
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((item) => analyzeFeedback(item.text, item.rating ?? 3, item.category))
    );
    chunkResults.forEach((r, j) => {
      results[i + j] = r;
    });
  }

  return results;
}

/**
 * Returns true if the NLP model server is up and the model is loaded.
 */
export async function checkNlpHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${NLP_API_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    const data = await res.json();
    return data?.model_loaded === true;
  } catch {
    return false;
  }
}
