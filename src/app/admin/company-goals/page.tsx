import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { AddCompanyGoalStack } from "@/components/hr/add-company-goal-stack";
import { CompanyGoalsListAccordion } from "@/components/hr/company-goals-list-accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, readFormRecordId } from "@/lib/hr/form-actions";
import {
  createCompanyGoal,
  currentPeriod,
  deleteCompanyGoal,
  listCompanyGoals,
  updateCompanyGoal,
} from "@/lib/hr-db";
import { HR_GOAL_PRIORITIES, HR_GOAL_STATUSES } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{ period?: string; status?: string; error?: string }>;
};

async function createGoalAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/company-goals");

  const title = String(formData.get("title") ?? "").trim();
  const period = String(formData.get("period") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium").trim();
  const owner = String(formData.get("owner") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!title || !period) {
    redirectWithFormError("/admin/company-goals", "Title and period are required.");
  }

  await createCompanyGoal({
    title,
    period,
    description: description || null,
    priority: priority as (typeof HR_GOAL_PRIORITIES)[number],
    owner: owner || null,
    status: status as (typeof HR_GOAL_STATUSES)[number],
  });

  revalidatePath("/admin/company-goals");
  revalidatePath("/admin");
}

async function approveGoalAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/company-goals");

  const id = Number(formData.get("goalId") ?? "");
  if (!Number.isFinite(id)) {
    redirectWithFormError("/admin/company-goals", "Goal ID is required.");
  }

  const goals = await listCompanyGoals({ limit: 200 });
  const goal = goals.find((g) => g.id === id);
  if (!goal) {
    redirectWithFormError("/admin/company-goals", "Goal not found.");
  }

  await updateCompanyGoal(id, {
    ...goal,
    status: "active",
    approvedBy: "Management",
    dateApproved: new Date().toISOString().slice(0, 10),
  });

  revalidatePath("/admin/company-goals");
}

async function deleteGoalAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/company-goals");

  const id = readFormRecordId(formData, "goalId");
  if (!id) {
    redirectWithFormError("/admin/company-goals", "Goal ID is required.");
  }

  const deleted = await deleteCompanyGoal(id);
  if (!deleted) {
    redirectWithFormError("/admin/company-goals", "Goal not found.");
  }

  revalidatePath("/admin/company-goals");
  revalidatePath("/admin");
}

export default async function CompanyGoalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const periodFilter = params.period?.trim() || "";
  const statusFilter = params.status?.trim() || "";

  const goals = await listCompanyGoals({
    period: periodFilter,
    status: statusFilter,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Set company-wide objectives that department goals and employee KPIs connect to."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Create company goal</CardTitle>
        </CardHeader>
        <CardContent>
          <AddCompanyGoalStack
            defaultPeriod={currentPeriod()}
            createGoalAction={createGoalAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals ({goals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyGoalsListAccordion
            goals={goals}
            approveGoalAction={approveGoalAction}
            deleteGoalAction={deleteGoalAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
