"use client";

import { animate, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const colorMap = {
  emerald: "bg-emerald-100 text-emerald-600",
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  cyan: "bg-cyan-100 text-cyan-600",
  indigo: "bg-indigo-100 text-indigo-600",
  rose: "bg-rose-100 text-rose-600",
} as const;

export type StatColor = keyof typeof colorMap;

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function AnimatedBar({
  value,
  max = 100,
  colorClass = "bg-emerald-500",
  delay = 0,
}: {
  value: number;
  max?: number;
  colorClass?: string;
  delay?: number;
}) {
  const pct = max <= 0 ? 0 : Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className={cn("h-full rounded-full", colorClass)}
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  hint,
  icon,
  color = "emerald",
  delay = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
  color?: StatColor;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} className="h-full">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="h-full"
      >
        <Card className="h-full border-0 shadow-md transition-shadow hover:shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              {icon ? (
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    colorMap[color]
                  )}
                >
                  {icon}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
            </p>
            {hint ? <p className="mt-1.5 text-sm text-slate-500">{hint}</p> : null}
          </CardContent>
        </Card>
      </motion.div>
    </FadeIn>
  );
}
