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
import { LeaveBalanceOverview } from "@/components/hr/leave-balance-overview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, redirectWithFormSuccess, readFormSuccess, buildPayrollLeavePath, readPayrollLeaveFilters, readFormRecordId } from "@/lib/hr/form-actions";
import { humanizeLabel } from "@/lib/labels";
import {
  applyTenureLeaveEntitlements,
  createLeaveRequest,
  createPayrollAnomaly,
  createPayrollCycle,
  deleteLeaveRequest,
  getPayrollLeaveModuleData,
  listEmployeeLeaveOverview,
  listHREmployeeOptions,
  listPayrollCycleOptions,
  updateLeaveRequestStatus,
  updatePayrollAnomalyStatus,
  updatePayrollCycleStatus,
  upsertLeaveBalance,
} from "@/lib/hr-db";
import { HR_LEAVE_REQUEST_CATEGORIES, HR_LEAVE_REQUEST_STATUSES, HR_PAYROLL_STATUSES } from "@/lib/types";
import type { HRLeaveRequestCategory } from "@/lib/types";

type PayrollLeavePageProps = {
  searchParams: Promise<{ cycleStatus?: string; leaveStatus?: string; error?: string; success?: string }>;
};

function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

function resolveLeaveDays(
  startDate: string,
  endDate: string,
  daysInput: string
): number | null {
  const computedDays = daysBetweenInclusive(startDate, endDate);
  if (computedDays <= 0) {
    return null;
  }

  const trimmedDays = daysInput.trim();
  if (!trimmedDays) {
    return computedDays;
  }

  const days = Number(trimmedDays);
  if (!Number.isFinite(days) || days <= 0 || days !== computedDays) {
    return null;
  }

  return days;
}

async function createCycleAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const cycleMonth = String(formData.get("cycleMonth") ?? "").trim();
  const status = String(formData.get("status") ?? "pending").trim();
  const processedAt = String(formData.get("processedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!cycleMonth) {
    redirectWithFormError(redirectPath, "Payroll cycle month is required.");
  }
  if (!HR_PAYROLL_STATUSES.includes(status as (typeof HR_PAYROLL_STATUSES)[number])) {
    redirectWithFormError(redirectPath, "Select a valid payroll cycle status.");
  }

  await createPayrollCycle({
    cycleMonth,
    status: status as (typeof HR_PAYROLL_STATUSES)[number],
    processedAt: processedAt || undefined,
    notes: notes || undefined,
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Payroll cycle created successfully.");
}

async function createAnomalyAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const payrollCycleId = Number(formData.get("payrollCycleId") ?? "");
  const employeeId = Number(formData.get("employeeId") ?? "");
  const anomalyType = String(formData.get("anomalyType") ?? "").trim();
  const status = String(formData.get("status") ?? "open").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!Number.isFinite(payrollCycleId) || !anomalyType) {
    redirectWithFormError(redirectPath, "Payroll cycle and anomaly type are required.");
  }
  if (!["open", "resolved"].includes(status)) {
    redirectWithFormError(redirectPath, "Select a valid anomaly status.");
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
  redirectWithFormSuccess(redirectPath, "Payroll anomaly reported successfully.");
}

async function upsertBalanceAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const employeeId = Number(formData.get("employeeId") ?? "");
  const annualDays = Number(formData.get("annualDays") ?? "");
  const usedDays = Number(formData.get("usedDays") ?? "");
  const carryDays = Number(formData.get("carryDays") ?? "");

  if (!Number.isFinite(employeeId) || !Number.isFinite(annualDays)) {
    redirectWithFormError(redirectPath, "Employee and annual leave days are required.");
  }

  const usedDaysValue = Number.isFinite(usedDays) ? usedDays : 0;
  const carryDaysValue = Number.isFinite(carryDays) ? carryDays : 0;

  if (annualDays < 0 || usedDaysValue < 0 || carryDaysValue < 0) {
    redirectWithFormError(redirectPath, "Leave days cannot be negative.");
  }

  await upsertLeaveBalance({
    employeeId,
    annualDays,
    usedDays: usedDaysValue,
    carryDays: carryDaysValue,
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Leave balance updated successfully.");
}

async function createLeaveRequestAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const employeeId = Number(formData.get("employeeId") ?? "");
  const requestCategory = String(formData.get("requestCategory") ?? "leave").trim();
  const leaveType = String(formData.get("leaveType") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const daysInput = String(formData.get("days") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isFinite(employeeId) || !leaveType || !startDate || !endDate || !reason) {
    redirectWithFormError(redirectPath, "Complete all leave request fields.");
  }
  if (
    !HR_LEAVE_REQUEST_CATEGORIES.includes(requestCategory as HRLeaveRequestCategory)
  ) {
    redirectWithFormError(redirectPath, "Select a valid request category.");
  }

  const isLateArrival = requestCategory === "late_arrival";
  const days = isLateArrival
    ? 0.25
    : resolveLeaveDays(startDate, endDate, daysInput);

  if (!isLateArrival && days === null) {
    const computedDays = daysBetweenInclusive(startDate, endDate);
    if (computedDays <= 0) {
      redirectWithFormError(redirectPath, "End date must be on or after start date.");
    }
    redirectWithFormError(redirectPath, "Days must match the selected date range.");
  }

  await createLeaveRequest({
    employeeId,
    leaveType: isLateArrival ? "Late arrival" : leaveType,
    requestCategory: requestCategory as HRLeaveRequestCategory,
    startDate,
    endDate: isLateArrival ? startDate : endDate,
    days: days ?? 0.25,
    status: "pending",
    reason,
    source: "admin",
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Leave request created successfully.");
}

async function updateCycleStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const cycleId = Number(formData.get("cycleId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(cycleId)) {
    redirectWithFormError(redirectPath, "Payroll cycle ID is required.");
  }
  if (!HR_PAYROLL_STATUSES.includes(status as (typeof HR_PAYROLL_STATUSES)[number])) {
    redirectWithFormError(redirectPath, "Select a valid payroll cycle status.");
  }

  await updatePayrollCycleStatus(cycleId, status as (typeof HR_PAYROLL_STATUSES)[number]);
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Payroll cycle status updated successfully.");
}

async function updateLeaveStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const leaveRequestId = Number(formData.get("leaveRequestId") ?? "");
  const intent = String(formData.get("intent") ?? "").trim();
  const selectedStatus = String(formData.get("status") ?? "").trim();
  const status =
    intent === "approve" ? "approved" : intent === "reopen" ? "pending" : selectedStatus;
  const reviewerNote = String(formData.get("reviewerNote") ?? "").trim();

  if (!Number.isFinite(leaveRequestId)) {
    redirectWithFormError(redirectPath, "Leave request ID is required.");
  }
  if (
    !HR_LEAVE_REQUEST_STATUSES.includes(
      status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
    )
  ) {
    redirectWithFormError(redirectPath, "Select a valid leave request status.");
  }

  await updateLeaveRequestStatus(
    leaveRequestId,
    status as (typeof HR_LEAVE_REQUEST_STATUSES)[number],
    reviewerNote || undefined
  );
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin/attendance");
  revalidatePath("/staff/leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Leave request status updated successfully.");
}

async function deleteLeaveRequestAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const leaveRequestId = readFormRecordId(formData, "leaveRequestId");
  if (!leaveRequestId) {
    redirectWithFormError(redirectPath, "Leave request ID is required.");
  }

  const deleted = await deleteLeaveRequest(leaveRequestId);
  if (!deleted) {
    redirectWithFormError(redirectPath, "Leave request not found.");
  }

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin/attendance");
  revalidatePath("/staff/leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Leave request deleted successfully.");
}

async function applyAllTenureEntitlementsAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const updated = await applyTenureLeaveEntitlements();
  if (updated === 0) {
    redirectWithFormError(redirectPath, "No active employees to update.");
  }

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(
    redirectPath,
    `Tenure entitlements applied for ${updated} employee${updated === 1 ? "" : "s"}.`
  );
}

async function applyTenureEntitlementAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const employeeId = readFormRecordId(formData, "employeeId");
  if (!employeeId) {
    redirectWithFormError(redirectPath, "Employee ID is required.");
  }

  const updated = await applyTenureLeaveEntitlements({ employeeId });
  if (updated === 0) {
    redirectWithFormError(redirectPath, "Employee not found or not active.");
  }

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Tenure entitlement applied for this employee.");
}

async function updateAnomalyStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const filters = readPayrollLeaveFilters(formData);
  const redirectPath = buildPayrollLeavePath(filters);

  const anomalyId = Number(formData.get("anomalyId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(anomalyId) || !["open", "resolved"].includes(status)) {
    redirectWithFormError(redirectPath, "Valid anomaly ID and status are required.");
  }

  await updatePayrollAnomalyStatus(anomalyId, status as "open" | "resolved");
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
  redirectWithFormSuccess(redirectPath, "Payroll anomaly status updated successfully.");
}

export default async function PayrollLeavePage({ searchParams }: PayrollLeavePageProps) {
  const params = await searchParams;

  const cycleStatusFilter = params.cycleStatus?.trim() || "";
  const leaveStatusFilter = params.leaveStatus?.trim() || "";

  const [data, employees, payrollCycleOptions, leaveOverview] = await Promise.all([
    getPayrollLeaveModuleData({
      cycleStatus: cycleStatusFilter,
      leaveStatus: leaveStatusFilter,
    }),
    listHREmployeeOptions({ activeOnly: true }),
    listPayrollCycleOptions(),
    listEmployeeLeaveOverview(),
  ]);

  const filterProps = {
    cycleStatus: cycleStatusFilter,
    leaveStatus: leaveStatusFilter,
  };
  const sortedLeaveRequests = [...data.leaveRequests].sort((left, right) => {
    const leftPending = left.status === "pending" ? 0 : 1;
    const rightPending = right.status === "pending" ? 0 : 1;
    if (leftPending !== rightPending) {
      return leftPending - rightPending;
    }
    return new Date(right.requested_at).getTime() - new Date(left.requested_at).getTime();
  });
  const pendingLeaveCount = data.leaveRequests.filter((request) => request.status === "pending").length;

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="See each employee's leave balance, tenure-based entitlement, and remaining days. Review requests and payroll cycles below."
      />

      <AdminFormAlert message={readFormError(params)} />
      <AdminFormAlert message={readFormSuccess(params)} variant="success" />

      <Card>
        <CardHeader>
          <CardTitle>Employee leave overview</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveBalanceOverview
            {...filterProps}
            applyAllTenureEntitlementsAction={applyAllTenureEntitlementsAction}
            applyTenureEntitlementAction={applyTenureEntitlementAction}
            rows={leaveOverview}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Leave Requests ({data.leaveRequests.length})
            {pendingLeaveCount > 0 ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {pendingLeaveCount} pending approval
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveRequestsAccordion
            {...filterProps}
            deleteLeaveRequestAction={deleteLeaveRequestAction}
            employeeOptions={employees}
            leaveRequests={sortedLeaveRequests}
            updateLeaveStatusAction={updateLeaveStatusAction}
          />
        </CardContent>
      </Card>

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
            <CreatePayrollCycleStack
              {...filterProps}
              createCycleAction={createCycleAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Payroll Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePayrollAnomalyStack
              {...filterProps}
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
              {...filterProps}
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
              {...filterProps}
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
            {...filterProps}
            payrollCycles={data.payrollCycles}
            updateCycleStatusAction={updateCycleStatusAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Anomalies ({data.payrollAnomalies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PayrollAnomaliesAccordion
            {...filterProps}
            employeeOptions={employees}
            payrollCycleOptions={payrollCycleOptions}
            payrollAnomalies={data.payrollAnomalies}
            updateAnomalyStatusAction={updateAnomalyStatusAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
