import { defineTool } from "eve/tools";
import { z } from "zod";

import { getNeedsAttentionSnapshot } from "@/lib/hr/agent-snapshots";

export default defineTool({
  description:
    "List incomplete HR items that need admin attention, grouped by severity with deep links to resolve them.",
  inputSchema: z.object({
    period: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("YYYY-MM period. Defaults to the current month."),
  }),
  async execute({ period }) {
    return getNeedsAttentionSnapshot(period);
  },
});
