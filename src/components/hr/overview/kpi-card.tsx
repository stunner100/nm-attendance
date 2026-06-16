import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type OverviewKpiCardProps = {
  label: string;
  value: string;
  delta: number;
  invertTrend?: boolean;
  href?: string;
};

function formatDelta(delta: number): string {
  const absolute = Math.abs(delta);
  if (Number.isInteger(absolute) || absolute >= 10) {
    return absolute.toFixed(0);
  }

  return absolute.toFixed(1);
}

export function OverviewKpiCard({
  label,
  value,
  delta,
  invertTrend = false,
  href,
}: OverviewKpiCardProps) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isGood = invertTrend ? isNegative : isPositive;
  const isBad = invertTrend ? isPositive : isNegative;

  const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  const trendLabel =
    delta === 0
      ? "No change from last month"
      : `${isPositive ? "Up" : "Down"} ${formatDelta(delta)} from last month`;

  const content = (
    <article className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-[box-shadow] hover:shadow-md">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            isGood && "bg-emerald-50 text-emerald-700",
            isBad && "bg-rose-50 text-rose-700",
            !isGood && !isBad && "bg-muted text-muted-foreground"
          )}
          aria-label={trendLabel}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{delta === 0 ? "0" : `${isPositive ? "+" : "-"}${formatDelta(delta)}`}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">vs previous month</p>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
      {content}
    </a>
  );
}
