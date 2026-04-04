import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import {
  createRecruitmentApplicant,
  createRecruitmentRole,
  getRecruitmentModuleData,
  updateRecruitmentApplicantStage,
  updateRecruitmentRole,
} from "@/lib/hr-db";
import { HR_RECRUITMENT_STAGES } from "@/lib/types";

type RecruitmentPayload = {
  entity?: unknown;
  title?: unknown;
  department?: unknown;
  hiringStage?: unknown;
  vacancies?: unknown;
  openedAt?: unknown;
  roleId?: unknown;
  fullName?: unknown;
  email?: unknown;
  employmentTrack?: unknown;
  currentStage?: unknown;
  appliedAt?: unknown;
  applicantId?: unknown;
  stage?: unknown;
  offeredAt?: unknown;
  hiredAt?: unknown;
  offerStatus?: unknown;
  closedAt?: unknown;
};

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  try {
    const data = await getRecruitmentModuleData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load recruitment module data", error);
    return NextResponse.json(
      { error: "Failed to load recruitment module data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: RecruitmentPayload;
  try {
    payload = (await request.json()) as RecruitmentPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "role") {
      if (typeof payload.title !== "string" || !payload.title.trim()) {
        return NextResponse.json({ error: "title is required." }, { status: 400 });
      }
      if (typeof payload.department !== "string" || !payload.department.trim()) {
        return NextResponse.json({ error: "department is required." }, { status: 400 });
      }

      const role = await createRecruitmentRole({
        title: payload.title,
        department: payload.department as "Operations" | "Marketing" | "Tech" | "Finance & HR",
        hiringStage:
          typeof payload.hiringStage === "string" ? payload.hiringStage : undefined,
        vacancies:
          typeof payload.vacancies === "number" ? payload.vacancies : undefined,
        openedAt: typeof payload.openedAt === "string" ? payload.openedAt : undefined,
      });
      return NextResponse.json({ role }, { status: 201 });
    }

    if (entity === "applicant") {
      if (typeof payload.fullName !== "string" || !payload.fullName.trim()) {
        return NextResponse.json({ error: "fullName is required." }, { status: 400 });
      }
      if (typeof payload.roleId !== "number") {
        return NextResponse.json({ error: "roleId is required." }, { status: 400 });
      }
      if (
        payload.employmentTrack !== "intern" &&
        payload.employmentTrack !== "full_time"
      ) {
        return NextResponse.json(
          { error: "employmentTrack must be intern or full_time." },
          { status: 400 }
        );
      }

      const applicant = await createRecruitmentApplicant({
        roleId: payload.roleId,
        fullName: payload.fullName,
        email: typeof payload.email === "string" ? payload.email : null,
        employmentTrack: payload.employmentTrack,
        currentStage:
          typeof payload.currentStage === "string"
            ? (payload.currentStage as (typeof HR_RECRUITMENT_STAGES)[number])
            : "applied",
        appliedAt: typeof payload.appliedAt === "string" ? payload.appliedAt : undefined,
      });
      return NextResponse.json({ applicant }, { status: 201 });
    }

    return NextResponse.json(
      { error: "entity must be role or applicant." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to create recruitment entity", error);
    return NextResponse.json(
      { error: "Failed to create recruitment entity." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: RecruitmentPayload;
  try {
    payload = (await request.json()) as RecruitmentPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "applicant_stage") {
      if (typeof payload.applicantId !== "number") {
        return NextResponse.json({ error: "applicantId is required." }, { status: 400 });
      }
      if (
        typeof payload.stage !== "string" ||
        !HR_RECRUITMENT_STAGES.includes(
          payload.stage as (typeof HR_RECRUITMENT_STAGES)[number]
        )
      ) {
        return NextResponse.json({ error: "Invalid stage." }, { status: 400 });
      }

      const applicant = await updateRecruitmentApplicantStage(
        payload.applicantId,
        payload.stage as (typeof HR_RECRUITMENT_STAGES)[number],
        {
          offeredAt: typeof payload.offeredAt === "string" ? payload.offeredAt : null,
          hiredAt: typeof payload.hiredAt === "string" ? payload.hiredAt : null,
          offerStatus:
            typeof payload.offerStatus === "string" ? payload.offerStatus : null,
        }
      );

      if (!applicant) {
        return NextResponse.json({ error: "Applicant not found." }, { status: 404 });
      }

      return NextResponse.json({ applicant });
    }

    if (entity === "role") {
      if (typeof payload.roleId !== "number") {
        return NextResponse.json({ error: "roleId is required." }, { status: 400 });
      }

      const role = await updateRecruitmentRole(payload.roleId, {
        hiringStage:
          typeof payload.hiringStage === "string" ? payload.hiringStage : undefined,
        vacancies:
          typeof payload.vacancies === "number" ? payload.vacancies : undefined,
        closedAt: typeof payload.closedAt === "string" ? payload.closedAt : null,
      });

      if (!role) {
        return NextResponse.json({ error: "Role not found." }, { status: 404 });
      }

      return NextResponse.json({ role });
    }

    return NextResponse.json(
      { error: "entity must be applicant_stage or role." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update recruitment entity", error);
    return NextResponse.json(
      { error: "Failed to update recruitment entity." },
      { status: 500 }
    );
  }
}
