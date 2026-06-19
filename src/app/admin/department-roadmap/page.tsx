import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { AddDepartmentGoalStack } from "@/components/hr/add-department-goal-stack";
import { DepartmentRoadmapListAccordion } from "@/components/hr/department-roadmap-list-accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, readFormRecordId, redirectWithFormSuccess, readFormSuccess } from "@/lib/hr/form-actions";
import {
  createDepartmentGoal,
  currentPeriod,
  deleteDepartmentGoal,
  listActiveCompanyGoalOptions,
  listDepartmentGoals,
  updateDepartmentGoalRoadmap,
} from "@/lib/hr-db";
import { HR_DEPARTMENTS, HR_ROADMAP_HEALTH } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{ period?: string; department?: string; error?: string; success?: string }>;
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
  redirectWithFormSuccess("/admin/department-roadmap", "Department goal created successfully.");
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
  redirectWithFormSuccess("/admin/department-roadmap", "Roadmap health updated successfully.");
}

async function deleteDeptGoalAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/department-roadmap");

  const id = readFormRecordId(formData, "goalId");
  if (!id) {
    redirectWithFormError("/admin/department-roadmap", "Goal ID is required.");
  }

  const deleted = await deleteDepartmentGoal(id);
  if (!deleted) {
    redirectWithFormError("/admin/department-roadmap", "Goal not found.");
  }

  revalidatePath("/admin/department-roadmap");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/department-roadmap", "Department goal deleted successfully.");
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
      <AdminFormAlert message={readFormSuccess(params)} variant="success" />

      <Card>
        <CardHeader>
          <CardTitle>Create department goal</CardTitle>
        </CardHeader>
        <CardContent>
          <AddDepartmentGoalStack
            defaultPeriod={periodFilter}
            companyGoals={companyGoals}
            createDeptGoalAction={createDeptGoalAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap health · {periodFilter}</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentRoadmapListAccordion
            goals={goals}
            updateRoadmapAction={updateRoadmapAction}
            deleteGoalAction={deleteDeptGoalAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
