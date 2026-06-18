import Link from "next/link";
import { Download } from "lucide-react";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { requireAdminPage } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXPORT_LINKS = [
  { label: "Monthly scores", href: "/api/hr/export/monthly-scores" },
  { label: "KPI cards", href: "/api/hr/export/kpi-cards" },
  { label: "Rewards", href: "/api/hr/export/rewards" },
  { label: "Accountability", href: "/api/hr/export/accountability" },
  { label: "Growth plans", href: "/api/hr/export/growth-plans" },
  { label: "Department roadmap", href: "/api/hr/export/department-roadmap" },
  { label: "Employee performance", href: "/api/hr/export/employee-performance" },
  { label: "Attendance", href: "/api/admin/export-attendance?format=csv" },
];

export default async function ReportsPage() {
  await requireAdminPage("/admin/reports");

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Download CSV exports for performance, people operations, and attendance."
      />

      <Card>
        <CardHeader>
          <CardTitle>Available exports</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg border border-border bg-card p-4 transition-[background-color] hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.label}</p>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </a>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Need a filtered attendance export? Open{" "}
        <Link href="/admin/attendance" className="font-medium text-foreground underline-offset-2 hover:underline">
          Attendance
        </Link>{" "}
        and use the date filter there.
      </p>
    </div>
  );
}
