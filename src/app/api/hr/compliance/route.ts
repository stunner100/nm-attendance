import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import {
  createDisciplinaryCase,
  createFollowupAction,
  createPolicyViolation,
  getComplianceModuleData,
  updateDisciplinaryCaseStatus,
  updateFollowupActionStatus,
} from "@/lib/hr-db";
import { HR_DISCIPLINARY_STATUSES } from "@/lib/types";

type CompliancePayload = {
  entity?: unknown;
  employeeId?: unknown;
  category?: unknown;
  status?: unknown;
  summary?: unknown;
  openedAt?: unknown;
  dueDate?: unknown;
  severity?: unknown;
  notes?: unknown;
  occurredOn?: unknown;
  actionType?: unknown;
  caseId?: unknown;
  actionId?: unknown;
};

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  try {
    const data = await getComplianceModuleData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load compliance module data", error);
    return NextResponse.json(
      { error: "Failed to load compliance module data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: CompliancePayload;
  try {
    payload = (await request.json()) as CompliancePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "case") {
      if (
        typeof payload.category !== "string" ||
        typeof payload.summary !== "string" ||
        typeof payload.status !== "string"
      ) {
        return NextResponse.json(
          { error: "category, summary, and status are required." },
          { status: 400 }
        );
      }

      const disciplinaryCase = await createDisciplinaryCase({
        employeeId: typeof payload.employeeId === "number" ? payload.employeeId : null,
        category: payload.category,
        status: payload.status as (typeof HR_DISCIPLINARY_STATUSES)[number],
        summary: payload.summary,
        openedAt: typeof payload.openedAt === "string" ? payload.openedAt : undefined,
        dueDate: typeof payload.dueDate === "string" ? payload.dueDate : undefined,
      });
      return NextResponse.json({ disciplinaryCase }, { status: 201 });
    }

    if (entity === "violation") {
      if (
        typeof payload.category !== "string" ||
        typeof payload.severity !== "string"
      ) {
        return NextResponse.json(
          { error: "category and severity are required." },
          { status: 400 }
        );
      }

      if (!["low", "medium", "high"].includes(payload.severity)) {
        return NextResponse.json({ error: "Invalid severity." }, { status: 400 });
      }

      const violation = await createPolicyViolation({
        employeeId: typeof payload.employeeId === "number" ? payload.employeeId : null,
        category: payload.category,
        severity: payload.severity as "low" | "medium" | "high",
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
        occurredOn:
          typeof payload.occurredOn === "string" ? payload.occurredOn : undefined,
      });
      return NextResponse.json({ violation }, { status: 201 });
    }

    if (entity === "action") {
      if (typeof payload.actionType !== "string") {
        return NextResponse.json({ error: "actionType is required." }, { status: 400 });
      }

      const action = await createFollowupAction({
        employeeId: typeof payload.employeeId === "number" ? payload.employeeId : null,
        actionType: payload.actionType,
        status:
          typeof payload.status === "string"
            ? (payload.status as "pending" | "in_progress" | "done")
            : "pending",
        dueDate: typeof payload.dueDate === "string" ? payload.dueDate : undefined,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
      });
      return NextResponse.json({ action }, { status: 201 });
    }

    return NextResponse.json(
      { error: "entity must be case, violation, or action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to create compliance entity", error);
    return NextResponse.json(
      { error: "Failed to create compliance entity." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: CompliancePayload;
  try {
    payload = (await request.json()) as CompliancePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "case_status") {
      if (typeof payload.caseId !== "number" || typeof payload.status !== "string") {
        return NextResponse.json(
          { error: "caseId and status are required." },
          { status: 400 }
        );
      }
      if (
        !HR_DISCIPLINARY_STATUSES.includes(
          payload.status as (typeof HR_DISCIPLINARY_STATUSES)[number]
        )
      ) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      const disciplinaryCase = await updateDisciplinaryCaseStatus(
        payload.caseId,
        payload.status as (typeof HR_DISCIPLINARY_STATUSES)[number]
      );
      if (!disciplinaryCase) {
        return NextResponse.json({ error: "Case not found." }, { status: 404 });
      }
      return NextResponse.json({ disciplinaryCase });
    }

    if (entity === "action_status") {
      if (
        typeof payload.actionId !== "number" ||
        typeof payload.status !== "string" ||
        !["pending", "in_progress", "done"].includes(payload.status)
      ) {
        return NextResponse.json(
          { error: "actionId and valid status are required." },
          { status: 400 }
        );
      }
      const action = await updateFollowupActionStatus(
        payload.actionId,
        payload.status as "pending" | "in_progress" | "done"
      );
      if (!action) {
        return NextResponse.json({ error: "Action not found." }, { status: 404 });
      }
      return NextResponse.json({ action });
    }

    return NextResponse.json(
      { error: "entity must be case_status or action_status." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update compliance entity", error);
    return NextResponse.json(
      { error: "Failed to update compliance entity." },
      { status: 500 }
    );
  }
}
