import Link from "next/link";
import type { ReactNode } from "react";
import { Check, FileText, Gift, ShieldAlert, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type RecentActivityFeedProps = {
  items: ActivityItem[];
};

function relativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function activityMeta(label: string): { icon: ReactNode; className: string } {
  const normalized = label.toLowerCase();

  if (normalized.includes("score") || normalized.includes("approved")) {
    return {
      icon: <Check className="h-4 w-4" />,
      className: "bg-emerald-100 text-emerald-600",
    };
  }
  if (normalized.includes("kpi")) {
    return {
      icon: <FileText className="h-4 w-4" />,
      className: "bg-blue-100 text-blue-600",
    };
  }
  if (normalized.includes("task") || normalized.includes("overdue")) {
    return {
      icon: <TriangleAlert className="h-4 w-4" />,
      className: "bg-amber-100 text-amber-600",
    };
  }
  if (normalized.includes("reward")) {
    return {
      icon: <Gift className="h-4 w-4" />,
      className: "bg-violet-100 text-violet-600",
    };
  }

  return {
    icon: <ShieldAlert className="h-4 w-4" />,
    className: "bg-rose-100 text-rose-600",
  };
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  const visibleItems = items.slice(0, 5);

  return (
    <Card className="h-full min-h-[338px]">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Recent Activity</CardTitle>
        <Link href="/admin/reports" className="text-xs font-medium text-[#006ce5] hover:text-[#0057b8]">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {visibleItems.length === 0 ? (
          <p className="text-sm text-[#64748b]">No recent activity yet.</p>
        ) : (
          visibleItems.map((item, index) => {
            const meta = activityMeta(item.label);
            const body = (
              <div className="grid min-h-[55px] grid-cols-[40px_1fr_88px] items-center gap-3 border-b border-[#eef2f7] py-2 last:border-b-0">
                <div className="relative flex justify-center">
                  {index < visibleItems.length - 1 ? (
                    <span className="absolute top-9 h-8 w-px bg-[#e5e7eb]" aria-hidden="true" />
                  ) : null}
                  <div className={cn("relative z-10 flex h-9 w-9 items-center justify-center rounded-full", meta.className)}>
                    {meta.icon}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#0f172a]">{item.label}</p>
                  <p className="mt-0.5 truncate text-xs text-[#64748b]">
                    {item.actor ? `by ${item.actor}` : "by System"}
                  </p>
                </div>
                <p className="text-right text-xs text-[#64748b]">{relativeTime(item.occurred_at)}</p>
              </div>
            );

            if (!item.href) {
              return <div key={item.id}>{body}</div>;
            }

            return (
              <Link key={item.id} href={item.href} className="block transition-[background-color] hover:bg-[#f8fafc]">
                {body}
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
