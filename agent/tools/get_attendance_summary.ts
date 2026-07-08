import { defineTool } from "eve/tools";
import { z } from "zod";

import { getAttendanceSummary } from "@/lib/hr/attendance-summary";

export default defineTool({
  description:
    "Summarize attendance check-ins for the last N days: totals, on-time vs late, open checkouts, and department breakdown.",
  inputSchema: z.object({
    days: z
      .number()
      .int()
      .min(1)
      .max(90)
      .optional()
      .describe("Lookback window in days. Defaults to 30."),
  }),
  async execute({ days }) {
    return getAttendanceSummary(days ?? 30);
  },
});
