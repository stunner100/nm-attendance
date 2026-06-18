import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { EmployeeProfileSections } from "@/components/hr/employee-profile-sections";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { getEmployeePerformanceProfile } from "@/lib/hr-db";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeProfilePage({ params }: PageProps) {
  await requireAdminPage("/admin/headcount");
  const { id: idParam } = await params;
  const employeeId = Number(idParam);
  if (!Number.isFinite(employeeId)) {
    notFound();
  }

  const profile = await getEmployeePerformanceProfile(employeeId);
  if (!profile) {
    notFound();
  }

  const { employee } = profile;

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title={employee.full_name}
        showTitle
        description="Full performance profile — KPIs, tasks, scores, rewards, accountability, and growth."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/headcount">Back to employees</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.currentScore ? (
              <>
                <p className="text-2xl font-semibold tabular-nums">
                  {profile.currentScore.total.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.currentScore.period} · {humanizeLabel(profile.currentScore.rating)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not scored yet</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{employee.department}</p>
            <p className="text-xs text-muted-foreground">
              {employee.job_title || "No role title"} ·{" "}
              {employee.job_level ? humanizeLabel(employee.job_level) : "Level not set"}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{profile.managerName || "—"}</p>
            <StatusBadge status={employee.employment_status} />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">PIP</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.activePip ? (
              <>
                <StatusBadge status={profile.activePip.status} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.activePip.start_date}
                  {profile.activePip.end_date ? ` → ${profile.activePip.end_date}` : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No active PIP</p>
            )}
          </CardContent>
        </Card>
      </section>

      <EmployeeProfileSections profile={profile} />
    </div>
  );
}
