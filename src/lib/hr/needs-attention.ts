import type { AtRiskEmployee, HRDashboardSummary } from "@/lib/types";

const PERFORMANCE_ALERT_CAP = 30;
const INCOMPLETE_PREVIEW_LIMIT = 10;

export type IncompleteDashboardItem = {
  id: string;
  category: string;
  label: string;
  dueOn: string | null;
  href: string;
  actionLabel: string;
  severity: "low" | "medium" | "high";
};

export type NeedsAttentionCountInput = {
  performanceAlerts: HRDashboardSummary["performance_alerts"];
  opsAlertCount: number;
  atRiskCount: number;
};

function performanceActionLabel(type: string): string {
  switch (type) {
    case "kpi_approval":
      return "Approve KPI";
    case "overdue_task":
      return "Complete task";
    case "low_score_streak":
      return "Review score";
    case "score_pending":
      return "Approve score";
    case "reward_approval":
      return "Approve reward";
    case "growth_review":
      return "Complete review";
    case "pip_followup":
      return "Follow up";
    case "roadmap_delay":
      return "Update roadmap";
    case "accountability_open":
      return "Resolve";
    case "leave_pending":
      return "Approve leave";
    case "payroll_anomaly":
      return "Resolve";
    default:
      return "Complete";
  }
}

function opsActionLabel(type: string): string {
  switch (type) {
    case "follow_up":
      return "Complete follow-up";
    case "probation_end":
      return "Review probation";
    case "contract_expiry":
      return "Renew contract";
    default:
      return "Complete";
  }
}

function performanceCategory(type: string): string {
  switch (type) {
    case "kpi_approval":
      return "KPI";
    case "overdue_task":
      return "Task";
    case "low_score_streak":
    case "score_pending":
      return "Score";
    case "reward_approval":
      return "Reward";
    case "growth_review":
      return "Growth";
    case "pip_followup":
      return "PIP";
    case "roadmap_delay":
      return "Roadmap";
    case "accountability_open":
      return "Accountability";
    case "leave_pending":
      return "Leave";
    case "payroll_anomaly":
      return "Payroll";
    default:
      return "Performance";
  }
}

function opsCategory(type: string): string {
  switch (type) {
    case "follow_up":
      return "Compliance";
    case "probation_end":
      return "Probation";
    case "contract_expiry":
      return "Contract";
    default:
      return "People ops";
  }
}

export function buildIncompleteDashboardItems(input: {
  performanceAlerts: HRDashboardSummary["performance_alerts"];
  opsAlerts: HRDashboardSummary["alerts"];
  atRiskEmployees: AtRiskEmployee[];
}): IncompleteDashboardItem[] {
  const items: IncompleteDashboardItem[] = [];
  const seen = new Set<string>();

  for (const alert of input.performanceAlerts) {
    if (!alert.href || seen.has(alert.id)) continue;
    seen.add(alert.id);
    items.push({
      id: alert.id,
      category: performanceCategory(alert.type),
      label: alert.label,
      dueOn: alert.due_on,
      href: alert.href,
      actionLabel: performanceActionLabel(alert.type),
      severity: alert.severity,
    });
  }

  for (const alert of input.opsAlerts) {
    if (seen.has(alert.id)) continue;
    seen.add(alert.id);
    items.push({
      id: alert.id,
      category: opsCategory(alert.type),
      label: alert.label,
      dueOn: alert.due_on,
      href: alert.href ?? "/admin/compliance",
      actionLabel: opsActionLabel(alert.type),
      severity: alert.severity,
    });
  }

  for (const employee of input.atRiskEmployees) {
    const id = `at-risk-${employee.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      category: "Score",
      label: `${employee.full_name} below 70 (${employee.months_below_threshold} mo streak)`,
      dueOn: null,
      href: employee.href,
      actionLabel: "Review employee",
      severity: "high",
    });
  }

  const severityRank = { high: 0, medium: 1, low: 2 } as const;

  return items.sort((left, right) => {
    const severityDelta = severityRank[left.severity] - severityRank[right.severity];
    if (severityDelta !== 0) return severityDelta;
    if (left.dueOn && right.dueOn) return left.dueOn.localeCompare(right.dueOn);
    if (left.dueOn) return -1;
    if (right.dueOn) return 1;
    return left.label.localeCompare(right.label);
  });
}

/** Deduplicated badge count aligned with incomplete dashboard items. */
export function computeNeedsAttentionCountFromParts({
  performanceAlerts,
  opsAlertCount,
  atRiskCount,
}: NeedsAttentionCountInput): number {
  const performanceCount = Math.min(
    performanceAlerts.filter(
      (alert) => alert.severity === "high" || alert.severity === "medium"
    ).length,
    PERFORMANCE_ALERT_CAP
  );

  return performanceCount + atRiskCount + opsAlertCount;
}

export function computeNeedsAttentionCount(
  summary: HRDashboardSummary,
  atRiskCount: number
): number {
  return computeNeedsAttentionCountFromParts({
    performanceAlerts: summary.performance_alerts,
    opsAlertCount: summary.alerts.length,
    atRiskCount,
  });
}

export { INCOMPLETE_PREVIEW_LIMIT, PERFORMANCE_ALERT_CAP };
