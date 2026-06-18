import { type CSSProperties, type ReactNode } from "react";
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
  colorClass = "bg-primary",
  barStyle,
}: {
  value: number;
  max?: number;
  colorClass?: string;
  barStyle?: CSSProperties;
  delay?: number;
}) {
  const pct = max <= 0 ? 0 : Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-paper-3)]">
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", colorClass)}
        style={{ width: `${pct}%`, ...barStyle }}
      />
    </div>
  );
}

export type StatColor = string;
