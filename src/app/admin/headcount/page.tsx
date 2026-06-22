import { revalidatePath } from "next/cache";
import Link from "next/link";

import { AddEmployeeStack } from "@/components/hr/add-employee-stack";
import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { EmployeeListAccordion } from "@/components/hr/employee-list-accordion";
import { KpiCard } from "@/components/hr/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, readFormRecordId, redirectWithFormSuccess, readFormSuccess } from "@/lib/hr/form-actions";
import {
  createHREmployee,
  deleteHREmployee,
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
    success?: string;
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
  redirectWithFormSuccess("/admin/headcount", "Employee created successfully.");
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
  redirectWithFormSuccess("/admin/headcount", "Employee updated successfully.");
}

async function deleteEmployeeAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/headcount");

  const employeeId = readFormRecordId(formData, "employeeId");
  if (!employeeId) {
    redirectWithFormError("/admin/headcount", "Employee ID is required.");
  }

  try {
    const deleted = await deleteHREmployee(employeeId);
    if (!deleted) {
      redirectWithFormError("/admin/headcount", "Employee not found.");
    }
  } catch (error) {
    console.error("Failed to delete employee", error);
    redirectWithFormError(
      "/admin/headcount",
      "Could not delete employee. Remove or reassign linked records, then try again."
    );
  }

  revalidatePath("/admin/headcount");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/headcount", "Employee deleted successfully.");
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
        description="Manage employee records, contracts, and status."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/imports">Import data</Link>
          </Button>
        }
      />

      <AdminFormAlert message={readFormError(params)} />
      <AdminFormAlert message={readFormSuccess(params)} variant="success" />

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

      <Card id="add-employee">
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <AddEmployeeStack
            createEmployeeAction={createEmployeeAction}
            employeeOptions={employeeOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees ({moduleData.employees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeListAccordion
            employees={moduleData.employees}
            employeeOptions={employeeOptions}
            hasActiveFilters={Boolean(
              departmentFilter || statusFilter || contractTypeFilter
            )}
            updateEmployeeAction={updateEmployeeAction}
            deleteEmployeeAction={deleteEmployeeAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
