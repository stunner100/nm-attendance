import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.scoreTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No score history.</p>
            ) : (
              profile.scoreTrend.map((s) => (
                <div
                  key={s.period}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>{s.period}</span>
                  <span className="tabular-nums font-medium">
                    {s.total.toFixed(1)} · {humanizeLabel(s.rating)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KPI cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.kpiCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No KPI cards.</p>
            ) : (
              profile.kpiCards.map((card) => {
                const items = profile.kpiItems.find((i) => i.cardId === card.id)?.items ?? [];
                return (
                  <div key={card.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{card.period}</p>
                      <StatusBadge status={card.status} />
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {items.map((item) => (
                        <li key={item.id}>
                          {item.kpi_text} (weight {item.weight})
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({profile.tasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks assigned.</p>
            ) : (
              profile.tasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="truncate">{task.title}</span>
                  <StatusBadge status={task.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth plan</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.growthPlan ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Next role:</span>{" "}
                  {profile.growthPlan.possible_next_role || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Timeline:</span>{" "}
                  {profile.growthPlan.review_timeline || "—"}
                </p>
                <StatusBadge status={profile.growthPlan.status} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No growth plan on file.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rewards recorded.</p>
            ) : (
              profile.rewards.slice(0, 6).map((r) => (
                <div key={r.id} className="text-sm rounded-md border border-border px-3 py-2">
                  {r.reward_type} · {r.awarded_on}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accountability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.accountability.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accountability records.</p>
            ) : (
              profile.accountability.slice(0, 6).map((a) => (
                <div key={a.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={a.stage} />
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
