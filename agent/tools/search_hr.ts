import { defineTool } from "eve/tools";
import { z } from "zod";

import { searchHRRecords } from "@/lib/hr/search";

export default defineTool({
  description:
    "Search employees, KPI cards, and tasks by keyword. Returns admin deep links.",
  inputSchema: z.object({
    query: z.string().min(2).describe("Search text, at least 2 characters."),
    limit: z.number().int().min(1).max(20).optional(),
  }),
  async execute({ query, limit }) {
    const results = await searchHRRecords(query, limit ?? 8);
    return {
      query,
      count: results.length,
      results,
    };
  },
});
