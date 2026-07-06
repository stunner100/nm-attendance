import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  buildIncompleteDashboardItems,
} from "@/lib/hr/needs-attention";
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
};

function formatDueDate(dueOn: string | null): string {
  if (!dueOn) return "No due date";

  if (/^\d{4}-\d{2}$/.test(dueOn)) {
    const [year, month] = dueOn.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }

  const parsed = new Date(dueOn);
  if (Number.isNaN(parsed.getTime())) return dueOn;
  return parsed.toLocaleDateString();
}

export function NeedsAttentionSection({
  actionItems,
  alerts,
  opsAlerts,
  atRiskEmployees,
}: NeedsAttentionSectionProps) {
  const incompleteItems = buildIncompleteDashboardItems({
    performanceAlerts: alerts,
    opsAlerts,
    atRiskEmployees,
  });
  const activeActions = actionItems.filter((item) => item.count > 0);
  const hasAttention = incompleteItems.length > 0 || activeActions.length > 0;
  const attentionCount = incompleteItems.length;

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
        {incompleteItems.length > 0 ? (
          <Link href="/admin#alerts" className="text-link text-xs font-medium whitespace-nowrap">
            {incompleteItems.length} incomplete
          </Link>
        ) : null}
      </div>

      {!hasAttention ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-5 text-center text-sm text-[var(--color-ink-muted)]">
          Everything looks good for this period. No incomplete items on the dashboard.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {incompleteItems.length > 0 ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]">
              <div className="border-b border-[var(--color-rule)] px-3 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                  Complete on dashboard
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                  Open each item to finish the pending action.
                </p>
              </div>
              <ul className="max-h-96 divide-y divide-[var(--color-rule)] overflow-y-auto">
                {incompleteItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-[var(--color-paper-3)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                          {item.category}
                        </span>
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {item.label}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                        {item.dueOn ? `Due ${formatDueDate(item.dueOn)}` : "Action required"}
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 rounded-[var(--radius-sm)] border-[var(--color-rule)] bg-[var(--color-paper-2)] text-xs whitespace-nowrap"
                    >
                      <Link href={item.href}>{item.actionLabel}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeActions.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                Summary by area
              </p>
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
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
