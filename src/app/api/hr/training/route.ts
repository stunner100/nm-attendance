import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import {
  createOnboardingChecklistItem,
  createTrainingAssignment,
  createTrainingModule,
  getTrainingModuleData,
  updateOnboardingChecklistStatus,
  updateTrainingAssignmentStatus,
} from "@/lib/hr-db";
import { HR_TRAINING_STATUSES } from "@/lib/types";

type TrainingPayload = {
  entity?: unknown;
  code?: unknown;
  title?: unknown;
  category?: unknown;
  durationHours?: unknown;
  employeeId?: unknown;
  moduleId?: unknown;
  status?: unknown;
  assignedAt?: unknown;
  assignmentId?: unknown;
  itemName?: unknown;
  dueDate?: unknown;
  checklistId?: unknown;
};

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  try {
    const data = await getTrainingModuleData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load training module data", error);
    return NextResponse.json(
      { error: "Failed to load training module data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: TrainingPayload;
  try {
    payload = (await request.json()) as TrainingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "module") {
      if (
        typeof payload.code !== "string" ||
        typeof payload.title !== "string" ||
        typeof payload.category !== "string"
      ) {
        return NextResponse.json(
          { error: "code, title, and category are required." },
          { status: 400 }
        );
      }

      const trainingModule = await createTrainingModule({
        code: payload.code,
        title: payload.title,
        category: payload.category,
        durationHours:
          typeof payload.durationHours === "number" ? payload.durationHours : 0,
      });
      return NextResponse.json({ module: trainingModule }, { status: 201 });
    }

    if (entity === "assignment") {
      if (
        typeof payload.employeeId !== "number" ||
        typeof payload.moduleId !== "number"
      ) {
        return NextResponse.json(
          { error: "employeeId and moduleId are required." },
          { status: 400 }
        );
      }

      if (
        typeof payload.status === "string" &&
        !HR_TRAINING_STATUSES.includes(
          payload.status as (typeof HR_TRAINING_STATUSES)[number]
        )
      ) {
        return NextResponse.json({ error: "Invalid training status." }, { status: 400 });
      }

      const assignment = await createTrainingAssignment({
        employeeId: payload.employeeId,
        moduleId: payload.moduleId,
        status:
          typeof payload.status === "string"
            ? (payload.status as (typeof HR_TRAINING_STATUSES)[number])
            : "assigned",
        assignedAt:
          typeof payload.assignedAt === "string" ? payload.assignedAt : undefined,
      });
      return NextResponse.json({ assignment }, { status: 201 });
    }

    if (entity === "onboarding") {
      if (typeof payload.employeeId !== "number" || typeof payload.itemName !== "string") {
        return NextResponse.json(
          { error: "employeeId and itemName are required." },
          { status: 400 }
        );
      }

      if (
        typeof payload.status === "string" &&
        payload.status !== "pending" &&
        payload.status !== "completed"
      ) {
        return NextResponse.json(
          { error: "onboarding status must be pending or completed." },
          { status: 400 }
        );
      }

      const onboarding = await createOnboardingChecklistItem({
        employeeId: payload.employeeId,
        itemName: payload.itemName,
        status: payload.status === "completed" ? "completed" : "pending",
        dueDate: typeof payload.dueDate === "string" ? payload.dueDate : undefined,
      });
      return NextResponse.json({ onboarding }, { status: 201 });
    }

    return NextResponse.json(
      { error: "entity must be module, assignment, or onboarding." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to create training entity", error);
    return NextResponse.json(
      { error: "Failed to create training entity." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: TrainingPayload;
  try {
    payload = (await request.json()) as TrainingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "assignment_status") {
      if (
        typeof payload.assignmentId !== "number" ||
        typeof payload.status !== "string" ||
        !HR_TRAINING_STATUSES.includes(
          payload.status as (typeof HR_TRAINING_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          { error: "assignmentId and valid status are required." },
          { status: 400 }
        );
      }

      const assignment = await updateTrainingAssignmentStatus(
        payload.assignmentId,
        payload.status as (typeof HR_TRAINING_STATUSES)[number]
      );
      if (!assignment) {
        return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
      }
      return NextResponse.json({ assignment });
    }

    if (entity === "onboarding_status") {
      if (
        typeof payload.checklistId !== "number" ||
        (payload.status !== "pending" && payload.status !== "completed")
      ) {
        return NextResponse.json(
          { error: "checklistId and valid status are required." },
          { status: 400 }
        );
      }

      const onboarding = await updateOnboardingChecklistStatus(
        payload.checklistId,
        payload.status
      );
      if (!onboarding) {
        return NextResponse.json(
          { error: "Checklist item not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ onboarding });
    }

    return NextResponse.json(
      { error: "entity must be assignment_status or onboarding_status." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update training entity", error);
    return NextResponse.json(
      { error: "Failed to update training entity." },
      { status: 500 }
    );
  }
}
