import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HRDashboardSummary } from "@/lib/types";

type KeyAlertsPanelProps = {
  alerts: HRDashboardSummary["performance_alerts"];
};

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

function alertSubtitle(type: string): string {
  switch (type) {
    case "kpi_approval":
      return "Submitted by departments";
    case "overdue_task":
      return "Across employees";
    case "low_score_streak":
      return "Immediate attention required";
    case "score_pending":
      return "Managers yet to submit scores";
    case "reward_approval":
      return "Recommended by managers";
    case "growth_review":
      return "Growth plan review due";
    case "pip_followup":
      return "Follow-up required";
    case "roadmap_delay":
      return "Department roadmap needs review";
    default:
      return "Action required";
  }
}

export function KeyAlertsPanel({ alerts }: KeyAlertsPanelProps) {
  return (
    <Card className="h-full min-h-[338px] rounded-[var(--radius-lg)] border-[var(--color-rule)] bg-[var(--color-paper)] shadow-none">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle className="text-base font-medium">Key alerts &amp; actions</CardTitle>
        <Link href="/admin/accountability" className="text-link text-xs font-medium whitespace-nowrap">
          View accountability
        </Link>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-[var(--color-paper-2)] p-6 text-center text-sm text-[var(--color-ink-muted)]">
            No urgent performance alerts.
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className="grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[var(--color-rule)] py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-ink)]">{alert.label}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                  {alertSubtitle(alert.type)}
                </p>
              </div>
              <p className="text-right text-xs font-medium whitespace-nowrap text-[var(--color-destructive)]">
                {alert.due_on ? `Due ${alert.due_on}` : "Ongoing"}
              </p>
              {alert.href ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-[var(--radius-sm)] border-[var(--color-rule)] bg-[var(--color-paper)] text-xs whitespace-nowrap"
                >
                  <Link href={alert.href}>{alertActionLabel(alert.type)}</Link>
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
