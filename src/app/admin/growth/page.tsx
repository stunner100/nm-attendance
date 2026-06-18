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
          <form action={createPlanAction} className="grid gap-3 sm:grid-cols-2">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue=""
              name="employeeId"
              required
            >
              <option disabled value="">
                Select employee
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            <Input name="currentRole" placeholder="Current role" />
            <Textarea name="currentResponsibilities" placeholder="Current responsibilities" />
            <Textarea name="requiredKpis" placeholder="Required KPIs" />
            <Textarea name="skillsToImprove" placeholder="Skills to improve" />
            <Input name="possibleNextRole" placeholder="Possible next role" />
            <Textarea
              name="promotionRequirements"
              placeholder="Required performance level for promotion / salary review"
            />
            <Textarea name="trainingNeeded" placeholder="Training or support needed" />
            <Input name="reviewTimeline" placeholder="Review timeline (e.g. every 6 months)" />
            <Input name="nextReviewDate" type="date" />
            <div className="sm:col-span-2">
              <Button type="submit">Create Growth Plan</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Growth Plans ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No growth plans yet.</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {plan.employee_name}
                      <span className="text-muted-foreground">
                        {" "}
                        &middot; {plan.current_role || "Role not set"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plan.department}
                      {plan.possible_next_role ? ` \u2192 ${plan.possible_next_role}` : ""}
                      {plan.next_review_date ? ` \u2022 Review ${plan.next_review_date}` : ""}
                    </p>
                  </div>
                  <form action={updateStatusAction} className="flex flex-wrap items-center gap-2">
                    <input name="planId" type="hidden" value={plan.id} />
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      defaultValue={plan.status}
                      name="status"
                    >
                      {HR_GROWTH_PLAN_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {humanizeLabel(status)}
                        </option>
                      ))}
                    </select>
                    <Input className="h-8 w-36 text-xs" name="nextReviewDate" type="date" />
                    <Button size="sm" type="submit" variant="outline">
                      Save
                    </Button>
                    <StatusBadge status={plan.status} />
                  </form>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  {plan.required_kpis ? (
                    <p>
                      <span className="font-semibold">Required KPIs:</span> {plan.required_kpis}
                    </p>
                  ) : null}
                  {plan.skills_to_improve ? (
                    <p>
                      <span className="font-semibold">Skills:</span> {plan.skills_to_improve}
                    </p>
                  ) : null}
                  {plan.promotion_requirements ? (
                    <p>
                      <span className="font-semibold">Promotion requirements:</span>{" "}
                      {plan.promotion_requirements}
                    </p>
                  ) : null}
                  {plan.training_needed ? (
                    <p>
                      <span className="font-semibold">Training:</span> {plan.training_needed}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
