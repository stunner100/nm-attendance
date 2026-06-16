import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type OverviewActionTileProps = {
  icon: ReactNode;
  label: string;
  count: number;
  href: string;
  iconClassName?: string;
};

export function OverviewActionTile({
  icon,
  label,
  count,
  href,
  iconClassName,
}: OverviewActionTileProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
            iconClassName
          )}
        >
          {icon}
        </div>
        <p className="text-2xl font-semibold tabular-nums">{count}</p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
