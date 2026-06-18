import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  createDepartmentGoal,
  currentPeriod,
  listActiveCompanyGoalOptions,
  listDepartmentGoals,
  updateDepartmentGoalRoadmap,
} from "@/lib/hr-db";
import { HR_DEPARTMENTS, HR_GOAL_STATUSES, HR_ROADMAP_HEALTH } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ period?: string; department?: string; error?: string }>;
};

async function createDeptGoalAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/department-roadmap");

  const department = String(formData.get("department") ?? "").trim();
  const companyGoalIdRaw = Number(formData.get("companyGoalId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const period = String(formData.get("period") ?? "").trim();
  const owner = String(formData.get("owner") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !period || !HR_DEPARTMENTS.includes(department as (typeof HR_DEPARTMENTS)[number])) {
    redirectWithFormError("/admin/department-roadmap", "Department, title, and period are required.");
  }

  await createDepartmentGoal({
    department: department as (typeof HR_DEPARTMENTS)[number],
    companyGoalId: Number.isFinite(companyGoalIdRaw) ? companyGoalIdRaw : null,
    title,
    period,
    owner: owner || null,
    description: description || null,
    status: "active",
  });

  revalidatePath("/admin/department-roadmap");
  revalidatePath("/admin");
}

async function updateRoadmapAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/department-roadmap");

  const id = Number(formData.get("goalId") ?? "");
  const roadmapHealth = String(formData.get("roadmapHealth") ?? "").trim();
  const statusReason = String(formData.get("statusReason") ?? "").trim();
  const keyBlockers = String(formData.get("keyBlockers") ?? "").trim();
  const nextPriorities = String(formData.get("nextPriorities") ?? "").trim();

  if (!Number.isFinite(id)) {
    redirectWithFormError("/admin/department-roadmap", "Goal ID is required.");
  }
  if (!HR_ROADMAP_HEALTH.includes(roadmapHealth as (typeof HR_ROADMAP_HEALTH)[number])) {
    redirectWithFormError("/admin/department-roadmap", "Select a valid roadmap health.");
  }

  await updateDepartmentGoalRoadmap(id, {
    roadmapHealth: roadmapHealth as (typeof HR_ROADMAP_HEALTH)[number],
    statusReason: statusReason || null,
    keyBlockers: keyBlockers || null,
    nextPriorities: nextPriorities || null,
  });

  revalidatePath("/admin/department-roadmap");
  revalidatePath("/admin");
}

export default async function DepartmentRoadmapPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const periodFilter = params.period?.trim() || currentPeriod();
  const departmentFilter = params.department?.trim() || "";

  const [goals, companyGoals] = await Promise.all([
    listDepartmentGoals({
      period: periodFilter,
      department: departmentFilter,
      limit: 100,
    }),
    listActiveCompanyGoalOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Link department priorities to company goals. HODs update roadmap health monthly."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Create department goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDeptGoalAction} className="grid gap-4 md:grid-cols-2">
            <select
              name="department"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Select department</option>
              {HR_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              name="companyGoalId"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Link company goal (optional)</option>
              {companyGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.period})
                </option>
              ))}
            </select>
            <Input name="title" placeholder="Department goal title" required />
            <Input name="period" defaultValue={periodFilter} required />
            <Input name="owner" placeholder="Owner / HOD" />
            <Textarea
              name="description"
              placeholder="Description"
              className="md:col-span-2"
              rows={2}
            />
            <Button type="submit" className="w-fit">
              Save department goal
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap health · {periodFilter}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No department goals for this period.</p>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {goal.department}: {goal.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {goal.company_goal_title
                        ? `Linked to ${goal.company_goal_title}`
                        : "No linked company goal"}
                    </p>
                  </div>
                  <StatusBadge status={goal.roadmap_health} />
                </div>
                <form action={updateRoadmapAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="goalId" value={goal.id} />
                  <select
                    name="roadmapHealth"
                    defaultValue={goal.roadmap_health}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {HR_ROADMAP_HEALTH.map((h) => (
                      <option key={h} value={h}>
                        {humanizeLabel(h)}
                      </option>
                    ))}
                  </select>
                  <Input
                    name="statusReason"
                    defaultValue={goal.status_reason ?? ""}
                    placeholder="Status reason"
                  />
                  <Textarea
                    name="keyBlockers"
                    defaultValue={goal.key_blockers ?? ""}
                    placeholder="Key blockers"
                    rows={2}
                  />
                  <Textarea
                    name="nextPriorities"
                    defaultValue={goal.next_priorities ?? ""}
                    placeholder="Next priorities"
                    rows={2}
                  />
                  <Button type="submit" size="sm" className="md:col-span-2 w-fit">
                    Update roadmap health
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
