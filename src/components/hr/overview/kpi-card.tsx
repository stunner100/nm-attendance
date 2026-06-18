import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type OverviewKpiCardProps = {
  label: string;
  value: string;
  delta: number;
  invertTrend?: boolean;
  href?: string;
  variant?: "default" | "signature";
  trendContext?: "this month" | "from last month";
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
  variant = "default",
  trendContext = "this month",
}: OverviewKpiCardProps) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isGood = invertTrend ? isNegative : isPositive;
  const isBad = invertTrend ? isPositive : isNegative;

  const TrendIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;
  const trendLabel =
    delta === 0
      ? "No change from last month"
      : `${isPositive ? "Up" : "Down"} ${formatDelta(delta)} from last month`;

  const isSignature = variant === "signature";

  const content = (
    <article
      className={cn(
        "flex min-h-[104px] flex-col justify-between rounded-[var(--radius-card)] border p-4",
        isSignature
          ? "border-transparent bg-[var(--color-signature-forest)] text-[var(--color-accent-ink)]"
          : "border-[var(--color-rule)] bg-[var(--color-paper)]"
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-2xl font-medium leading-none tabular-nums",
            isSignature ? "text-[var(--color-accent-ink)]" : "text-[var(--color-ink)]"
          )}
        >
          {value}
        </p>
        <p
          className={cn(
            "mt-2 text-xs font-medium leading-tight",
            isSignature ? "text-[var(--color-accent-ink)]/85" : "text-[var(--color-ink-2)]"
          )}
        >
          {label}
        </p>
      </div>
      <div
        className={cn(
          "mt-3 inline-flex items-center gap-1 text-xs font-medium",
          isSignature && "text-[var(--color-accent-ink)]/90",
          !isSignature && isGood && "text-[var(--color-success)]",
          !isSignature && isBad && "text-[var(--color-destructive)]",
          !isSignature && !isGood && !isBad && "text-[var(--color-ink-muted)]"
        )}
        aria-label={trendLabel}
      >
        <TrendIcon className="h-3 w-3" />
        <span>
          {delta === 0 ? "No change" : `${formatDelta(delta)} ${trendContext}`}
        </span>
      </div>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      className="block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
    >
      {content}
    </a>
  );
}
