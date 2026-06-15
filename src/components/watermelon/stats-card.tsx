"use client";

import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTheme = {
  gradientFrom: string;
  gradientTo: string;
  pillBg: string;
  pillText: string;
  glowColor: string;
  accentGradient: string;
};

export const STAT_THEMES: Record<string, StatTheme> = {
  amber: {
    gradientFrom: "from-amber-400",
    gradientTo: "to-orange-500",
    pillBg: "bg-amber-500/10",
    pillText: "text-amber-600",
    glowColor: "rgba(245,158,11,0.15)",
    accentGradient: "from-amber-400 via-orange-400 to-rose-400",
  },
  cyan: {
    gradientFrom: "from-cyan-400",
    gradientTo: "to-blue-500",
    pillBg: "bg-cyan-500/10",
    pillText: "text-cyan-600",
    glowColor: "rgba(6,182,212,0.15)",
    accentGradient: "from-cyan-400 via-blue-400 to-indigo-400",
  },
  emerald: {
    gradientFrom: "from-emerald-400",
    gradientTo: "to-teal-500",
    pillBg: "bg-emerald-500/10",
    pillText: "text-emerald-600",
    glowColor: "rgba(16,185,129,0.15)",
    accentGradient: "from-emerald-400 via-teal-400 to-cyan-400",
  },
  purple: {
    gradientFrom: "from-purple-400",
    gradientTo: "to-violet-500",
    pillBg: "bg-purple-500/10",
    pillText: "text-purple-600",
    glowColor: "rgba(168,85,247,0.15)",
    accentGradient: "from-purple-400 via-violet-400 to-fuchsia-400",
  },
  rose: {
    gradientFrom: "from-rose-400",
    gradientTo: "to-pink-500",
    pillBg: "bg-rose-500/10",
    pillText: "text-rose-600",
    glowColor: "rgba(244,63,94,0.15)",
    accentGradient: "from-rose-400 via-pink-400 to-red-400",
  },
  indigo: {
    gradientFrom: "from-indigo-400",
    gradientTo: "to-blue-500",
    pillBg: "bg-indigo-500/10",
    pillText: "text-indigo-600",
    glowColor: "rgba(99,102,241,0.15)",
    accentGradient: "from-indigo-400 via-blue-400 to-cyan-400",
  },
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
    <>
      <Card
        className={cn(
          "stat-card group relative overflow-hidden border-0 shadow-md transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-xl",
          className
        )}
      >
        {/* Accent bar */}
        <div
          className={cn(
            "accent-bar absolute left-0 top-0 h-1 w-1 bg-gradient-to-b",
            theme.accentGradient
          )}
        />

        {/* Glow overlay */}
        <div
          className="card-glow pointer-events-none absolute inset-0 opacity-0"
          style={{ background: `radial-gradient(ellipse at 30% 20%, ${theme.glowColor}, transparent 70%)` }}
        />

        <CardContent className="relative z-10 space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "stat-icon flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                theme.gradientFrom,
                theme.gradientTo
              )}
            >
              {icon}
            </div>
            <span className="text-sm font-medium text-slate-500">{label}</span>
          </div>

          <div>
            <p className="metric-value text-3xl font-bold tracking-tight text-slate-900">
              {metric}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "pill-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                theme.pillBg,
                theme.pillText
              )}
            >
              {subLabel}
            </span>
          </div>

          <p className="desc-text text-xs leading-relaxed text-slate-400">
            {description}
          </p>
        </CardContent>
      </Card>

      <style>{`
        .stat-card:hover .accent-bar {
          height: 100% !important;
          top: 0 !important;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .stat-card .accent-bar {
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .stat-card:hover .card-glow {
          opacity: 1;
        }
        .stat-card:hover .metric-value {
          animation: float 3s ease-in-out infinite;
        }
        .stat-card:hover .pill-badge {
          transform: scale(1.03);
          box-shadow: 0 0 0 1px currentColor;
        }
        .stat-card:hover .stat-icon {
          transform: rotate(-8deg) scale(1.15);
        }
        .stat-card:hover .desc-text {
          color: var(--foreground);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
