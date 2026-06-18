import Link from "next/link";

import { StatusBadge } from "@/components/hr/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HRDepartment, HRRoadmapHealth } from "@/lib/types";

type RoadmapHealthListProps = {
  healthByDepartment: Record<HRDepartment, HRRoadmapHealth | null>;
};

export function RoadmapHealthList({ healthByDepartment }: RoadmapHealthListProps) {
  const entries = Object.entries(healthByDepartment);

  return (
    <Card className="h-full min-h-[274px] rounded-[var(--radius-lg)] border-[var(--color-rule)] bg-[var(--color-paper-2)] shadow-none">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle className="text-base font-medium">Roadmap health by department</CardTitle>
        <Link
          href="/admin/department-roadmap"
          className="text-link text-xs font-medium whitespace-nowrap"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {entries.map(([department, health]) => (
          <div
            key={department}
            className="flex h-9 items-center justify-between gap-3 border-b border-[var(--color-rule)] text-xs last:border-b-0"
          >
            <span className="font-medium text-[var(--color-ink-2)]">{department}</span>
            {health ? (
              <StatusBadge status={health} />
            ) : (
              <span className="text-[var(--color-ink-muted)]">Not set</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
