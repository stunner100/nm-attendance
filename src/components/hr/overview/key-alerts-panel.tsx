import Link from "next/link";

import { StatusBadge } from "@/components/hr/status-badge";
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

export function KeyAlertsPanel({ alerts }: KeyAlertsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Key alerts &amp; actions</CardTitle>
        <p className="text-sm text-muted-foreground">Urgent HR and management actions</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground">
            No urgent performance alerts.
          </div>
        ) : (
          alerts.slice(0, 8).map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{alert.label}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={alert.severity} />
                  {alert.due_on ? (
                    <span className="text-xs text-muted-foreground">Due {alert.due_on}</span>
                  ) : null}
                </div>
              </div>
              {alert.href ? (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={alert.href}>{alertActionLabel(alert.type)}</Link>
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
