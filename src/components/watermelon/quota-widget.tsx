import Link from "next/link";

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
    <section
      className={cn(
        "space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold tracking-tight">{title}</p>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <span className="tabular-nums rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
          {pct.toFixed(0)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="tabular-nums font-medium text-foreground">
          {usedLabel} <span className="text-muted-foreground">/ {total}</span>
        </span>
        <span className="text-muted-foreground">{remainingLabel}</span>
      </div>

      {segments && segments.length > 0 ? (
        <div className="space-y-2">
          {segments.map((seg) => {
            const segPct = total <= 0 ? 0 : (seg.value / total) * 100;
            return (
              <div key={seg.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{seg.label}</span>
                  <span className="tabular-nums font-medium text-foreground">{seg.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-500", seg.colorClass)}
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
          className="flex w-full items-center justify-center whitespace-nowrap rounded-full bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-[background-color] hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}
