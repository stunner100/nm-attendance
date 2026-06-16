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
    <Card className="h-full min-h-[274px]">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Roadmap Health by Department</CardTitle>
        <Link href="/admin/department-roadmap" className="text-xs font-medium text-[#006ce5] hover:text-[#0057b8]">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {entries.map(([department, health]) => (
          <div key={department} className="flex h-[33px] items-center justify-between gap-3 border-b border-[#eef2f7] text-xs last:border-b-0">
            <span className="font-medium text-[#1e293b]">{department}</span>
            {health ? (
              <StatusBadge status={health} />
            ) : (
              <span className="text-[#64748b]">Not set</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
