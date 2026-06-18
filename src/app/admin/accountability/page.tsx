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
  ACCOUNTABILITY_LADDER,
  createAccountabilityAction,
  DEPARTMENT_FRAMEWORK,
  listAccountabilityActions,
  listHREmployeeOptions,
  updateAccountabilityStatus,
} from "@/lib/hr-db";
import {
  HR_ACCOUNTABILITY_STAGES,
  HR_ACCOUNTABILITY_STATUSES,
  HR_DEPARTMENTS,
} from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ status?: string; stage?: string; error?: string }>;
};

async function createActionAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/accountability");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const stage = String(formData.get("stage") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const issuedOn = String(formData.get("issuedOn") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isFinite(employeeId) || !reason) {
    redirectWithFormError("/admin/accountability", "Employee and reason are required.");
  }
  if (!HR_ACCOUNTABILITY_STAGES.includes(stage as (typeof HR_ACCOUNTABILITY_STAGES)[number])) {
    redirectWithFormError("/admin/accountability", "Select a valid stage.");
  }

  await createAccountabilityAction({
    employeeId,
    stage: stage as (typeof HR_ACCOUNTABILITY_STAGES)[number],
    reason,
    issuedOn: issuedOn || null,
    notes: notes || null,
  });

  revalidatePath("/admin/accountability");
  revalidatePath("/admin");
}

async function updateStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/accountability");

  const actionId = Number(formData.get("actionId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isFinite(actionId)) {
    redirectWithFormError("/admin/accountability", "Action ID is required.");
  }
  if (!HR_ACCOUNTABILITY_STATUSES.includes(status as (typeof HR_ACCOUNTABILITY_STATUSES)[number])) {
    redirectWithFormError("/admin/accountability", "Select a valid status.");
  }

  await updateAccountabilityStatus(
    actionId,
    status as (typeof HR_ACCOUNTABILITY_STATUSES)[number],
    notes || null
  );
  revalidatePath("/admin/accountability");
  revalidatePath("/admin");
}

export default async function AccountabilityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status?.trim() || "";
  const stageFilter = params.stage?.trim() || "";

  const [actions, employees] = await Promise.all([
    listAccountabilityActions({ status: statusFilter, stage: stageFilter }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="A fair, progressive path: coaching, warnings, improvement plans, and final review. Serious misconduct triggers immediate investigation."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Stage</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={stageFilter}
                name="stage"
              >
                <option value="">All stages</option>
                {HR_ACCOUNTABILITY_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {humanizeLabel(stage)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={statusFilter}
                name="status"
              >
                <option value="">All</option>
                {HR_ACCOUNTABILITY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button className="w-full" type="submit">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record Accountability Action</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createActionAction} className="grid gap-3 sm:grid-cols-2">
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
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue="coaching"
              name="stage"
            >
              {HR_ACCOUNTABILITY_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {humanizeLabel(stage)}
                </option>
              ))}
            </select>
            <Input name="issuedOn" type="date" />
            <Input name="reason" placeholder="Reason" required />
            <Textarea className="sm:col-span-2" name="notes" placeholder="Notes" />
            <div className="sm:col-span-2">
              <Button type="submit">Save Action</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accountability Actions ({actions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accountability actions recorded.</p>
          ) : (
            actions.map((action) => (
              <div
                key={action.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {action.employee_name}
                    <span className="text-muted-foreground">
                      {" "}
                      &middot; {humanizeLabel(action.stage)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Issued {action.issued_on} &bull; {action.reason}
                    {action.notes ? ` \u2022 ${action.notes}` : ""}
                  </p>
                </div>
                <form action={updateStatusAction} className="flex items-center gap-2">
                  <input name="actionId" type="hidden" value={action.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={action.status}
                    name="status"
                  >
                    {HR_ACCOUNTABILITY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={action.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accountability Ladder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ACCOUNTABILITY_LADDER.map((step, index) => (
            <div key={step.stage} className="flex gap-3 rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-sm">
              <span className="w-6 shrink-0 font-medium text-muted-foreground">{index + 1}</span>
              <div>
                <p className="font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.note}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department-Specific Serious Issues</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HR_DEPARTMENTS.map((department) => (
            <div key={department} className="rounded-lg border p-3">
              <p className="text-sm font-medium text-foreground">{department}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {DEPARTMENT_FRAMEWORK[department].seriousIssues.map((issue) => (
                  <li key={issue} className="flex gap-2">
                    <span className="text-rose-500">&bull;</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
