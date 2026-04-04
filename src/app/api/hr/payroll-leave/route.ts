import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import {
  createLeaveRequest,
  createPayrollAnomaly,
  createPayrollCycle,
  getPayrollLeaveModuleData,
  updateLeaveRequestStatus,
  updatePayrollAnomalyStatus,
  updatePayrollCycleStatus,
  upsertLeaveBalance,
} from "@/lib/hr-db";
import { HR_LEAVE_REQUEST_STATUSES, HR_PAYROLL_STATUSES } from "@/lib/types";

type PayrollLeavePayload = {
  entity?: unknown;
  cycleMonth?: unknown;
  status?: unknown;
  processedAt?: unknown;
  notes?: unknown;
  cycleId?: unknown;
  payrollCycleId?: unknown;
  anomalyId?: unknown;
  employeeId?: unknown;
  anomalyType?: unknown;
  details?: unknown;
  annualDays?: unknown;
  usedDays?: unknown;
  carryDays?: unknown;
  leaveRequestId?: unknown;
  leaveType?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  days?: unknown;
};

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  try {
    const data = await getPayrollLeaveModuleData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load payroll/leave data", error);
    return NextResponse.json(
      { error: "Failed to load payroll/leave data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: PayrollLeavePayload;
  try {
    payload = (await request.json()) as PayrollLeavePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "payroll_cycle") {
      if (typeof payload.cycleMonth !== "string") {
        return NextResponse.json({ error: "cycleMonth is required." }, { status: 400 });
      }
      const cycle = await createPayrollCycle({
        cycleMonth: payload.cycleMonth,
        status:
          typeof payload.status === "string"
            ? (payload.status as (typeof HR_PAYROLL_STATUSES)[number])
            : "pending",
        processedAt:
          typeof payload.processedAt === "string" ? payload.processedAt : undefined,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
      });
      return NextResponse.json({ cycle }, { status: 201 });
    }

    if (entity === "payroll_anomaly") {
      if (
        typeof payload.payrollCycleId !== "number" ||
        typeof payload.anomalyType !== "string"
      ) {
        return NextResponse.json(
          { error: "payrollCycleId and anomalyType are required." },
          { status: 400 }
        );
      }
      const anomaly = await createPayrollAnomaly({
        payrollCycleId: payload.payrollCycleId,
        employeeId: typeof payload.employeeId === "number" ? payload.employeeId : null,
        anomalyType: payload.anomalyType,
        status:
          typeof payload.status === "string"
            ? (payload.status as "open" | "resolved")
            : "open",
        details: typeof payload.details === "string" ? payload.details : undefined,
      });
      return NextResponse.json({ anomaly }, { status: 201 });
    }

    if (entity === "leave_balance") {
      if (typeof payload.employeeId !== "number" || typeof payload.annualDays !== "number") {
        return NextResponse.json(
          { error: "employeeId and annualDays are required." },
          { status: 400 }
        );
      }
      const balance = await upsertLeaveBalance({
        employeeId: payload.employeeId,
        annualDays: payload.annualDays,
        usedDays: typeof payload.usedDays === "number" ? payload.usedDays : 0,
        carryDays: typeof payload.carryDays === "number" ? payload.carryDays : 0,
      });
      return NextResponse.json({ balance }, { status: 201 });
    }

    if (entity === "leave_request") {
      if (
        typeof payload.employeeId !== "number" ||
        typeof payload.leaveType !== "string" ||
        typeof payload.startDate !== "string" ||
        typeof payload.endDate !== "string" ||
        typeof payload.days !== "number"
      ) {
        return NextResponse.json(
          { error: "employeeId, leaveType, startDate, endDate, and days are required." },
          { status: 400 }
        );
      }

      const leaveRequest = await createLeaveRequest({
        employeeId: payload.employeeId,
        leaveType: payload.leaveType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        days: payload.days,
        status:
          typeof payload.status === "string"
            ? (payload.status as (typeof HR_LEAVE_REQUEST_STATUSES)[number])
            : "pending",
      });
      return NextResponse.json({ leaveRequest }, { status: 201 });
    }

    return NextResponse.json(
      {
        error:
          "entity must be payroll_cycle, payroll_anomaly, leave_balance, or leave_request.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to create payroll/leave entity", error);
    return NextResponse.json(
      { error: "Failed to create payroll/leave entity." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: PayrollLeavePayload;
  try {
    payload = (await request.json()) as PayrollLeavePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "payroll_cycle_status") {
      if (
        typeof payload.cycleId !== "number" ||
        typeof payload.status !== "string" ||
        !HR_PAYROLL_STATUSES.includes(
          payload.status as (typeof HR_PAYROLL_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          { error: "cycleId and valid status are required." },
          { status: 400 }
        );
      }

      const cycle = await updatePayrollCycleStatus(
        payload.cycleId,
        payload.status as (typeof HR_PAYROLL_STATUSES)[number]
      );
      if (!cycle) {
        return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
      }
      return NextResponse.json({ cycle });
    }

    if (entity === "leave_request_status") {
      if (
        typeof payload.leaveRequestId !== "number" ||
        typeof payload.status !== "string" ||
        !HR_LEAVE_REQUEST_STATUSES.includes(
          payload.status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          { error: "leaveRequestId and valid status are required." },
          { status: 400 }
        );
      }
      const leaveRequest = await updateLeaveRequestStatus(
        payload.leaveRequestId,
        payload.status as (typeof HR_LEAVE_REQUEST_STATUSES)[number]
      );
      if (!leaveRequest) {
        return NextResponse.json(
          { error: "Leave request not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ leaveRequest });
    }

    if (entity === "payroll_anomaly_status") {
      if (
        typeof payload.anomalyId !== "number" ||
        typeof payload.status !== "string" ||
        !["open", "resolved"].includes(payload.status)
      ) {
        return NextResponse.json(
          { error: "anomalyId and valid status are required." },
          { status: 400 }
        );
      }
      const anomaly = await updatePayrollAnomalyStatus(
        payload.anomalyId,
        payload.status as "open" | "resolved"
      );
      if (!anomaly) {
        return NextResponse.json({ error: "Anomaly not found." }, { status: 404 });
      }
      return NextResponse.json({ anomaly });
    }

    return NextResponse.json(
      {
        error:
          "entity must be payroll_cycle_status, leave_request_status, or payroll_anomaly_status.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update payroll/leave entity", error);
    return NextResponse.json(
      { error: "Failed to update payroll/leave entity." },
      { status: 500 }
    );
  }
}
