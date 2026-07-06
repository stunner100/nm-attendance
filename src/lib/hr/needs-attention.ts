import type { HRDashboardSummary } from "@/lib/types";

const PERFORMANCE_ALERT_CAP = 20;

export type NeedsAttentionCountInput = {
  performanceAlerts: HRDashboardSummary["performance_alerts"];
  opsAlertCount: number;
  atRiskCount: number;
  /** Raw pending leave count; badge adds 1 bucket when > 0. */
  leavePendingCount?: number;
};

/** Deduplicated badge count: high/medium performance alerts + ops alerts + at-risk + leave bucket. */
export function computeNeedsAttentionCountFromParts({
  performanceAlerts,
  opsAlertCount,
  atRiskCount,
  leavePendingCount = 0,
}: NeedsAttentionCountInput): number {
  const performanceCount = Math.min(
    performanceAlerts.filter(
      (alert) => alert.severity === "high" || alert.severity === "medium"
    ).length,
    PERFORMANCE_ALERT_CAP
  );

  const leavePending = leavePendingCount > 0 ? 1 : 0;

  return performanceCount + atRiskCount + opsAlertCount + leavePending;
}

export function computeNeedsAttentionCount(
  summary: HRDashboardSummary,
  atRiskCount: number
): number {
  return computeNeedsAttentionCountFromParts({
    performanceAlerts: summary.performance_alerts,
    opsAlertCount: summary.alerts.length,
    atRiskCount,
    leavePendingCount: summary.payroll_leave.leave_pending_approval,
  });
}
