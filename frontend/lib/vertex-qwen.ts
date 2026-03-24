import { GoogleAuth } from "google-auth-library";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SCOPE = "https://www.googleapis.com/auth/cloud-platform";

function getVertexConfig() {
  const projectId = process.env.VERTEX_PROJECT_ID?.trim();
  const region = process.env.VERTEX_REGION?.trim();
  const endpointId = process.env.VERTEX_QWEN_ENDPOINT_ID?.trim();

  if (!projectId || !region || !endpointId) {
    throw new Error(
      "Missing Vertex Qwen configuration. Set VERTEX_PROJECT_ID, VERTEX_REGION and VERTEX_QWEN_ENDPOINT_ID."
    );
  }

  return { projectId, region, endpointId };
}

async function getAccessToken() {
  const auth = new GoogleAuth({ scopes: [SCOPE] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const accessToken = typeof token === "string" ? token : token.token;

  if (!accessToken) {
    throw new Error("Unable to acquire Google Cloud access token for Vertex AI.");
  }

  return accessToken;
}

function extractResponseText(payload: any): string {
  const predictions = payload?.predictions;
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return "";
  }

  const first = predictions[0];

  // OpenAI-like chat completions response.
  const content = first?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim().length > 0) {
    return content;
  }

  // Some models return content array parts.
  const contentParts = first?.choices?.[0]?.message?.content;
  if (Array.isArray(contentParts)) {
    const joined = contentParts
      .map((part: any) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        return "";
      })
      .join("\n")
      .trim();
    if (joined) return joined;
  }

  // Generic fallback.
  const text = first?.text;
  if (typeof text === "string" && text.trim().length > 0) {
    return text;
  }

  return JSON.stringify(first);
}

export async function generateVertexQwenText(
  messages: ChatMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const { projectId, region, endpointId } = getVertexConfig();
  const accessToken = await getAccessToken();

  const maxTokens = options?.maxTokens ?? 1024;
  const temperature = options?.temperature ?? 0.3;

  const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/endpoints/${endpointId}:predict`;

  const body = {
    instances: [
      {
        "@requestFormat": "chatCompletions",
        messages,
        max_tokens: maxTokens,
        temperature,
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Vertex Qwen request failed (${response.status})${errorText ? `: ${errorText}` : ""}`
    );
  }

  const payload = await response.json();
  return extractResponseText(payload);
}
