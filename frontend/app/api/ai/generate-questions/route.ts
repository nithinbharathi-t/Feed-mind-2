import { NextRequest, NextResponse } from "next/server";
import { getAIProviderConfig } from "@/lib/ai-provider";

type AIProvider = "gemini" | "grok" | "claude";

type NormalizedQuestion = {
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

const allowedTypes = new Set([
  "SHORT_TEXT",
  "LONG_TEXT",
  "MULTIPLE_CHOICE",
  "CHECKBOX",
  "DROPDOWN",
  "RATING",
  "NPS",
  "DATE",
  "FILE_UPLOAD",
  "LINEAR_SCALE",
  "YES_NO",
]);

const toType = (value: string | undefined): string => {
  const normalized = (value || "SHORT_TEXT").toUpperCase();
  return allowedTypes.has(normalized) ? normalized : "SHORT_TEXT";
};

const extractJsonText = (text: string): string => {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return match ? match[0] : text;
};

function normalizePayload(topic: string, payload: any) {
  const sourceQuestions = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.questions)
      ? payload.questions
      : [];

  const questions: NormalizedQuestion[] = sourceQuestions
    .map((q: any): NormalizedQuestion | null => {
      const label = (q?.label || q?.question || q?.text || "").toString().trim();
      if (!label) return null;
      const options = Array.isArray(q?.options)
        ? q.options.map((opt: any) => String(opt)).filter(Boolean)
        : undefined;

      return {
        type: toType(q?.type),
        label,
        placeholder: q?.placeholder ? String(q.placeholder) : undefined,
        required: Boolean(q?.required),
        options: options && options.length ? options : undefined,
      };
    })
    .filter(Boolean) as NormalizedQuestion[];

  return {
    title: payload?.title || topic,
    description: payload?.description || `AI-generated questions for ${topic}`,
    questions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { topic, count = 5, provider = "gemini" } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const selectedProvider: AIProvider = ["gemini", "grok", "claude"].includes(provider)
      ? provider
      : "gemini";

    const config = getAIProviderConfig(selectedProvider);
    if (!config?.apiKey) {
      return NextResponse.json(
        { error: `Missing ${selectedProvider.toUpperCase()}_API_KEY in environment` },
        { status: 500 }
      );
    }

    const prompt = `Generate ${count} high-quality survey questions about: "${topic}"
    
Questions should be:
- Clear and concise
- Non-leading
- Relevant to the topic
- Varied in question types (open-ended, rating scales, multiple choice)

Return strict JSON with this shape:
{
  "title": "Form title",
  "description": "Short description",
  "questions": [
    {
      "type": "SHORT_TEXT|LONG_TEXT|MULTIPLE_CHOICE|CHECKBOX|DROPDOWN|RATING|NPS|DATE|FILE_UPLOAD|LINEAR_SCALE|YES_NO",
      "label": "Question text",
      "placeholder": "Optional placeholder",
      "required": true,
      "options": ["Option 1", "Option 2"]
    }
  ]
}

Return only JSON with no markdown fences.`;

    try {
      let result: any;
      if (config.provider === "gemini") {
        result = await generateWithGemini(config, prompt);
      } else if (config.provider === "grok") {
        result = await generateWithGrok(config, prompt);
      } else if (config.provider === "claude") {
        result = await generateWithClaude(config, prompt);
      }

      const normalized = normalizePayload(topic, result);
      return NextResponse.json({
        provider: config.provider,
        ...normalized,
      });
    } catch (providerError) {
      console.error(`${config.provider} API error:`, providerError);
      // Fallback to Gemini
      const fallbackConfig = getAIProviderConfig("gemini");
      if (!fallbackConfig?.apiKey) {
        throw providerError;
      }
      const result = await generateWithGemini(fallbackConfig, prompt);
      const normalized = normalizePayload(topic, result);
      return NextResponse.json({
        provider: "gemini",
        ...normalized,
      });
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}

async function generateWithGemini(config: any, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(extractJsonText(text));
}

async function generateWithGrok(config: any, prompt: string) {
  const response = await fetch("https://api.xai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-3",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(extractJsonText(text));
}

async function generateWithClaude(config: any, prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-1",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.content?.[0]?.text || "{}";
  return JSON.parse(extractJsonText(content));
}
