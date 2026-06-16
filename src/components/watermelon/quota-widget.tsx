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
        "group transition-transform duration-300 hover:-translate-y-0.5",
        className
      )}
    >
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-tight text-neutral-950">
              {title}
            </p>
            {subtitle ? (
              <p className="text-xs font-medium text-neutral-500">{subtitle}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-bold tracking-tight text-white">
            {pct.toFixed(0)}%
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-neutral-100 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-neutral-950 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-700">
            {usedLabel}{" "}
            <span className="text-neutral-400">/ {total}</span>
          </span>
          <span className="font-medium text-neutral-500">{remainingLabel}</span>
        </div>

        {segments && segments.length > 0 ? (
          <div className="space-y-2">
            {segments.map((seg) => {
              const segPct = total <= 0 ? 0 : (seg.value / total) * 100;
              return (
                <div key={seg.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-neutral-500">{seg.label}</span>
                    <span className="font-semibold text-neutral-900">
                      {seg.value}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
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
            className="flex w-full items-center justify-center rounded-full bg-neutral-950 px-3 py-2.5 text-xs font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:bg-neutral-800"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
