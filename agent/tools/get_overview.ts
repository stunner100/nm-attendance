import { defineTool } from "eve/tools";
import { z } from "zod";

import { getOverviewSnapshot } from "@/lib/hr/agent-snapshots";

export default defineTool({
  description:
    "Get the HR overview dashboard snapshot for a period: headcount, performance KPIs, payroll/leave counts, at-risk employees, and recent activity.",
  inputSchema: z.object({
    period: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("YYYY-MM period. Defaults to the current month."),
  }),
  async execute({ period }) {
    return getOverviewSnapshot(period);
  },
});
