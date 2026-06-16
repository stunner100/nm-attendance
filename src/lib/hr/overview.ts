import { getHRDashboardSummary } from "@/lib/hr/dashboard";
import { getAtRiskEmployees } from "@/lib/hr/at-risk-employees";
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

  const notification_count = summary.performance_alerts.filter(
    (alert) => alert.severity === "high" || alert.severity === "medium"
  ).length;

  return {
    period,
    summary,
    at_risk_employees,
    recent_activity,
    notification_count,
  };
}
