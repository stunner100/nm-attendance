import Link from "next/link";

import { EmptyState } from "@/components/hr/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/lib/types";
import { Activity } from "lucide-react";

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

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  const visibleItems = items.slice(0, 5);

  return (
    <Card className="h-full min-h-[338px] rounded-[var(--radius-lg)] border-[var(--color-rule)] bg-[var(--color-paper-2)] shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-medium">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {visibleItems.length === 0 ? (
          <EmptyState
            description="Activity from scores, tasks, and HR updates will appear here."
            icon={Activity}
            title="No recent activity yet"
          />
        ) : (
          visibleItems.map((item) => {
            const body = (
              <div className="grid min-h-[52px] grid-cols-[minmax(0,1fr)_88px] items-center gap-3 border-b border-[var(--color-rule)] py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">{item.label}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                    {item.actor ? `by ${item.actor}` : "by System"}
                  </p>
                </div>
                <p className="text-right text-xs text-[var(--color-ink-muted)]">
                  {relativeTime(item.occurred_at)}
                </p>
              </div>
            );

            if (!item.href) {
              return <div key={item.id}>{body}</div>;
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className="block hover:bg-[var(--color-paper)]"
              >
                {body}
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
