import { decrypt, encrypt } from "@/lib/utils";

export interface UserSecrets {
  groqApiKey?: string;
  slackWebhookUrl?: string;
}

function normalize(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function decodeUserSecrets(encrypted: string | null | undefined): UserSecrets {
  if (!encrypted) return {};

  try {
    const decrypted = decrypt(encrypted);
    const raw = decrypted.trim();

    // Legacy format stored a single Groq API key as plain text.
    if (!raw.startsWith("{")) {
      return { groqApiKey: normalize(raw) };
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      groqApiKey: normalize(parsed.groqApiKey),
      slackWebhookUrl: normalize(parsed.slackWebhookUrl),
    };
  } catch {
    return {};
  }
}

export function encodeUserSecrets(secrets: UserSecrets): string | null {
  const payload: UserSecrets = {
    groqApiKey: normalize(secrets.groqApiKey),
    slackWebhookUrl: normalize(secrets.slackWebhookUrl),
  };

  if (!payload.groqApiKey && !payload.slackWebhookUrl) {
    return null;
  }

  return encrypt(JSON.stringify(payload));
}
