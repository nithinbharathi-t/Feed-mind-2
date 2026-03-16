import Groq from "groq-sdk";
import { analyzeFeedback, analyzeFeedbackBatch, type NlpBatchItem } from "./nlp-client";

const MODEL = "llama-3.3-70b-versatile";

export function getGroqClient(userApiKey?: string | null) {
  const key = userApiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey: key });
}

async function generateText(prompt: string, userApiKey?: string | null, temperature = 0.7): Promise<string> {
  const key = (userApiKey || process.env.GROQ_API_KEY || "").trim();
  if (!key) throw new Error("No Groq API key configured. Add GROQ_API_KEY to .env.local or set one in your profile.");
  const groq = new Groq({ apiKey: key });
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature,
  });
  return completion.choices[0]?.message?.content || "";
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return match ? match[0] : text.trim();
}

export async function generateFormFromPrompt(
  prompt: string,
  userApiKey?: string | null
) {
  const text = await generateText(
    `You are a form builder AI. Based on the following description, generate a feedback form.
Return a JSON object with this exact structure:
{
  "title": "Form Title",
  "description": "Form description",
  "questions": [
    {
      "type": "SHORT_TEXT" | "LONG_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "DROPDOWN" | "RATING" | "NPS" | "DATE" | "FILE_UPLOAD" | "LINEAR_SCALE" | "YES_NO",
      "label": "Question text",
      "placeholder": "Optional placeholder",
      "required": true/false,
      "options": ["option1", "option2"]
    }
  ]
}

User's description: ${prompt}

Return ONLY valid JSON, no markdown, no explanation.`,
    userApiKey,
    0.7
  );
  return JSON.parse(extractJson(text));
}

export async function suggestQuestions(
  existingQuestions: string[],
  context: string,
  userApiKey?: string | null
) {
  const text = await generateText(
    `You are a form builder AI. Given these existing questions for a form about "${context}":
${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Suggest 3 additional questions that would improve this form. Return a JSON array:
[
  {
    "type": "SHORT_TEXT" | "LONG_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "DROPDOWN" | "RATING" | "NPS" | "DATE" | "LINEAR_SCALE" | "YES_NO",
    "label": "Question text",
    "placeholder": "Optional placeholder",
    "required": true/false,
    "options": ["option1", "option2"]
  }
]

Return ONLY valid JSON.`,
    userApiKey,
    0.7
  );
  return JSON.parse(extractJson(text));
}

export async function analyzeResponses(
  formTitle: string,
  responses: object[],
  userApiKey?: string | null
) {
  // ── Extract all text answers from all responses ────────────────────────────
  type AnswerRow = { question: string; answer: string };
  const allAnswers: AnswerRow[] = (responses as any[]).flatMap((r: any) =>
    (r.answers ?? []).filter((a: any) => typeof a.answer === "string" && a.answer.trim())
  );

  // ── Run trained model on each text answer in parallel ────────────────────
  let overallSentiment: "positive" | "neutral" | "negative" = "neutral";
  let suggestionTexts: string[] = [];
  let allKeywords: string[] = [];

  if (allAnswers.length > 0) {
    const items: NlpBatchItem[] = allAnswers.map((a) => ({ text: a.answer }));
    try {
      const nlpResults = await analyzeFeedbackBatch(items);

      // Aggregate sentiment (majority vote)
      const counts = { positive: 0, neutral: 0, negative: 0 };
      for (const r of nlpResults) counts[r.sentiment]++;
      overallSentiment = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as typeof overallSentiment);

      // Collect suggestions and keywords from the model
      suggestionTexts = nlpResults.map((r) => r.suggestion).filter(Boolean);
      allKeywords = Array.from(new Set(nlpResults.flatMap((r) => r.keywords)));
    } catch (_err) {
      // Fall through to Groq fallback below
    }
  }

  // ── Use Groq to synthesise the final structured insight object ────────────
  // We pass the model-generated suggestions back to Groq so it can produce
  // coherent themes / complaints / action items without doing sentiment itself.
  const modelContext =
    suggestionTexts.length > 0
      ? `\n\nThe AI model already produced these per-answer improvement suggestions:\n${suggestionTexts.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "";

  const text = await generateText(
    `Analyze these responses for the form "${formTitle}":
${JSON.stringify(responses, null, 2)}${modelContext}

The overall sentiment determined by the trained model is: ${overallSentiment}

Return a JSON object:
{
  "keyThemes": ["theme1", "theme2"],
  "commonComplaints": ["complaint1", "complaint2"],
  "actionableSuggestions": ["suggestion1", "suggestion2"],
  "sentimentSummary": "Overall sentiment description",
  "overallSentiment": "positive" | "neutral" | "negative"
}

Return ONLY valid JSON, no markdown.`,
    userApiKey,
    0.3
  );
  return JSON.parse(extractJson(text));
}

export async function scoreResponseIntegrity(
  questions: string[],
  answers: string[],
  userApiKey?: string | null
): Promise<number> {
  const formData = questions.map((q, i) => ({ question: q, answer: answers[i] || "" }));
  const text = await generateText(
    `You are an expert data analyst and AI detector. Analyze the following survey response to determine the Integrity Score.

The Integrity Score (0-100) reflects two things:
1. Respondent Engagement: Did they read and answer thoughtfully?
2. Authenticity: Is the text human-written or AI-generated?

Scoring Rules:
- High Score (80-100): Detailed, authentic, consistent, human-sounding answers.
- Medium Score (50-79): Acceptable but short answers, or slight AI-sounding phrasing.
- Low Score (0-49): One-word answers, gibberish, contradictions, OR highly probable AI-generated content.

Response JSON: ${JSON.stringify(formData)}

Respond with a JSON object ONLY:
{
  "riskScore": 0-100,
  "qualityScore": 0-100,
  "isVerified": boolean,
  "flags": ["issue1", "issue2"],
  "isAiGenerated": boolean
}
Do not include markdown formatting or explanations. Just the JSON string.`,
    userApiKey,
    0.1
  );
  const result = JSON.parse(extractJson(text));
  return result.qualityScore ?? 50;
}

export async function analyzeSentiment(
  textResponses: string[],
  userApiKey?: string | null
): Promise<"positive" | "neutral" | "negative"> {
  if (textResponses.length === 0) return "neutral";

  // ── Use the trained model for sentiment (primary path) ───────────────────
  try {
    const items: NlpBatchItem[] = textResponses.map((t) => ({ text: t }));
    const results = await analyzeFeedbackBatch(items);

    // Weighted majority vote (weight by confidence)
    const scores = { positive: 0, neutral: 0, negative: 0 };
    for (const r of results) scores[r.sentiment] += r.confidence;
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as "positive" | "neutral" | "negative";
  } catch {
    // ── Groq fallback if model server is unavailable ─────────────────────
    const text = await generateText(
      `Analyze the overall sentiment of these text responses:
${textResponses.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Return ONLY a JSON object: { "sentiment": "positive" | "neutral" | "negative", "score": <number -1 to 1> }`,
      userApiKey,
      0.1
    );
    const result = JSON.parse(extractJson(text));
    return result.sentiment ?? "neutral";
  }
}
