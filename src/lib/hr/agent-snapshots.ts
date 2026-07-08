import { getOverviewBundle } from "@/lib/hr/overview";
import {
  buildIncompleteDashboardItems,
  INCOMPLETE_PREVIEW_LIMIT,
} from "@/lib/hr/needs-attention";
import { normalizePeriod } from "@/lib/hr/framework-reference";

export async function getNeedsAttentionSnapshot(periodInput?: string) {
  const bundle = await getOverviewBundle(periodInput);
  const items = buildIncompleteDashboardItems({
    performanceAlerts: bundle.summary.performance_alerts,
    opsAlerts: bundle.summary.alerts,
    atRiskEmployees: bundle.at_risk_employees,
  });

  const high = items.filter((item) => item.severity === "high");
  const medium = items.filter((item) => item.severity === "medium");
  const low = items.filter((item) => item.severity === "low");

  return {
    period: bundle.period,
    notificationCount: bundle.notification_count,
    atRiskCount: bundle.at_risk_employees.length,
    highPriority: high.slice(0, INCOMPLETE_PREVIEW_LIMIT),
    mediumPriority: medium.slice(0, INCOMPLETE_PREVIEW_LIMIT),
    lowPriority: low.slice(0, 5),
    overviewHref: "/admin",
  };
}

export async function getOverviewSnapshot(periodInput?: string) {
  const bundle = await getOverviewBundle(periodInput);
  const period = normalizePeriod(periodInput ?? bundle.period);
  const { summary } = bundle;
  const { framework, headcount, performance, payroll_leave } = summary;

  return {
    period,
    headcount: {
      active: headcount.total_active,
      newHiresMonth: headcount.new_hires_month,
      attritionRate: headcount.attrition_rate,
      href: "/admin/headcount",
    },
    performance: {
      averageScore: framework.avg_monthly_score,
      employeesScored: framework.scored_employees,
      activePips: performance.active_pips,
      pendingKpiApprovals: framework.pending_kpi_approvals,
      pendingScoreReviews: framework.pending_score_reviews,
      pendingRewardApprovals: framework.pending_reward_approvals,
      openAccountability: framework.open_accountability,
      overdueTasks: framework.overdue_tasks,
      href: "/admin/scores",
    },
    payrollLeave: {
      pendingLeaveRequests: payroll_leave.leave_pending_approval,
      payrollAnomalies: payroll_leave.anomalies_open,
      href: "/admin/payroll-leave",
    },
    atRiskEmployees: bundle.at_risk_employees,
    recentActivity: bundle.recent_activity,
    notificationCount: bundle.notification_count,
    overviewHref: "/admin",
  };
}
