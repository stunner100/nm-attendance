import { revalidatePath } from "next/cache";
import Link from "next/link";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { KpiCard } from "@/components/hr/kpi-card";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  createHREmployee,
  getHeadcountModuleData,
  listHREmployeeOptions,
  updateHREmployee,
} from "@/lib/hr-db";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_EMPLOYMENT_STATUSES,
  HR_EXIT_TYPES,
  HR_WORK_MODES,
} from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type HeadcountPageProps = {
  searchParams: Promise<{
    department?: string;
    status?: string;
    contractType?: string;
    error?: string;
  }>;
};

async function createEmployeeAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/headcount");

  const employeeCode = String(formData.get("employeeCode") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const workEmail = String(formData.get("workEmail") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const contractType = String(formData.get("contractType") ?? "").trim();
  const workMode = String(formData.get("workMode") ?? "onsite").trim();
  const employmentStatus = String(formData.get("employmentStatus") ?? "active").trim();
  const managerEmployeeIdRaw = Number(formData.get("managerEmployeeId") ?? "");
  const contractStartDate = String(formData.get("contractStartDate") ?? "").trim();
  const contractEndDate = String(formData.get("contractEndDate") ?? "").trim();

  if (!fullName) {
    redirectWithFormError("/admin/headcount", "Full name is required.");
  }
  if (!HR_DEPARTMENTS.includes(department as (typeof HR_DEPARTMENTS)[number])) {
    redirectWithFormError("/admin/headcount", "Select a valid department.");
  }
  if (
    !HR_CONTRACT_TYPES.includes(
      contractType as (typeof HR_CONTRACT_TYPES)[number]
    )
  ) {
    redirectWithFormError("/admin/headcount", "Select a valid contract type.");
  }
  if (
    !HR_EMPLOYMENT_STATUSES.includes(
      employmentStatus as (typeof HR_EMPLOYMENT_STATUSES)[number]
    )
  ) {
    redirectWithFormError("/admin/headcount", "Select a valid employment status.");
  }
  if (!HR_WORK_MODES.includes(workMode as (typeof HR_WORK_MODES)[number])) {
    redirectWithFormError("/admin/headcount", "Select a valid work mode.");
  }

  await createHREmployee({
    employeeCode: employeeCode || null,
    fullName,
    workEmail: workEmail || null,
    department: department as (typeof HR_DEPARTMENTS)[number],
    contractType: contractType as (typeof HR_CONTRACT_TYPES)[number],
    workMode: workMode as (typeof HR_WORK_MODES)[number],
    employmentStatus: employmentStatus as (typeof HR_EMPLOYMENT_STATUSES)[number],
    managerEmployeeId:
      Number.isFinite(managerEmployeeIdRaw) && managerEmployeeIdRaw > 0
        ? managerEmployeeIdRaw
        : null,
    hireDate: contractStartDate || null,
    contractEndDate: contractEndDate || null,
  });

  revalidatePath("/admin/headcount");
  revalidatePath("/admin");
}

async function updateEmployeeAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/headcount");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const employeeCode = String(formData.get("employeeCode") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const workEmail = String(formData.get("workEmail") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const contractType = String(formData.get("contractType") ?? "").trim();
  const workMode = String(formData.get("workMode") ?? "onsite").trim();
  const employmentStatus = String(formData.get("employmentStatus") ?? "active").trim();
  const managerEmployeeIdRaw = Number(formData.get("managerEmployeeId") ?? "");
  const contractStartDate = String(formData.get("contractStartDate") ?? "").trim();
  const contractEndDate = String(formData.get("contractEndDate") ?? "").trim();
  const exitType = String(formData.get("exitType") ?? "").trim();
  const exitDate = String(formData.get("exitDate") ?? "").trim();

  if (!Number.isFinite(employeeId) || employeeId <= 0 || !fullName) {
    redirectWithFormError("/admin/headcount", "Employee ID and full name are required.");
  }
  if (!HR_DEPARTMENTS.includes(department as (typeof HR_DEPARTMENTS)[number])) {
    redirectWithFormError("/admin/headcount", "Select a valid department.");
  }
  if (!HR_CONTRACT_TYPES.includes(contractType as (typeof HR_CONTRACT_TYPES)[number])) {
    redirectWithFormError("/admin/headcount", "Select a valid contract type.");
  }
  if (!HR_WORK_MODES.includes(workMode as (typeof HR_WORK_MODES)[number])) {
    redirectWithFormError("/admin/headcount", "Select a valid work mode.");
  }
  if (
    !HR_EMPLOYMENT_STATUSES.includes(
      employmentStatus as (typeof HR_EMPLOYMENT_STATUSES)[number]
    )
  ) {
    redirectWithFormError("/admin/headcount", "Select a valid employment status.");
  }

  const managerEmployeeId =
    Number.isFinite(managerEmployeeIdRaw) &&
    managerEmployeeIdRaw > 0 &&
    managerEmployeeIdRaw !== employeeId
      ? managerEmployeeIdRaw
      : null;

  await updateHREmployee(employeeId, {
    employeeCode: employeeCode || null,
    fullName,
    workEmail: workEmail || null,
    department: department as (typeof HR_DEPARTMENTS)[number],
    contractType: contractType as (typeof HR_CONTRACT_TYPES)[number],
    workMode: workMode as (typeof HR_WORK_MODES)[number],
    employmentStatus: employmentStatus as (typeof HR_EMPLOYMENT_STATUSES)[number],
    managerEmployeeId,
    hireDate: contractStartDate || null,
    contractEndDate: contractEndDate || null,
    exitType: HR_EXIT_TYPES.includes(exitType as (typeof HR_EXIT_TYPES)[number])
      ? (exitType as (typeof HR_EXIT_TYPES)[number])
      : null,
    exitDate: exitDate || null,
  });

  revalidatePath("/admin/headcount");
  revalidatePath("/admin");
}

export default async function HeadcountPage({ searchParams }: HeadcountPageProps) {
  const params = await searchParams;

  const departmentFilter = params.department?.trim() || "";
  const statusFilter = params.status?.trim() || "";
  const contractTypeFilter = params.contractType?.trim() || "";

  const [moduleData, employeeOptions] = await Promise.all([
    getHeadcountModuleData({
      department: departmentFilter,
      status: statusFilter,
      contractType: contractTypeFilter,
    }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Employee Directory"
        description="Manage employee records, contracts, and status."
        actions={
          <Link
            href="/admin/imports"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Import data
          </Link>
        }
      />

      <AdminFormAlert message={readFormError(params)} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Active" value={`${moduleData.totalActive}`} />
        <KpiCard label="New Hires (Month)" value={`${moduleData.newHiresMonth}`} />
        <KpiCard
          label="New Hires (Quarter)"
          value={`${moduleData.newHiresQuarter}`}
        />
        <KpiCard
          label="Attrition (Quarter)"
          value={`${moduleData.attritionRate.toFixed(1)}%`}
          hint={`Voluntary ${moduleData.exitsVoluntary} • Involuntary ${moduleData.exitsInvoluntary}`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-4" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Department</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={departmentFilter}
                name="department"
              >
                <option value="">All departments</option>
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
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
                <option value="">All statuses</option>
                {HR_EMPLOYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Contract</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={contractTypeFilter}
                name="contractType"
              >
                <option value="">All contracts</option>
                {HR_CONTRACT_TYPES.map((contractType) => (
                  <option key={contractType} value={contractType}>
                    {humanizeLabel(contractType)}
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
          <CardTitle>Add Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEmployeeAction} className="grid gap-3 sm:grid-cols-3">
            <Input name="employeeCode" placeholder="Employee code (optional)" />
            <Input name="fullName" placeholder="Full name" required />
            <Input name="workEmail" placeholder="Work email" type="email" />
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue="Tech"
              name="department"
              required
            >
              {HR_DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue="full_time"
              name="contractType"
              required
            >
              {HR_CONTRACT_TYPES.map((contractType) => (
                <option key={contractType} value={contractType}>
                  {humanizeLabel(contractType)}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue="active"
              name="employmentStatus"
            >
              {HR_EMPLOYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeLabel(status)}
                </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="onsite"
                name="workMode"
              >
                {HR_WORK_MODES.map((workMode) => (
                  <option key={workMode} value={workMode}>
                    {humanizeLabel(workMode)}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue=""
                name="managerEmployeeId"
              >
              <option value="">No manager</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_code})
                </option>
              ))}
            </select>
            <label className="space-y-1 text-sm">
              <span className="block text-xs text-muted-foreground">Contract start date</span>
              <Input name="contractStartDate" type="date" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block text-xs text-muted-foreground">Contract end date</span>
              <Input name="contractEndDate" type="date" />
            </label>
            <p className="sm:col-span-3 -mt-1 text-xs text-muted-foreground">
              Contract end date is optional for permanent (full-time) employees.
            </p>
            <div className="sm:col-span-3">
              <Button type="submit">Add Employee</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees ({moduleData.employees.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {moduleData.employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No employees found. Add your first employee above.
            </p>
          ) : (
            moduleData.employees.map((employee) => (
              <div
                key={employee.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <form action={updateEmployeeAction} className="grid w-full gap-2 sm:grid-cols-4">
                  <input name="employeeId" type="hidden" value={employee.id} />
                  <Input
                    className="h-8 text-xs"
                    defaultValue={employee.employee_code}
                    name="employeeCode"
                    placeholder="Employee code"
                  />
                  <Input
                    className="h-8 text-xs"
                    defaultValue={employee.full_name}
                    name="fullName"
                    placeholder="Full name"
                    required
                  />
                  <Input
                    className="h-8 text-xs"
                    defaultValue={employee.work_email ?? ""}
                    name="workEmail"
                    placeholder="Work email"
                    type="email"
                  />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={employee.department}
                    name="department"
                  >
                    {HR_DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={employee.contract_type}
                    name="contractType"
                  >
                    {HR_CONTRACT_TYPES.map((contractType) => (
                      <option key={contractType} value={contractType}>
                        {humanizeLabel(contractType)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={employee.work_mode}
                    name="workMode"
                  >
                    {HR_WORK_MODES.map((workMode) => (
                      <option key={workMode} value={workMode}>
                        {humanizeLabel(workMode)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={employee.employment_status}
                    name="employmentStatus"
                  >
                    {HR_EMPLOYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={employee.manager_employee_id ?? ""}
                    name="managerEmployeeId"
                  >
                    <option value="">No manager</option>
                    {employeeOptions
                      .filter((managerOption) => managerOption.id !== employee.id)
                      .map((managerOption) => (
                        <option key={managerOption.id} value={managerOption.id}>
                          {managerOption.full_name} ({managerOption.employee_code})
                        </option>
                      ))}
                  </select>
                  <label className="space-y-1 text-xs">
                    <span className="text-muted-foreground">Contract start</span>
                    <Input
                      className="h-8 text-xs"
                      defaultValue={employee.hire_date}
                      name="contractStartDate"
                      type="date"
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-muted-foreground">Contract end</span>
                    <Input
                      className="h-8 text-xs"
                      defaultValue={employee.contract_end_date ?? ""}
                      name="contractEndDate"
                      type="date"
                    />
                  </label>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={employee.exit_type ?? ""}
                    name="exitType"
                  >
                    <option value="">No exit type</option>
                    {HR_EXIT_TYPES.map((exitType) => (
                      <option key={exitType} value={exitType}>
                        {humanizeLabel(exitType)}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="h-8 text-xs"
                    defaultValue={employee.exit_date ?? ""}
                    name="exitDate"
                    type="date"
                  />
                  <div className="sm:col-span-4 flex flex-wrap items-center gap-2">
                    <Button size="sm" type="submit" variant="outline">
                      Save details
                    </Button>
                    <StatusBadge status={employee.employment_status} />
                  </div>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
