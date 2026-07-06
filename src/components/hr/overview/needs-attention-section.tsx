import Link from "next/link";

import { Button } from "@/components/ui/button";
import { computeNeedsAttentionCountFromParts } from "@/lib/hr/needs-attention";
import type { AtRiskEmployee, HRDashboardSummary } from "@/lib/types";

type ActionItem = {
  label: string;
  count: number;
  href: string;
};

type NeedsAttentionSectionProps = {
  actionItems: ActionItem[];
  alerts: HRDashboardSummary["performance_alerts"];
  opsAlerts: HRDashboardSummary["alerts"];
  atRiskEmployees: AtRiskEmployee[];
  leavePendingCount?: number;
};

function formatDueDate(dueOn: string | null): string {
  if (!dueOn) return "Ongoing";

  if (/^\d{4}-\d{2}$/.test(dueOn)) {
    const [year, month] = dueOn.split("-").map(Number);
    return `Due ${new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    })}`;
  }

  const parsed = new Date(dueOn);
  if (Number.isNaN(parsed.getTime())) return `Due ${dueOn}`;
  return `Due ${parsed.toLocaleDateString()}`;
}

function alertActionLabel(type: string): string {
  switch (type) {
    case "kpi_approval":
      return "Review";
    case "overdue_task":
      return "View tasks";
    case "low_score_streak":
      return "View employee";
    case "score_pending":
      return "Send reminder";
    case "reward_approval":
      return "Approve";
    case "growth_review":
      return "Review";
    case "pip_followup":
      return "Open";
    case "roadmap_delay":
      return "View roadmap";
    default:
      return "Open";
  }
}

function opsAlertActionLabel(type: string): string {
  switch (type) {
    case "follow_up":
      return "View";
    case "probation_end":
      return "Review";
    case "contract_expiry":
      return "Renew";
    default:
      return "Open";
  }
}

function opsAlertHref(alert: HRDashboardSummary["alerts"][number]): string {
  return alert.href ?? "/admin/compliance";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NeedsAttentionSection({
  actionItems,
  alerts,
  opsAlerts,
  atRiskEmployees,
  leavePendingCount = 0,
}: NeedsAttentionSectionProps) {
  const activeActions = actionItems.filter((item) => item.count > 0);
  const previewAlerts = alerts.slice(0, 3);
  const previewOpsAlerts = opsAlerts.slice(0, 3);
  const previewAtRisk = atRiskEmployees.slice(0, 3);
  const attentionCount = computeNeedsAttentionCountFromParts({
    performanceAlerts: alerts,
    opsAlertCount: opsAlerts.length,
    atRiskCount: atRiskEmployees.length,
    leavePendingCount,
  });
  const hasAttention = attentionCount > 0;
  const hasAnyAlertPanels = alerts.length > 0 || opsAlerts.length > 0;
  const headerAlertsHref =
    alerts.length > 0 ? "/admin/accountability" : "/admin/compliance";

  return (
    <section
      id="alerts"
      aria-labelledby="needs-attention-heading"
      className="scroll-mt-28 rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4 md:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2
            id="needs-attention-heading"
            className="text-base font-medium text-[var(--color-ink)]"
          >
            Needs attention
          </h2>
          {hasAttention ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--color-destructive)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--color-inverse-ink)]">
              {attentionCount}
            </span>
          ) : null}
        </div>
        {hasAnyAlertPanels ? (
          <Link href={headerAlertsHref} className="text-link text-xs font-medium whitespace-nowrap">
            View all alerts
          </Link>
        ) : null}
      </div>

      {!hasAttention ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-5 text-center text-sm text-[var(--color-ink-muted)]">
          Everything looks good for this period. No pending actions, alerts, or at-risk employees.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {activeActions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeActions.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-xs transition-colors hover:bg-[var(--color-paper-2)]"
                >
                  <span className="text-sm font-medium tabular-nums text-[var(--color-ink)]">
                    {item.count}
                  </span>
                  <span className="font-medium text-[var(--color-ink-2)]">{item.label}</span>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {previewAlerts.length > 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                    Key alerts
                  </p>
                  {alerts.length > 3 ? (
                    <Link
                      href="/admin/accountability"
                      className="text-link text-xs font-medium whitespace-nowrap"
                    >
                      View all
                    </Link>
                  ) : null}
                </div>
                <ul className="mt-2 divide-y divide-[var(--color-rule)]">
                  {previewAlerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {alert.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                          {formatDueDate(alert.due_on)}
                        </p>
                      </div>
                      {alert.href ? (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0 rounded-[var(--radius-sm)] border-[var(--color-rule)] bg-[var(--color-paper-2)] text-xs whitespace-nowrap"
                        >
                          <Link href={alert.href}>{alertActionLabel(alert.type)}</Link>
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {previewOpsAlerts.length > 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                    People ops
                  </p>
                  {opsAlerts.length > 3 ? (
                    <Link
                      href="/admin/compliance"
                      className="text-link text-xs font-medium whitespace-nowrap"
                    >
                      View all
                    </Link>
                  ) : null}
                </div>
                <ul className="mt-2 divide-y divide-[var(--color-rule)]">
                  {previewOpsAlerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {alert.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                          {formatDueDate(alert.due_on)}
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0 rounded-[var(--radius-sm)] border-[var(--color-rule)] bg-[var(--color-paper-2)] text-xs whitespace-nowrap"
                      >
                        <Link href={opsAlertHref(alert)}>{opsAlertActionLabel(alert.type)}</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {previewAtRisk.length > 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                    Employees at risk
                  </p>
                  <Link href="/admin/scores" className="text-link text-xs font-medium whitespace-nowrap">
                    View all
                  </Link>
                </div>
                <ul className="mt-2 divide-y divide-[var(--color-rule)]">
                  {previewAtRisk.map((employee) => (
                    <li key={employee.id}>
                      <Link
                        href={employee.href}
                        className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-3)] text-[10px] font-medium text-[var(--color-ink)]">
                          {initials(employee.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                            {employee.full_name}
                          </p>
                          <p className="truncate text-xs text-[var(--color-ink-muted)]">
                            {employee.job_title || employee.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium tabular-nums text-[var(--color-ink)]">
                            {employee.latest_score.toFixed(0)}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-muted)]">
                            {employee.months_below_threshold} consecutive mo below 70
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
