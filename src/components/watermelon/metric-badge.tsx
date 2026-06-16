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
        "flex items-center gap-3 rounded-[22px] border border-neutral-200/70 bg-white px-4 py-3 shadow-[inset_0_1px_3px_rgba(15,23,42,0.035),0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_3px_rgba(15,23,42,0.035),0_16px_32px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-100", iconColor)}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-neutral-950">{value}</p>
        <p className="text-xs font-medium text-neutral-500">{label}</p>
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
        "flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5",
        className
      )}
    >
      <span className="text-sm font-bold text-neutral-800">{score}</span>
      <span className="text-xs font-medium text-neutral-500">{name}</span>
    </div>
  );
}
