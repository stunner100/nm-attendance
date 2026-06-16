import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProgressSegment = {
  label: string;
  value: number;
  colorClass: string;
};

type QuotaWidgetProps = {
  title: string;
  subtitle?: string;
  used: number;
  total: number;
  usedLabel: string;
  remainingLabel: string;
  segments?: ProgressSegment[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function QuotaWidget({
  title,
  subtitle,
  used,
  total,
  usedLabel,
  remainingLabel,
  segments,
  ctaLabel,
  ctaHref,
  className,
}: QuotaWidgetProps) {
  const pct = total <= 0 ? 0 : Math.min((used / total) * 100, 100);

  return (
    <Card
      className={cn(
        "group overflow-hidden border-0 shadow-md transition-all duration-300 hover:shadow-lg",
        className
      )}
    >
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {title}
            </p>
            {subtitle ? (
              <p className="text-xs text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {pct.toFixed(0)}%
          </span>
        </div>

        {/* Segmented progress bar */}
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">
            {usedLabel}{" "}
            <span className="text-slate-400">/ {total}</span>
          </span>
          <span className="text-slate-500">{remainingLabel}</span>
        </div>

        {segments && segments.length > 0 ? (
          <div className="space-y-2">
            {segments.map((seg) => {
              const segPct = total <= 0 ? 0 : (seg.value / total) * 100;
              return (
                <div key={seg.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{seg.label}</span>
                    <span className="font-medium text-slate-800">
                      {seg.value}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        seg.colorClass
                      )}
                      style={{ width: `${Math.min(segPct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {ctaLabel && ctaHref ? (
          <Link
            href={ctaHref}
            className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
