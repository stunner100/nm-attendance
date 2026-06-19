import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import {
  CreateLeaveRequestStack,
  CreatePayrollAnomalyStack,
  CreatePayrollCycleStack,
  UpsertLeaveBalanceStack,
} from "@/components/hr/payroll-leave-create-stacks";
import {
  LeaveRequestsAccordion,
  PayrollAnomaliesAccordion,
  PayrollCyclesAccordion,
} from "@/components/hr/payroll-leave-list-accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, redirectWithFormSuccess, readFormSuccess } from "@/lib/hr/form-actions";
import { humanizeLabel } from "@/lib/labels";
import {
  createLeaveRequest,
  createPayrollAnomaly,
  createPayrollCycle,
  getPayrollLeaveModuleData,
  listHREmployeeOptions,
  listPayrollCycleOptions,
  updateLeaveRequestStatus,
  updatePayrollAnomalyStatus,
  updatePayrollCycleStatus,
  upsertLeaveBalance,
} from "@/lib/hr-db";
import { HR_LEAVE_REQUEST_STATUSES, HR_PAYROLL_STATUSES } from "@/lib/types";

type PayrollLeavePageProps = {
  searchParams: Promise<{ cycleStatus?: string; leaveStatus?: string; error?: string; success?: string }>;
};

async function createCycleAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const cycleMonth = String(formData.get("cycleMonth") ?? "").trim();
  const status = String(formData.get("status") ?? "pending").trim();
  const processedAt = String(formData.get("processedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!cycleMonth) {
    redirectWithFormError("/admin/payroll-leave", "Payroll cycle month is required.");
  }
  if (!HR_PAYROLL_STATUSES.includes(status as (typeof HR_PAYROLL_STATUSES)[number])) {
    redirectWithFormError("/admin/payroll-leave", "Select a valid payroll cycle status.");
  }

  await createPayrollCycle({
    cycleMonth,
    status: status as (typeof HR_PAYROLL_STATUSES)[number],
    processedAt: processedAt || undefined,
    notes: notes || undefined,
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/payroll-leave", "Payroll cycle created successfully.");
}

async function createAnomalyAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const payrollCycleId = Number(formData.get("payrollCycleId") ?? "");
  const employeeId = Number(formData.get("employeeId") ?? "");
  const anomalyType = String(formData.get("anomalyType") ?? "").trim();
  const status = String(formData.get("status") ?? "open").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!Number.isFinite(payrollCycleId) || !anomalyType) {
    redirectWithFormError("/admin/payroll-leave", "Payroll cycle and anomaly type are required.");
  }
  if (!["open", "resolved"].includes(status)) {
    redirectWithFormError("/admin/payroll-leave", "Select a valid anomaly status.");
  }

  await createPayrollAnomaly({
    payrollCycleId,
    employeeId: Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null,
    anomalyType,
    status: status as "open" | "resolved",
    details: details || undefined,
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/payroll-leave", "Payroll anomaly reported successfully.");
}

async function upsertBalanceAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const annualDays = Number(formData.get("annualDays") ?? "");
  const usedDays = Number(formData.get("usedDays") ?? "");
  const carryDays = Number(formData.get("carryDays") ?? "");

  if (!Number.isFinite(employeeId) || !Number.isFinite(annualDays)) {
    redirectWithFormError("/admin/payroll-leave", "Employee and annual leave days are required.");
  }

  await upsertLeaveBalance({
    employeeId,
    annualDays,
    usedDays: Number.isFinite(usedDays) ? usedDays : 0,
    carryDays: Number.isFinite(carryDays) ? carryDays : 0,
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/payroll-leave", "Leave balance updated successfully.");
}

async function createLeaveRequestAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const leaveType = String(formData.get("leaveType") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const days = Number(formData.get("days") ?? "");
  const status = String(formData.get("status") ?? "pending").trim();

  if (!Number.isFinite(employeeId) || !leaveType || !startDate || !endDate || !Number.isFinite(days)) {
    redirectWithFormError("/admin/payroll-leave", "Complete all leave request fields.");
  }
  if (
    !HR_LEAVE_REQUEST_STATUSES.includes(
      status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
    )
  ) {
    redirectWithFormError("/admin/payroll-leave", "Select a valid leave request status.");
  }

  await createLeaveRequest({
    employeeId,
    leaveType,
    startDate,
    endDate,
    days,
    status: status as (typeof HR_LEAVE_REQUEST_STATUSES)[number],
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/payroll-leave", "Leave request created successfully.");
}

async function updateCycleStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const cycleId = Number(formData.get("cycleId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(cycleId)) {
    redirectWithFormError("/admin/payroll-leave", "Payroll cycle ID is required.");
  }
  if (!HR_PAYROLL_STATUSES.includes(status as (typeof HR_PAYROLL_STATUSES)[number])) {
    redirectWithFormError("/admin/payroll-leave", "Select a valid payroll cycle status.");
  }

  await updatePayrollCycleStatus(cycleId, status as (typeof HR_PAYROLL_STATUSES)[number]);
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/payroll-leave", "Payroll cycle status updated successfully.");
}

async function updateLeaveStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const leaveRequestId = Number(formData.get("leaveRequestId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(leaveRequestId)) {
    redirectWithFormError("/admin/payroll-leave", "Leave request ID is required.");
  }
  if (
    !HR_LEAVE_REQUEST_STATUSES.includes(
      status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
    )
  ) {
    redirectWithFormError("/admin/payroll-leave", "Select a valid leave request status.");
  }

  await updateLeaveRequestStatus(
    leaveRequestId,
    status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
  );
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/payroll-leave", "Leave request status updated successfully.");
}

async function updateAnomalyStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const anomalyId = Number(formData.get("anomalyId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(anomalyId) || !["open", "resolved"].includes(status)) {
    redirectWithFormError("/admin/payroll-leave", "Valid anomaly ID and status are required.");
  }

  await updatePayrollAnomalyStatus(anomalyId, status as "open" | "resolved");
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/payroll-leave", "Payroll anomaly status updated successfully.");
}

export default async function PayrollLeavePage({ searchParams }: PayrollLeavePageProps) {
  const params = await searchParams;

  const cycleStatusFilter = params.cycleStatus?.trim() || "";
  const leaveStatusFilter = params.leaveStatus?.trim() || "";

  const [data, employees, payrollCycleOptions] = await Promise.all([
    getPayrollLeaveModuleData({
      cycleStatus: cycleStatusFilter,
      leaveStatus: leaveStatusFilter,
    }),
    listHREmployeeOptions(),
    listPayrollCycleOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Monitor payroll cycles, anomalies, leave balances, and approvals."
      />

      <AdminFormAlert message={readFormError(params)} />
      <AdminFormAlert message={readFormSuccess(params)} variant="success" />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Payroll cycle status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={cycleStatusFilter}
                name="cycleStatus"
              >
                <option value="">All statuses</option>
                {HR_PAYROLL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Leave request status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={leaveStatusFilter}
                name="leaveStatus"
              >
                <option value="">All statuses</option>
                {HR_LEAVE_REQUEST_STATUSES.map((status) => (
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Payroll Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePayrollCycleStack createCycleAction={createCycleAction} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Payroll Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePayrollAnomalyStack
              employeeOptions={employees}
              payrollCycleOptions={payrollCycleOptions}
              createAnomalyAction={createAnomalyAction}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <UpsertLeaveBalanceStack
              employeeOptions={employees}
              upsertBalanceAction={upsertBalanceAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateLeaveRequestStack
              employeeOptions={employees}
              createLeaveRequestAction={createLeaveRequestAction}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Cycles ({data.payrollCycles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PayrollCyclesAccordion
            payrollCycles={data.payrollCycles}
            updateCycleStatusAction={updateCycleStatusAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests ({data.leaveRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveRequestsAccordion
            leaveRequests={data.leaveRequests}
            updateLeaveStatusAction={updateLeaveStatusAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Anomalies ({data.payrollAnomalies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PayrollAnomaliesAccordion
            payrollAnomalies={data.payrollAnomalies}
            updateAnomalyStatusAction={updateAnomalyStatusAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
