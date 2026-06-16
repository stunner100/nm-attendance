import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/lib/types";

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
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          items.map((item) => {
            const body = (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {relativeTime(item.occurred_at)}
                    {item.actor ? ` · by ${item.actor}` : ""}
                  </p>
                </div>
              </div>
            );

            if (!item.href) {
              return (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  {body}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-lg border border-border p-3 transition-[background-color] hover:bg-muted"
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
