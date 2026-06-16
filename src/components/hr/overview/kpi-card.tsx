import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type OverviewKpiCardProps = {
  label: string;
  value: string;
  delta: number;
  invertTrend?: boolean;
  href?: string;
  icon?: ReactNode;
  tone?: "emerald" | "blue" | "green" | "amber" | "rose";
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
  icon,
  tone = "emerald",
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
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  }[tone];

  const content = (
    <article className="flex h-[110px] flex-col justify-between rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-[box-shadow] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", toneClass)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl leading-none font-semibold tracking-tight text-[#0f172a] tabular-nums">
            {value}
          </p>
          <p className="mt-2 whitespace-nowrap text-xs font-medium leading-tight text-[#1e293b]">{label}</p>
        </div>
      </div>
      <div
        className={cn(
          "ml-[55px] inline-flex items-center gap-1 text-xs font-medium",
          isGood && "text-[#00a76f]",
          isBad && "text-[#ff3045]",
          !isGood && !isBad && "text-[#64748b]"
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
    <a href={href} className="block h-full rounded-[8px] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
      {content}
    </a>
  );
}
