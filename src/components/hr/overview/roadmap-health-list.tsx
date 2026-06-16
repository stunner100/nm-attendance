import { StatusBadge } from "@/components/hr/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HRDepartment, HRRoadmapHealth } from "@/lib/types";

type RoadmapHealthListProps = {
  healthByDepartment: Record<HRDepartment, HRRoadmapHealth | null>;
};

export function RoadmapHealthList({ healthByDepartment }: RoadmapHealthListProps) {
  const entries = Object.entries(healthByDepartment);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Roadmap health by department</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([department, health]) => (
          <div key={department} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{department}</span>
            {health ? (
              <StatusBadge status={health} />
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
