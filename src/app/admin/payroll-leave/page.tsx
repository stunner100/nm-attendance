import { revalidatePath } from "next/cache";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
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
  searchParams: Promise<{ cycleStatus?: string; leaveStatus?: string }>;
};

async function createCycleAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const cycleMonth = String(formData.get("cycleMonth") ?? "").trim();
  const status = String(formData.get("status") ?? "pending").trim();
  const processedAt = String(formData.get("processedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!cycleMonth) {
    return;
  }
  if (!HR_PAYROLL_STATUSES.includes(status as (typeof HR_PAYROLL_STATUSES)[number])) {
    return;
  }

  await createPayrollCycle({
    cycleMonth,
    status: status as (typeof HR_PAYROLL_STATUSES)[number],
    processedAt: processedAt || undefined,
    notes: notes || undefined,
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
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
    return;
  }
  if (!["open", "resolved"].includes(status)) {
    return;
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
}

async function upsertBalanceAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const annualDays = Number(formData.get("annualDays") ?? "");
  const usedDays = Number(formData.get("usedDays") ?? "");
  const carryDays = Number(formData.get("carryDays") ?? "");

  if (!Number.isFinite(employeeId) || !Number.isFinite(annualDays)) {
    return;
  }

  await upsertLeaveBalance({
    employeeId,
    annualDays,
    usedDays: Number.isFinite(usedDays) ? usedDays : 0,
    carryDays: Number.isFinite(carryDays) ? carryDays : 0,
  });

  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
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
    return;
  }
  if (
    !HR_LEAVE_REQUEST_STATUSES.includes(
      status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
    )
  ) {
    return;
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
}

async function updateCycleStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const cycleId = Number(formData.get("cycleId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(cycleId)) {
    return;
  }
  if (!HR_PAYROLL_STATUSES.includes(status as (typeof HR_PAYROLL_STATUSES)[number])) {
    return;
  }

  await updatePayrollCycleStatus(cycleId, status as (typeof HR_PAYROLL_STATUSES)[number]);
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
}

async function updateLeaveStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const leaveRequestId = Number(formData.get("leaveRequestId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(leaveRequestId)) {
    return;
  }
  if (
    !HR_LEAVE_REQUEST_STATUSES.includes(
      status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
    )
  ) {
    return;
  }

  await updateLeaveRequestStatus(
    leaveRequestId,
    status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
  );
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
}

async function updateAnomalyStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/payroll-leave");

  const anomalyId = Number(formData.get("anomalyId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(anomalyId) || !["open", "resolved"].includes(status)) {
    return;
  }

  await updatePayrollAnomalyStatus(anomalyId, status as "open" | "resolved");
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin");
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
        title="Payroll & Leave Management"
        description="Monitor payroll cycles, anomalies, leave balances, and approvals."
      />

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
            <form action={createCycleAction} className="grid gap-3 sm:grid-cols-2">
              <Input name="cycleMonth" type="date" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="pending"
                name="status"
              >
                {HR_PAYROLL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <Input name="processedAt" type="date" />
              <Input name="notes" placeholder="Notes (optional)" />
              <div className="sm:col-span-2">
                <Button type="submit">Save Cycle</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Payroll Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAnomalyAction} className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm sm:col-span-2"
                defaultValue=""
                name="payrollCycleId"
                required
              >
                <option disabled value="">
                  Select payroll cycle
                </option>
                {payrollCycleOptions.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.cycle_month} ({humanizeLabel(cycle.status)})
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue="" name="employeeId">
                <option value="">Employee (optional)</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
              <Input name="anomalyType" placeholder="Anomaly type" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="open"
                name="status"
              >
                <option value="open">{humanizeLabel("open")}</option>
                <option value="resolved">{humanizeLabel("resolved")}</option>
              </select>
              <Input name="details" placeholder="Details" />
              <div className="sm:col-span-2">
                <Button type="submit">Save Anomaly</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={upsertBalanceAction} className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm sm:col-span-2"
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
              <Input name="annualDays" placeholder="Annual days" step="0.25" type="number" required />
              <Input name="usedDays" placeholder="Used days" step="0.25" type="number" />
              <Input name="carryDays" placeholder="Carry days" step="0.25" type="number" />
              <div className="sm:col-span-2">
                <Button type="submit">Save Balance</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createLeaveRequestAction} className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm sm:col-span-2"
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
              <Input name="leaveType" placeholder="Leave type" required />
              <Input name="days" placeholder="Days" step="0.25" type="number" required />
              <Input name="startDate" type="date" required />
              <Input name="endDate" type="date" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm sm:col-span-2"
                defaultValue="pending"
                name="status"
              >
                {HR_LEAVE_REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-2">
                <Button type="submit">Create Leave Request</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Cycles ({data.payrollCycles.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.payrollCycles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payroll cycles yet. Create one above.</p>
          ) : (
            data.payrollCycles.map((cycle) => (
              <div key={cycle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{cycle.cycle_month}</p>
                  <p className="text-xs text-muted-foreground">
                    Processed {cycle.processed_at ?? "n/a"}
                  </p>
                </div>
                <form action={updateCycleStatusAction} className="flex items-center gap-2">
                  <input name="cycleId" type="hidden" value={cycle.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={cycle.status}
                    name="status"
                  >
                    {HR_PAYROLL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={cycle.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests ({data.leaveRequests.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.leaveRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet. Create one above.</p>
          ) : (
            data.leaveRequests.map((leaveRequest) => (
              <div key={leaveRequest.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{leaveRequest.leave_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {leaveRequest.start_date} to {leaveRequest.end_date} &bull; {leaveRequest.days} day(s)
                  </p>
                </div>
                <form action={updateLeaveStatusAction} className="flex items-center gap-2">
                  <input name="leaveRequestId" type="hidden" value={leaveRequest.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={leaveRequest.status}
                    name="status"
                  >
                    {HR_LEAVE_REQUEST_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={leaveRequest.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Anomalies ({data.payrollAnomalies.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.payrollAnomalies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payroll issues yet. Report one above.</p>
          ) : (
            data.payrollAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{anomaly.anomaly_type}</p>
                  <p className="text-xs text-muted-foreground">{anomaly.details ?? "No details"}</p>
                </div>
                <form action={updateAnomalyStatusAction} className="flex items-center gap-2">
                  <input name="anomalyId" type="hidden" value={anomaly.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={anomaly.status}
                    name="status"
                  >
                    <option value="open">{humanizeLabel("open")}</option>
                    <option value="resolved">{humanizeLabel("resolved")}</option>
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={anomaly.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
