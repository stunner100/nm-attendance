import { defineAgent } from "eve";

import {
  resolveTheGridModel,
  THEGRID_CONTEXT_WINDOW_TOKENS,
} from "./lib/thegrid";

function resolveAgentModel() {
  if (process.env.THEGRID_API_KEY?.trim()) {
    return resolveTheGridModel();
  }

  // Allows `eve build` when the key is only present at runtime (e.g. Vercel env).
  return "openai/gpt-4.1-mini";
}

function usesTheGrid(): boolean {
  return Boolean(process.env.THEGRID_API_KEY?.trim());
}

export default defineAgent({
  model: resolveAgentModel(),
  ...(usesTheGrid()
    ? {
        modelContextWindowTokens: THEGRID_CONTEXT_WINDOW_TOKENS,
        compaction: {
          model: "openai/gpt-4.1-mini",
        },
      }
    : {}),
});
