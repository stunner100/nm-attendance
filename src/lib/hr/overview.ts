import { getHRDashboardSummary } from "@/lib/hr/dashboard";
import { getAtRiskEmployees } from "@/lib/hr/at-risk-employees";
import { computeNeedsAttentionCount } from "@/lib/hr/needs-attention";
import { getRecentActivity } from "@/lib/hr/recent-activity";
import { normalizePeriod } from "@/lib/hr/framework-reference";
import type { OverviewBundle } from "@/lib/types";

export async function getOverviewBundle(periodInput?: string): Promise<OverviewBundle> {
  const period = normalizePeriod(periodInput);
  const [summary, at_risk_employees, recent_activity] = await Promise.all([
    getHRDashboardSummary(period),
    getAtRiskEmployees(period),
    getRecentActivity({ limit: 10 }),
  ]);

  const notification_count = computeNeedsAttentionCount(
    summary,
    at_risk_employees.length
  );

  return {
    period,
    summary,
    at_risk_employees,
    recent_activity,
    notification_count,
  };
}
