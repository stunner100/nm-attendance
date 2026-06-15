import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  createDisciplinaryCase,
  createFollowupAction,
  createPolicyViolation,
  getComplianceModuleData,
  listHREmployeeOptions,
  updateDisciplinaryCaseStatus,
  updateFollowupActionStatus,
} from "@/lib/hr-db";
import { HR_DISCIPLINARY_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type CompliancePageProps = {
  searchParams: Promise<{ status?: string; severity?: string; error?: string }>;
};

async function createCaseAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/compliance");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const status = String(formData.get("status") ?? "warning_issued").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const openedAt = String(formData.get("openedAt") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!category || !summary) {
    redirectWithFormError("/admin/compliance", "Category and summary are required.");
  }
  if (
    !HR_DISCIPLINARY_STATUSES.includes(
      status as (typeof HR_DISCIPLINARY_STATUSES)[number]
    )
  ) {
    redirectWithFormError("/admin/compliance", "Select a valid case status.");
  }

  await createDisciplinaryCase({
    employeeId: Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null,
    category,
    status: status as (typeof HR_DISCIPLINARY_STATUSES)[number],
    summary,
    openedAt: openedAt || undefined,
    dueDate: dueDate || undefined,
  });

  revalidatePath("/admin/compliance");
  revalidatePath("/admin");
}

async function createViolationAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/compliance");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const severity = String(formData.get("severity") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const occurredOn = String(formData.get("occurredOn") ?? "").trim();

  if (!category) {
    redirectWithFormError("/admin/compliance", "Violation category is required.");
  }
  if (!["low", "medium", "high"].includes(severity)) {
    redirectWithFormError("/admin/compliance", "Select a valid severity level.");
  }

  await createPolicyViolation({
    employeeId: Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null,
    category,
    severity: severity as "low" | "medium" | "high",
    notes: notes || null,
    occurredOn: occurredOn || undefined,
  });

  revalidatePath("/admin/compliance");
  revalidatePath("/admin");
}

async function createFollowupActionAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/compliance");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const actionType = String(formData.get("actionType") ?? "").trim();
  const status = String(formData.get("status") ?? "pending").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!actionType) {
    redirectWithFormError("/admin/compliance", "Follow-up action type is required.");
  }
  if (!["pending", "in_progress", "done"].includes(status)) {
    redirectWithFormError("/admin/compliance", "Select a valid follow-up status.");
  }

  await createFollowupAction({
    employeeId: Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null,
    actionType,
    status: status as "pending" | "in_progress" | "done",
    dueDate: dueDate || undefined,
    notes: notes || null,
  });

  revalidatePath("/admin/compliance");
  revalidatePath("/admin");
}

async function updateCaseStatusAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/compliance");

  const caseId = Number(formData.get("caseId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  if (!Number.isFinite(caseId)) {
    redirectWithFormError("/admin/compliance", "Case ID is required.");
  }
  if (
    !HR_DISCIPLINARY_STATUSES.includes(
      status as (typeof HR_DISCIPLINARY_STATUSES)[number]
    )
  ) {
    redirectWithFormError("/admin/compliance", "Select a valid case status.");
  }

  await updateDisciplinaryCaseStatus(
    caseId,
    status as (typeof HR_DISCIPLINARY_STATUSES)[number]
  );
  revalidatePath("/admin/compliance");
  revalidatePath("/admin");
}

async function updateFollowupStatusAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/compliance");

  const actionId = Number(formData.get("actionId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  if (!Number.isFinite(actionId) || !["pending", "in_progress", "done"].includes(status)) {
    redirectWithFormError("/admin/compliance", "Valid action ID and status are required.");
  }

  await updateFollowupActionStatus(actionId, status as "pending" | "in_progress" | "done");
  revalidatePath("/admin/compliance");
  revalidatePath("/admin");
}

export default async function CompliancePage({ searchParams }: CompliancePageProps) {
  const params = await searchParams;

  const statusFilter = params.status?.trim() || "";
  const severityFilter = params.severity?.trim() || "";

  const [data, employees] = await Promise.all([
    getComplianceModuleData({
      status: statusFilter,
      severity: severityFilter,
    }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="HR Cases & Compliance"
        description="Track cases, policy violations, and follow-up actions."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Case status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={statusFilter}
                name="status"
              >
                <option value="">All statuses</option>
                {HR_DISCIPLINARY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Violation severity</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={severityFilter}
                name="severity"
              >
                <option value="">All levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Open Case</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCaseAction} className="grid gap-3">
              <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue="" name="employeeId">
                <option value="">Employee (optional)</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
              <Input name="category" placeholder="Category" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="warning_issued"
                name="status"
              >
                {HR_DISCIPLINARY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <Input name="summary" placeholder="Summary" required />
              <Input name="openedAt" type="date" />
              <Input name="dueDate" type="date" />
              <Button type="submit">Create Case</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Violation</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createViolationAction} className="grid gap-3">
              <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue="" name="employeeId">
                <option value="">Employee (optional)</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
              <Input name="category" placeholder="Violation category" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="medium"
                name="severity"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <Input name="occurredOn" type="date" />
              <Input name="notes" placeholder="Notes (optional)" />
              <Button type="submit">Add Violation</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Follow-up Action</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createFollowupActionAction} className="grid gap-3">
              <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue="" name="employeeId">
                <option value="">Employee (optional)</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
              <Input name="actionType" placeholder="Action type" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="pending"
                name="status"
              >
                <option value="pending">{humanizeLabel("pending")}</option>
                <option value="in_progress">{humanizeLabel("in_progress")}</option>
                <option value="done">{humanizeLabel("done")}</option>
              </select>
              <Input name="dueDate" type="date" />
              <Input name="notes" placeholder="Notes (optional)" />
              <Button type="submit">Create Action</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disciplinary Cases ({data.cases.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cases found.</p>
          ) : (
            data.cases.map((caseItem) => (
              <div key={caseItem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{caseItem.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {caseItem.category} &bull; Opened {caseItem.opened_at}
                    {caseItem.due_date ? ` &bull; Due ${caseItem.due_date}` : ""}
                  </p>
                </div>
                <form action={updateCaseStatusAction} className="flex items-center gap-2">
                  <input name="caseId" type="hidden" value={caseItem.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={caseItem.status}
                    name="status"
                  >
                    {HR_DISCIPLINARY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={caseItem.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy Violations ({data.violations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.violations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No violations found.</p>
          ) : (
            data.violations.map((violation) => (
              <div key={violation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{violation.category}</p>
                  <p className="text-xs text-muted-foreground">
                    Severity {humanizeLabel(violation.severity)} &bull; {violation.occurred_on}
                  </p>
                </div>
                <StatusBadge status={violation.severity} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up Actions ({data.actions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No follow-up actions found.</p>
          ) : (
            data.actions.map((action) => (
              <div key={action.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{action.action_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {action.due_date ?? "n/a"}
                  </p>
                </div>
                <form action={updateFollowupStatusAction} className="flex items-center gap-2">
                  <input name="actionId" type="hidden" value={action.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={action.status}
                    name="status"
                  >
                    <option value="pending">{humanizeLabel("pending")}</option>
                    <option value="in_progress">{humanizeLabel("in_progress")}</option>
                    <option value="done">{humanizeLabel("done")}</option>
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
    </div>
  );
}
