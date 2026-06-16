import Link from "next/link";
import type { ReactNode } from "react";
import {
  CircleAlert,
  Clock3,
  ClipboardList,
  Gift,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HRDashboardSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function alertMeta(type: string): {
  icon: ReactNode;
  iconClassName: string;
  buttonClassName: string;
} {
  switch (type) {
    case "kpi_approval":
      return {
        icon: <ClipboardList className="h-5 w-5" />,
        iconClassName: "bg-rose-50 text-rose-500",
        buttonClassName: "border-rose-300 text-rose-600 hover:bg-rose-50",
      };
    case "overdue_task":
      return {
        icon: <Clock3 className="h-5 w-5" />,
        iconClassName: "bg-amber-50 text-amber-500",
        buttonClassName: "border-amber-300 text-amber-600 hover:bg-amber-50",
      };
    case "score_pending":
      return {
        icon: <Users className="h-5 w-5" />,
        iconClassName: "bg-blue-50 text-blue-600",
        buttonClassName: "border-blue-300 text-blue-600 hover:bg-blue-50",
      };
    case "reward_approval":
      return {
        icon: <Gift className="h-5 w-5" />,
        iconClassName: "bg-violet-50 text-violet-600",
        buttonClassName: "border-violet-300 text-violet-600 hover:bg-violet-50",
      };
    case "low_score_streak":
      return {
        icon: <CircleAlert className="h-5 w-5" />,
        iconClassName: "bg-rose-50 text-rose-500",
        buttonClassName: "border-rose-300 text-rose-600 hover:bg-rose-50",
      };
    default:
      return {
        icon: <ShieldAlert className="h-5 w-5" />,
        iconClassName: "bg-rose-50 text-rose-500",
        buttonClassName: "border-rose-300 text-rose-600 hover:bg-rose-50",
      };
  }
}

export function KeyAlertsPanel({ alerts }: KeyAlertsPanelProps) {
  return (
    <Card className="h-full min-h-[338px]">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Key Alerts &amp; Actions</CardTitle>
        <Link href="/admin/tasks" className="text-xs font-medium text-[#006ce5] hover:text-[#0057b8]">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
            No urgent performance alerts.
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => {
            const meta = alertMeta(alert.type);

            return (
              <div
                key={alert.id}
                className="grid min-h-[55px] grid-cols-[40px_1fr_116px_112px] items-center gap-3 border-b border-[#eef2f7] py-2 last:border-b-0"
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-[8px]", meta.iconClassName)}>
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#0f172a]">{alert.label}</p>
                  <p className="mt-0.5 truncate text-xs text-[#64748b]">
                    {alertSubtitle(alert.type)}
                  </p>
                </div>
                <p className="text-right text-xs font-medium text-[#ff3045]">
                  {alert.due_on ? `Due ${alert.due_on}` : "Ongoing"}
                </p>
                {alert.href ? (
                  <Button asChild size="sm" variant="outline" className={cn("h-8 rounded-[5px] bg-white text-xs", meta.buttonClassName)}>
                    <Link href={alert.href}>{alertActionLabel(alert.type)}</Link>
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
