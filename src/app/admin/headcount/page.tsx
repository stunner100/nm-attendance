import { revalidatePath } from "next/cache";
import Link from "next/link";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { KpiCard } from "@/components/hr/kpi-card";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  createHREmployee,
  getHeadcountModuleData,
  listHREmployeeOptions,
  updateHREmployeeStatus,
} from "@/lib/hr-db";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_EMPLOYMENT_STATUSES,
  HR_EXIT_TYPES,
} from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type HeadcountPageProps = {
  searchParams: Promise<{ department?: string; status?: string; contractType?: string }>;
};

async function createEmployeeAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/headcount");

  const employeeCode = String(formData.get("employeeCode") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const workEmail = String(formData.get("workEmail") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const contractType = String(formData.get("contractType") ?? "").trim();
  const employmentStatus = String(formData.get("employmentStatus") ?? "active").trim();
  const managerEmployeeIdRaw = Number(formData.get("managerEmployeeId") ?? "");
  const hireDate = String(formData.get("hireDate") ?? "").trim();
  const probationEndDate = String(formData.get("probationEndDate") ?? "").trim();
  const contractEndDate = String(formData.get("contractEndDate") ?? "").trim();

  if (!fullName) {
    return;
  }
  if (!HR_DEPARTMENTS.includes(department as (typeof HR_DEPARTMENTS)[number])) {
    return;
  }
  if (
    !HR_CONTRACT_TYPES.includes(
      contractType as (typeof HR_CONTRACT_TYPES)[number]
    )
  ) {
    return;
  }
  if (
    !HR_EMPLOYMENT_STATUSES.includes(
      employmentStatus as (typeof HR_EMPLOYMENT_STATUSES)[number]
    )
  ) {
    return;
  }

  await createHREmployee({
    employeeCode: employeeCode || null,
    fullName,
    workEmail: workEmail || null,
    department: department as (typeof HR_DEPARTMENTS)[number],
    contractType: contractType as (typeof HR_CONTRACT_TYPES)[number],
    employmentStatus: employmentStatus as (typeof HR_EMPLOYMENT_STATUSES)[number],
    managerEmployeeId:
      Number.isFinite(managerEmployeeIdRaw) && managerEmployeeIdRaw > 0
        ? managerEmployeeIdRaw
        : null,
    hireDate: hireDate || null,
    probationEndDate: probationEndDate || null,
    contractEndDate: contractEndDate || null,
  });

  revalidatePath("/admin/headcount");
  revalidatePath("/admin");
}

async function updateEmployeeStatusAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/headcount");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const exitType = String(formData.get("exitType") ?? "").trim();
  const exitDate = String(formData.get("exitDate") ?? "").trim();

  if (!Number.isFinite(employeeId)) {
    return;
  }
  if (!HR_EMPLOYMENT_STATUSES.includes(status as (typeof HR_EMPLOYMENT_STATUSES)[number])) {
    return;
  }

  await updateHREmployeeStatus(employeeId, status as (typeof HR_EMPLOYMENT_STATUSES)[number], {
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
            <Input name="hireDate" type="date" />
            <Input name="probationEndDate" type="date" />
            <Input name="contractEndDate" type="date" />
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
                <div>
                  <p className="text-sm font-medium">
                    {employee.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {employee.department} &bull; {humanizeLabel(employee.contract_type)} &bull; Hired{" "}
                    {employee.hire_date}
                  </p>
                </div>

                <form action={updateEmployeeStatusAction} className="flex flex-wrap items-center gap-2">
                  <input name="employeeId" type="hidden" value={employee.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={employee.employment_status}
                    name="status"
                  >
                    {HR_EMPLOYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
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
                  <Input className="h-8 w-36 text-xs" name="exitDate" type="date" />
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={employee.employment_status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
