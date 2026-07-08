import { defineAgent } from "eve";

import { resolveTheGridModel } from "./lib/thegrid";

function resolveAgentModel() {
  if (process.env.THEGRID_API_KEY?.trim()) {
    return resolveTheGridModel();
  }

  // Allows `eve build` when the key is only present at runtime (e.g. Vercel env).
  return "openai/gpt-4.1-mini";
}

export default defineAgent({
  model: resolveAgentModel(),
});
