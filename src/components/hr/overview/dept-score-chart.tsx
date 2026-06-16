import { AnimatedBar } from "@/components/hr/dashboard-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HRDepartment } from "@/lib/types";

const DEPT_COLORS: Record<HRDepartment, string> = {
  Operations: "bg-emerald-500",
  Product: "bg-violet-500",
  Marketing: "bg-orange-500",
  Tech: "bg-sky-500",
  "Finance & Compliance": "bg-teal-500",
  "HR & Admin": "bg-rose-500",
};

type DeptScoreChartProps = {
  scores: Record<HRDepartment, number>;
};

export function DeptScoreChart({ scores }: DeptScoreChartProps) {
  const entries = Object.entries(scores).filter(([, value]) => value > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Average score by department</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scored departments for this period.</p>
        ) : (
          entries.map(([department, avg], index) => (
            <div key={department} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{department}</span>
                <span className="tabular-nums text-muted-foreground">{avg.toFixed(1)}</span>
              </div>
              <AnimatedBar
                value={avg}
                max={100}
                colorClass={DEPT_COLORS[department as HRDepartment] ?? "bg-primary"}
                delay={index * 0.05}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
