import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function AnimatedBar({
  value,
  max = 100,
  colorClass = "bg-emerald-500",
}: {
  value: number;
  max?: number;
  colorClass?: string;
  delay?: number;
}) {
  const pct = max <= 0 ? 0 : Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export type StatColor = string;
