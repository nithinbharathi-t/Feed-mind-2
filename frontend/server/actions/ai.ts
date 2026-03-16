"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decrypt } from "@/lib/utils";
import {
  generateFormFromPrompt,
  suggestQuestions,
  analyzeResponses,
  scoreResponseIntegrity,
  analyzeSentiment,
} from "@/lib/ai";

async function getUserApiKey(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.customApiKey) return null;
  try {
    return decrypt(user.customApiKey);
  } catch {
    return null;
  }
}

export async function generateForm(prompt: string) {
  const apiKey = await getUserApiKey();
  return generateFormFromPrompt(prompt, apiKey);
}

export async function getQuestionSuggestions(existingQuestions: string[], context: string) {
  const apiKey = await getUserApiKey();
  return suggestQuestions(existingQuestions, context, apiKey);
}

export async function analyzeFormResponses(formId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: {
      questions: true,
      responses: { include: { answers: { include: { question: true } } } },
    },
  });
  if (!form) throw new Error("Form not found");

  const responseData = form.responses.map((r: any) => ({
    submittedAt: r.submittedAt,
    answers: r.answers.map((a: any) => ({
      question: a.question.label,
      answer: a.value,
    })),
  }));

  const apiKey = user.customApiKey ? decrypt(user.customApiKey) : null;
  return analyzeResponses(form.title, responseData, apiKey);
}

export async function scoreIntegrity(responseId: string) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { answers: { include: { question: true } }, form: { include: { user: true } } },
  });
  if (!response) throw new Error("Response not found");

  const questions = response.answers.map((a: any) => a.question.label);
  const answers = response.answers.map((a: any) => a.value);

  const apiKey = response.form.user.customApiKey
    ? decrypt(response.form.user.customApiKey)
    : null;

  const score = await scoreResponseIntegrity(questions, answers, apiKey);

  await prisma.response.update({
    where: { id: responseId },
    data: { integrityScore: score },
  });

  return score;
}

export async function runSentimentAnalysis(responseId: string) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      answers: { include: { question: true } },
      form: { include: { user: true } },
    },
  });
  if (!response) throw new Error("Response not found");

  const textAnswers = response.answers
    .filter((a: any) => ["SHORT_TEXT", "LONG_TEXT"].includes(a.question.type))
    .map((a: any) => a.value)
    .filter((v: any) => v.length > 0);

  if (textAnswers.length === 0) return null;

  const apiKey = response.form.user.customApiKey
    ? decrypt(response.form.user.customApiKey)
    : null;

  const sentiment = await analyzeSentiment(textAnswers, apiKey);
  const sentimentScore = sentiment === "positive" ? 1 : sentiment === "negative" ? -1 : 0;

  await prisma.response.update({
    where: { id: responseId },
    data: { sentimentScore },
  });

  return sentiment;
}

// ── NLP model question suggestions ───────────────────────────────────────────

export interface NlpSuggestedQuestion {
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

export interface NlpSuggestResult {
  topic: string;
  questions: NlpSuggestedQuestion[];
  keywords: string[];
  model_used: "trained_pipeline" | "nltk_fallback" | "regex_fallback";
}

export interface NlpDocumentResult {
  topic: string;
  filename: string;
  extracted_text_length: number;
  questions: NlpSuggestedQuestion[];
  keywords: string[];
  model_used: "trained_pipeline" | "document_extraction";
}

/**
 * Ask the locally trained NLP model to suggest survey questions for a topic.
 * Calls the FastAPI /api/v1/suggest-questions endpoint directly (server-side).
 */
export async function suggestQuestionsFromNlp(
  topic: string,
  count = 6,
  category?: string
): Promise<NlpSuggestResult> {
  const nlpUrl =
    (process.env.NLP_API_URL || "http://localhost:8000").replace(/\/$/, "");

  let res: Response;
  try {
    res = await fetch(`${nlpUrl}/api/v1/suggest-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, count, category: category ?? null }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err: any) {
    throw new Error(
      `Cannot reach the NLP server at ${nlpUrl}. Make sure the Python NLP server is running (cd nlp_model && python run_api.py). Details: ${err?.message ?? err}`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `NLP suggestion service error (${res.status})${text ? ": " + text : ""}. Make sure the Python NLP server is running.`
    );
  }

  return res.json() as Promise<NlpSuggestResult>;
}

/**
 * Generate questions using the globally trained model with BERT context analysis
 * This model analyzes uploaded documents using BERT and generates context-specific questions
 */
export async function generateQuestionsFromTrainedModel(
  prompt: string,
  numQuestions: number = 5,
  useUploadedData: boolean = true
): Promise<{
  questions: Array<{
    id: string;
    text: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    min?: number;
    max?: number;
    minLabel?: string;
    maxLabel?: string;
  }>;
  generated_from_context: boolean;
  num_documents_used: number;
  message: string;
}> {
  const nlpUrl =
    (process.env.NLP_API_URL || "http://localhost:8000").replace(/\/$/, "");

  try {
    const res = await fetch(`${nlpUrl}/api/v1/questions/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        num_questions: numQuestions,
        use_uploaded_data: useUploadedData
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `NLP API error: ${res.status}`);
    }

    const data = await res.json();
    
    // Convert to Next.js format (map text -> label for compatibility)
    const convertedQuestions = data.questions.map((q: any) => ({
      ...q,
      label: q.text,
    }));

    return {
      questions: convertedQuestions,
      generated_from_context: data.generated_from_context,
      num_documents_used: data.num_documents_used,
      message: data.message
    };
  } catch (err: any) {
    // Fallback to template-based generation if trained model fails
    console.error("Trained model error, using fallback:", err);
    const fallback = generateFallbackQuestions(prompt, numQuestions);
    return {
      questions: fallback.questions.map((q, i) => ({
        id: `fallback-${i}`,
        text: q.label,
        type: q.type,
        placeholder: q.placeholder,
        required: q.required,
        options: q.options
      })),
      generated_from_context: false,
      num_documents_used: 0,
      message: "Using fallback templates (NLP API unavailable)"
    };
  }
}

/**
 * Fallback question generation when trained model is unavailable
 */
function generateFallbackQuestions(prompt: string, count: number) {
  const promptLower = prompt.toLowerCase();
  let questions = [];

  // Context-aware fallback questions
  if (promptLower.includes("customer") || promptLower.includes("service")) {
    questions = [
      {
        type: "radio",
        label: "How would you rate your overall experience?",
        required: true,
        options: ["1 - Poor", "2 - Fair", "3 - Good", "4 - Very Good", "5 - Excellent"]
      },
      {
        type: "radio",
        label: "How likely are you to recommend us?",
        required: true,
        options: ["Not at all likely", "Unlikely", "Neutral", "Likely", "Very likely"]
      },
      {
        type: "textarea",
        label: "What did you like most?",
        placeholder: "Share your thoughts...",
        required: false
      },
      {
        type: "textarea",
        label: "What can we improve?",
        placeholder: "Your suggestions...",
        required: false
      },
      {
        type: "email",
        label: "Email (optional for follow-up)",
        placeholder: "your@email.com",
        required: false
      }
    ];
  } else {
    questions = [
      {
        type: "text",
        label: `What brings you to this ${prompt}?`,
        placeholder: "Your answer...",
        required: true
      },
      {
        type: "radio",
        label: "How would you rate your experience?",
        required: true,
        options: ["1 - Poor", "2 - Fair", "3 - Good", "4 - Very Good", "5 - Excellent"]
      },
      {
        type: "textarea",
        label: "Please share any additional feedback",
        placeholder: "Your thoughts...",
        required: false
      },
      {
        type: "email",
        label: "Email address (optional)",
        placeholder: "your@email.com",
        required: false
      }
    ];
  }

  return {
    questions: questions.slice(0, count),
    model_used: "fallback_templates",
    prompt
  };
}

/**
 * Get training model information
 */
export async function getTrainedModelInfo(): Promise<{
  model_loaded: boolean;
  model_type: string;
  context_analyzer: string;
  question_generator: string;
  features: string[];
  status: string;
}> {
  const nlpUrl =
    (process.env.NLP_API_URL || "http://localhost:8000").replace(/\/$/, "");

  try {
    const res = await fetch(`${nlpUrl}/api/v1/questions/model-info`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      throw new Error(`Failed to get model info: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error getting model info:", err);
    return {
      model_loaded: false,
      model_type: "unknown",
      context_analyzer: "unknown",
      question_generator: "unknown",
      features: [],
      status: "unavailable"
    };
  }
}

/**
 * Analyze context from uploaded documents (for debugging/previewing)
 */
export async function analyzeUploadedContext(prompt: string): Promise<{
  message: string;
  num_documents: number;
  total_contexts: number;
  relevant_contexts: Array<{
    context: any;
    similarity: number;
    relevance: string;
  }>;
}> {
  const nlpUrl =
    (process.env.NLP_API_URL || "http://localhost:8000").replace(/\/$/, "");

  try {
    const res = await fetch(`${nlpUrl}/api/v1/questions/analyze-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`Failed to analyze context: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error analyzing context:", err);
    return {
      message: "Error analyzing context",
      num_documents: 0,
      total_contexts: 0,
      relevant_contexts: []
    };
  }
}
