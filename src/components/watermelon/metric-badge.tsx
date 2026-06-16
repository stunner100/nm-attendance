import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricBadgeProps = {
  icon: ReactNode;
  iconColor: string;
  value: string;
  label: string;
  className?: string;
};

export function MetricBadge({
  icon,
  iconColor,
  value,
  label,
  className,
}: MetricBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3",
        className
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-muted", iconColor)}>
        {icon}
      </div>
      <div>
        <p className="tabular-nums text-lg font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

type EndorsementBadgeProps = {
  score: string;
  name: string;
  className?: string;
};

export function EndorsementBadge({
  score,
  name,
  className,
}: EndorsementBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5",
        className
      )}
    >
      <span className="tabular-nums text-sm font-semibold text-foreground">{score}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}
