import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AtRiskEmployee } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type EmployeesAtRiskListProps = {
  employees: AtRiskEmployee[];
};

export function EmployeesAtRiskList({ employees }: EmployeesAtRiskListProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Employees at risk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees below 70 for this period.</p>
        ) : (
          employees.map((employee) => (
            <Link
              key={employee.id}
              href={employee.href}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-[background-color] hover:bg-muted"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {initials(employee.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{employee.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {employee.job_title || employee.department}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-rose-700">
                  {employee.latest_score.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {employee.months_below_threshold} month
                  {employee.months_below_threshold === 1 ? "" : "s"} low
                </p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
