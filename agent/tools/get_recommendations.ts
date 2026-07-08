import { defineTool } from "eve/tools";
import { z } from "zod";

import { getPerformanceRecommendations } from "@/lib/hr/recommendations";
import { normalizePeriod } from "@/lib/hr/framework-reference";

export default defineTool({
  description:
    "Get rule-based performance recommendations for a period: rewards, accountability, growth, and training suggestions by employee score band.",
  inputSchema: z.object({
    period: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("YYYY-MM period. Defaults to the current month."),
    department: z
      .string()
      .optional()
      .describe("Optional department filter, for example Engineering."),
    severity: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe("Optional severity filter."),
  }),
  async execute({ period, department, severity }) {
    const normalizedPeriod = normalizePeriod(period);
    const recommendations = await getPerformanceRecommendations(normalizedPeriod);

    const filtered = recommendations.filter((item) => {
      if (department && item.department !== department) {
        return false;
      }
      if (severity && item.severity !== severity) {
        return false;
      }
      return true;
    });

    return {
      period: normalizedPeriod,
      count: filtered.length,
      recommendations: filtered.slice(0, 25).map((item) => ({
        ...item,
        href: `/admin/headcount/${item.employeeId}`,
      })),
      href: "/admin/scores",
    };
  },
});
