import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { GrowthPlanAccordion } from "@/components/hr/growth-plan-accordion";
import { GrowthPlanStack } from "@/components/hr/growth-plan-stack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  createGrowthPlan,
  listGrowthPlans,
  listHREmployeeOptions,
  updateGrowthPlanStatus,
} from "@/lib/hr-db";
import { HR_GROWTH_PLAN_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

function field(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

async function createPlanAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/growth");

  const employeeId = Number(formData.get("employeeId") ?? "");
  if (!Number.isFinite(employeeId)) {
    redirectWithFormError("/admin/growth", "Employee is required.");
  }

  await createGrowthPlan({
    employeeId,
    currentRole: field(formData, "currentRole"),
    currentResponsibilities: field(formData, "currentResponsibilities"),
    requiredKpis: field(formData, "requiredKpis"),
    skillsToImprove: field(formData, "skillsToImprove"),
    possibleNextRole: field(formData, "possibleNextRole"),
    promotionRequirements: field(formData, "promotionRequirements"),
    trainingNeeded: field(formData, "trainingNeeded"),
    reviewTimeline: field(formData, "reviewTimeline"),
    nextReviewDate: field(formData, "nextReviewDate"),
  });

  revalidatePath("/admin/growth");
  revalidatePath("/admin");
}

async function updateStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/growth");

  const planId = Number(formData.get("planId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const nextReviewDate = String(formData.get("nextReviewDate") ?? "").trim();

  if (!Number.isFinite(planId)) {
    redirectWithFormError("/admin/growth", "Plan ID is required.");
  }
  if (!HR_GROWTH_PLAN_STATUSES.includes(status as (typeof HR_GROWTH_PLAN_STATUSES)[number])) {
    redirectWithFormError("/admin/growth", "Select a valid status.");
  }

  await updateGrowthPlanStatus(
    planId,
    status as (typeof HR_GROWTH_PLAN_STATUSES)[number],
    nextReviewDate || null
  );
  revalidatePath("/admin/growth");
  revalidatePath("/admin");
}

export default async function GrowthPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status?.trim() || "";

  const [plans, employees] = await Promise.all([
    listGrowthPlans({ status: statusFilter }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Every employee should have a 6-12 month growth plan covering role, KPIs, skills, the next role, promotion requirements, and review timeline."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={statusFilter}
                name="status"
              >
                <option value="">All statuses</option>
                {HR_GROWTH_PLAN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit">Apply Filters</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Growth Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthPlanStack
            employeeOptions={employees}
            createPlanAction={createPlanAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Growth Plans ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthPlanAccordion plans={plans} updateStatusAction={updateStatusAction} />
        </CardContent>
      </Card>
    </div>
  );
}
