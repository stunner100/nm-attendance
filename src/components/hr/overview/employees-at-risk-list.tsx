import Link from "next/link";

import { EmptyState } from "@/components/hr/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AtRiskEmployee } from "@/lib/types";
import { UserX } from "lucide-react";

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
    <Card className="h-full min-h-[274px] rounded-[var(--radius-lg)] border-[var(--color-rule)] bg-[var(--color-paper)] shadow-none">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle className="text-base font-medium">Employees at risk</CardTitle>
        <Link href="/admin/scores" className="text-link text-xs font-medium whitespace-nowrap">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <EmptyState
            description="Employees scoring below 70 for the selected period will show here."
            icon={UserX}
            title="No employees below 70"
          />
        ) : (
          employees.slice(0, 5).map((employee) => (
            <Link
              key={employee.id}
              href={employee.href}
              className="grid h-11 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--color-rule)] text-xs last:border-b-0 hover:bg-[var(--color-paper-2)]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-3)] text-[10px] font-medium text-[var(--color-ink)]">
                {initials(employee.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--color-ink)]">
                  {employee.full_name}
                </p>
                <p className="truncate text-[11px] text-[var(--color-ink-muted)]">
                  {employee.job_title || employee.department}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium tabular-nums text-[var(--color-ink)]">
                  {employee.latest_score.toFixed(0)}
                </p>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  {employee.months_below_threshold} mo low
                </p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
