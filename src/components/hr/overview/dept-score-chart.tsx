import Link from "next/link";

import { AnimatedBar } from "@/components/hr/dashboard-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HRDepartment } from "@/lib/types";

const DEPT_COLORS: Record<HRDepartment, string> = {
  Operations: "bg-emerald-500",
  Product: "bg-blue-500",
  Marketing: "bg-orange-500",
  Tech: "bg-purple-500",
  "Finance & Compliance": "bg-teal-500",
  "HR & Admin": "bg-rose-500",
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
  const entries = DEPARTMENT_ORDER.map((department) => [department, scores[department]] as const).filter(([, value]) => value > 0);

  return (
    <Card className="h-full min-h-[274px]">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Average Score by Department</CardTitle>
        <Link href="/admin/scores" className="text-xs font-medium text-[#006ce5] hover:text-[#0057b8]">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-[#64748b]">No scored departments for this period.</p>
        ) : (
          entries.map(([department, avg], index) => (
            <div key={department} className="grid grid-cols-[105px_1fr_42px] items-center gap-3 text-xs">
              <span className="truncate font-medium text-[#1e293b]">{department}</span>
              <div className="min-w-0">
                <AnimatedBar
                  value={avg}
                  max={100}
                  colorClass={DEPT_COLORS[department] ?? "bg-primary"}
                  delay={index * 0.05}
                />
              </div>
              <span className="text-right font-medium tabular-nums text-[#0f172a]">{avg.toFixed(1)}</span>
            </div>
          ))
        )}
        {entries.length > 0 ? (
          <div className="grid grid-cols-[105px_1fr_42px] items-center gap-3 pt-1 text-xs text-[#334155]">
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
