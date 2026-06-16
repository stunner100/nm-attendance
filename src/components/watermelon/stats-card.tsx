import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatTheme = {
  iconClass: string;
};

export const STAT_THEMES: Record<string, StatTheme> = {
  amber: { iconClass: "text-amber-600" },
  cyan: { iconClass: "text-sky-600" },
  emerald: { iconClass: "text-primary" },
  purple: { iconClass: "text-violet-600" },
  rose: { iconClass: "text-rose-600" },
  indigo: { iconClass: "text-indigo-600" },
};

export type WatermelonStatCardProps = {
  icon: ReactNode;
  label: string;
  metric: string;
  subLabel: string;
  description: string;
  theme?: StatTheme;
  className?: string;
};

export function WatermelonStatCard({
  icon,
  label,
  metric,
  subLabel,
  description,
  theme = STAT_THEMES.emerald,
  className,
}: WatermelonStatCardProps) {
  return (
    <article
      className={cn(
        "flex min-h-36 flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-muted", theme.iconClass)}>
          {icon}
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {subLabel}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="tabular-nums text-3xl font-semibold tracking-tight text-foreground">{metric}</p>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </article>
  );
}
