/**
 * Utility to get the correct API key based on the user's selected AI provider
 * This should be called on the backend only - never expose API keys to the frontend
 */

export function getAIProviderKey(provider: string): string | null {
  if (!process.env[`${provider.toUpperCase()}_API_KEY`]) {
    console.warn(`${provider} API key not found in environment variables`);
    return null;
  }
  return process.env[`${provider.toUpperCase()}_API_KEY`]!;
}

export function getAIProviderConfig(provider: string) {
  const key = getAIProviderKey(provider);
  
  if (!key) {
    // Fallback to Gemini if key not found
    return {
      provider: "gemini",
      apiKey: getAIProviderKey("gemini"),
      baseUrl: "https://generativelanguage.googleapis.com",
    };
  }

  const configs: Record<string, any> = {
    gemini: {
      provider: "gemini",
      apiKey: key,
      model: "gemini-2.5-flash",
      baseUrl: "https://generativelanguage.googleapis.com",
    },
    grok: {
      provider: "grok",
      apiKey: key,
      model: "grok-3",
      baseUrl: "https://api.xai.com/v1",
    },
    claude: {
      provider: "claude",
      apiKey: key,
      model: "claude-opus-4-1",
      baseUrl: "https://api.anthropic.com",
    },
  };

  return configs[provider] || configs["gemini"];
}

/**
 * Example of how to use this in your AI generation code:
 * 
 * const config = getAIProviderConfig(user.aiProvider);
 * 
 * if (config.provider === "gemini") {
 *   const response = await fetch(`${config.baseUrl}/v1/generateContent`, {
 *     headers: {
 *       "x-goog-api-key": config.apiKey,
 *     },
 *   });
 * } else if (config.provider === "grok") {
 *   const response = await fetch(`${config.baseUrl}/chat/completions`, {
 *     headers: {
 *       "Authorization": `Bearer ${config.apiKey}`,
 *     },
 *   });
 * } else if (config.provider === "claude") {
 *   const response = await fetch(`${config.baseUrl}/messages`, {
 *     headers: {
 *       "x-api-key": config.apiKey,
 *     },
 *   });
 * }
 */
