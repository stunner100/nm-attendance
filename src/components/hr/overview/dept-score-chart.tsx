import Link from "next/link";

import { AnimatedBar } from "@/components/hr/dashboard-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HRDepartment } from "@/lib/types";

const DEPT_BAR_COLORS: Record<HRDepartment, string> = {
  Operations: "var(--color-signature-forest)",
  Product: "var(--color-signature-coral)",
  Marketing: "var(--color-signature-mustard)",
  Tech: "var(--color-info)",
  "Finance & Compliance": "var(--color-signature-mint)",
  "HR & Admin": "var(--color-signature-peach)",
};

const DEPARTMENT_ORDER: HRDepartment[] = [
  "Operations",
  "Product",
  "Tech",
  "Marketing",
  "Finance & Compliance",
  "HR & Admin",
];

type DeptScoreChartProps = {
  scores: Record<HRDepartment, number>;
};

export function DeptScoreChart({ scores }: DeptScoreChartProps) {
  const entries = DEPARTMENT_ORDER.map(
    (department) => [department, scores[department]] as const
  ).filter(([, value]) => value > 0);

  return (
    <Card className="h-full min-h-[274px] rounded-[var(--radius-lg)] border-[var(--color-rule)] bg-[var(--color-paper-2)] shadow-none">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle className="text-base font-medium">Average score by department</CardTitle>
        <Link href="/admin/scores" className="text-link text-xs font-medium whitespace-nowrap">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)]">No scored departments for this period.</p>
        ) : (
          entries.map(([department, avg], index) => (
            <div
              key={department}
              className="grid min-w-0 grid-cols-[minmax(0,105px)_minmax(0,1fr)_42px] items-center gap-3 text-xs"
            >
              <span className="truncate font-medium text-[var(--color-ink-2)]">{department}</span>
              <div className="min-w-0">
                <AnimatedBar
                  value={avg}
                  max={100}
                  colorClass=""
                  barStyle={{ backgroundColor: DEPT_BAR_COLORS[department] }}
                  delay={index * 0.05}
                />
              </div>
              <span className="text-right font-medium tabular-nums text-[var(--color-ink)]">
                {avg.toFixed(1)}
              </span>
            </div>
          ))
        )}
        {entries.length > 0 ? (
          <div className="grid grid-cols-[105px_1fr_42px] items-center gap-3 pt-1 text-xs text-[var(--color-ink-muted)]">
            <span />
            <div className="flex justify-between tabular-nums">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
            <span />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
