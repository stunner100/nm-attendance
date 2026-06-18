import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import {
  AddDisciplinaryCaseStack,
  AddFollowupActionStack,
  AddPolicyViolationStack,
} from "@/components/hr/compliance-create-stacks";
import {
  DisciplinaryCasesAccordion,
  FollowupActionsAccordion,
  PolicyViolationsAccordion,
} from "@/components/hr/compliance-list-accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <AddDisciplinaryCaseStack
              employeeOptions={employees}
              createCaseAction={createCaseAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Violation</CardTitle>
          </CardHeader>
          <CardContent>
            <AddPolicyViolationStack
              employeeOptions={employees}
              createViolationAction={createViolationAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Follow-up Action</CardTitle>
          </CardHeader>
          <CardContent>
            <AddFollowupActionStack
              employeeOptions={employees}
              createFollowupActionAction={createFollowupActionAction}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disciplinary Cases ({data.cases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DisciplinaryCasesAccordion
            cases={data.cases}
            updateCaseStatusAction={updateCaseStatusAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy Violations ({data.violations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PolicyViolationsAccordion violations={data.violations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up Actions ({data.actions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <FollowupActionsAccordion
            actions={data.actions}
            updateFollowupStatusAction={updateFollowupStatusAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
