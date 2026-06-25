import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { createHREmployee, listHREmployees, updateHREmployeeStatus } from "@/lib/hr-db";
import { HR_EMPLOYMENT_STATUSES, HR_EXIT_TYPES, HR_WORK_MODES } from "@/lib/types";

type EmployeePayload = {
  employeeCode?: unknown;
  fullName?: unknown;
  workEmail?: unknown;
  department?: unknown;
  contractType?: unknown;
  workMode?: unknown;
  employmentStatus?: unknown;
  managerEmployeeId?: unknown;
  hireDate?: unknown;
  probationEndDate?: unknown;
  contractEndDate?: unknown;
  exitDate?: unknown;
  exitType?: unknown;
  jobTitle?: unknown;
  employeeId?: unknown;
  status?: unknown;
};

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  try {
    const employees = await listHREmployees();
    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Failed to load HR employees", error);
    return NextResponse.json(
      { error: "Failed to load HR employees." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: EmployeePayload;
  try {
    payload = (await request.json()) as EmployeePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof payload.fullName !== "string" || !payload.fullName.trim()) {
    return NextResponse.json({ error: "fullName is required." }, { status: 400 });
  }

  if (typeof payload.department !== "string" || !payload.department.trim()) {
    return NextResponse.json({ error: "department is required." }, { status: 400 });
  }

  if (typeof payload.contractType !== "string" || !payload.contractType.trim()) {
    return NextResponse.json({ error: "contractType is required." }, { status: 400 });
  }

  try {
    const employee = await createHREmployee({
      employeeCode: typeof payload.employeeCode === "string" ? payload.employeeCode : null,
      fullName: payload.fullName,
      workEmail: typeof payload.workEmail === "string" ? payload.workEmail : null,
      department: payload.department as
        | "Operations"
        | "Product"
        | "Marketing"
        | "Tech"
        | "Finance & Compliance"
        | "HR & Admin",
      contractType: payload.contractType as
        | "full_time"
        | "part_time"
        | "intern"
        | "contractor",
      workMode:
        typeof payload.workMode === "string" &&
        HR_WORK_MODES.includes(payload.workMode as (typeof HR_WORK_MODES)[number])
          ? (payload.workMode as "onsite" | "hybrid" | "remote")
          : "onsite",
      employmentStatus:
        typeof payload.employmentStatus === "string"
          ? (payload.employmentStatus as
              | "active"
              | "inactive"
              | "terminated"
              | "resigned")
          : "active",
      managerEmployeeId:
        typeof payload.managerEmployeeId === "number" ? payload.managerEmployeeId : null,
      hireDate: typeof payload.hireDate === "string" ? payload.hireDate : null,
      probationEndDate:
        typeof payload.probationEndDate === "string"
          ? payload.probationEndDate
          : null,
      contractEndDate:
        typeof payload.contractEndDate === "string" ? payload.contractEndDate : null,
      exitDate: typeof payload.exitDate === "string" ? payload.exitDate : null,
      jobTitle: typeof payload.jobTitle === "string" ? payload.jobTitle : null,
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Failed to create HR employee", error);
    return NextResponse.json(
      { error: "Failed to create HR employee." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: EmployeePayload;
  try {
    payload = (await request.json()) as EmployeePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const employeeId =
    typeof payload.employeeId === "number" ? payload.employeeId : Number.NaN;
  const status = typeof payload.status === "string" ? payload.status : "";

  if (!Number.isFinite(employeeId)) {
    return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
  }

  if (!HR_EMPLOYMENT_STATUSES.includes(status as (typeof HR_EMPLOYMENT_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const exitType =
    typeof payload.exitType === "string" &&
    HR_EXIT_TYPES.includes(payload.exitType as (typeof HR_EXIT_TYPES)[number])
      ? payload.exitType
      : null;

  try {
    const employee = await updateHREmployeeStatus(employeeId, status as (typeof HR_EMPLOYMENT_STATUSES)[number], {
      exitType: exitType as "voluntary" | "involuntary" | null,
      exitDate: typeof payload.exitDate === "string" ? payload.exitDate : null,
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Failed to update HR employee status", error);
    return NextResponse.json(
      { error: "Failed to update HR employee status." },
      { status: 500 }
    );
  }
}
