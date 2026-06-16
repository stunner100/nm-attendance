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
        "flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className={cn("flex h-8 w-8 items-center justify-center", iconColor)}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
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
        "flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5",
        className
      )}
    >
      <span className="text-sm font-bold text-slate-800">{score}</span>
      <span className="text-xs text-slate-500">{name}</span>
    </div>
  );
}
