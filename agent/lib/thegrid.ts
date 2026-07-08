import { createOpenAI } from "@ai-sdk/openai";

const THEGRID_BASE_URL = "https://api.thegrid.ai/v1";

/** Default instrument for HR admin Q&A. Override with THEGRID_MODEL. */
export const THEGRID_DEFAULT_MODEL = "text-prime";

/** Conservative default for The Grid text-prime when Eve cannot resolve catalog metadata. */
export const THEGRID_CONTEXT_WINDOW_TOKENS = 128_000;

export function createTheGridProvider() {
  const apiKey = process.env.THEGRID_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return createOpenAI({
    baseURL: THEGRID_BASE_URL,
    apiKey,
    name: "thegrid",
  });
}

export function resolveTheGridModelId(): string {
  const configured = process.env.THEGRID_MODEL?.trim();
  return configured && configured.length > 0 ? configured : THEGRID_DEFAULT_MODEL;
}

export function resolveTheGridModel() {
  const provider = createTheGridProvider();
  if (!provider) {
    throw new Error(
      "THEGRID_API_KEY is required. Create a Consumption API key at https://app.thegrid.ai/profile/api-keys"
    );
  }

  return provider(resolveTheGridModelId());
}
