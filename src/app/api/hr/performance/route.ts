import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import {
  createKpiScore,
  createPerformanceReview,
  createPip,
  getPerformanceModuleData,
  updatePerformanceReviewStatus,
  updatePipStatus,
} from "@/lib/hr-db";
import { HR_PIP_STATUSES, HR_REVIEW_STATUSES } from "@/lib/types";

type PerformancePayload = {
  entity?: unknown;
  employeeId?: unknown;
  reviewPeriod?: unknown;
  dueDate?: unknown;
  reviewerEmployeeId?: unknown;
  notes?: unknown;
  reviewId?: unknown;
  status?: unknown;
  pipId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  progressNote?: unknown;
  metricName?: unknown;
  score?: unknown;
  periodStart?: unknown;
  periodEnd?: unknown;
};

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  try {
    const data = await getPerformanceModuleData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load performance data", error);
    return NextResponse.json(
      { error: "Failed to load performance data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: PerformancePayload;
  try {
    payload = (await request.json()) as PerformancePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "review") {
      if (
        typeof payload.employeeId !== "number" ||
        typeof payload.reviewPeriod !== "string" ||
        typeof payload.dueDate !== "string"
      ) {
        return NextResponse.json(
          { error: "employeeId, reviewPeriod, and dueDate are required." },
          { status: 400 }
        );
      }

      const review = await createPerformanceReview({
        employeeId: payload.employeeId,
        reviewPeriod: payload.reviewPeriod,
        dueDate: payload.dueDate,
        reviewerEmployeeId:
          typeof payload.reviewerEmployeeId === "number"
            ? payload.reviewerEmployeeId
            : null,
        notes: typeof payload.notes === "string" ? payload.notes : null,
      });
      return NextResponse.json({ review }, { status: 201 });
    }

    if (entity === "pip") {
      if (
        typeof payload.employeeId !== "number" ||
        typeof payload.status !== "string" ||
        typeof payload.startDate !== "string"
      ) {
        return NextResponse.json(
          { error: "employeeId, status, and startDate are required." },
          { status: 400 }
        );
      }

      if (
        !HR_PIP_STATUSES.includes(payload.status as (typeof HR_PIP_STATUSES)[number])
      ) {
        return NextResponse.json({ error: "Invalid PIP status." }, { status: 400 });
      }

      const pip = await createPip({
        employeeId: payload.employeeId,
        status: payload.status as (typeof HR_PIP_STATUSES)[number],
        startDate: payload.startDate,
        endDate: typeof payload.endDate === "string" ? payload.endDate : null,
        progressNote:
          typeof payload.progressNote === "string" ? payload.progressNote : null,
      });
      return NextResponse.json({ pip }, { status: 201 });
    }

    if (entity === "kpi_score") {
      if (
        typeof payload.employeeId !== "number" ||
        typeof payload.metricName !== "string" ||
        typeof payload.score !== "number" ||
        typeof payload.periodStart !== "string" ||
        typeof payload.periodEnd !== "string"
      ) {
        return NextResponse.json(
          {
            error:
              "employeeId, metricName, score, periodStart, and periodEnd are required.",
          },
          { status: 400 }
        );
      }

      const kpiScore = await createKpiScore({
        employeeId: payload.employeeId,
        metricName: payload.metricName,
        score: payload.score,
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
      });
      return NextResponse.json({ kpiScore }, { status: 201 });
    }

    return NextResponse.json(
      { error: "entity must be review, pip, or kpi_score." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to create performance entity", error);
    return NextResponse.json(
      { error: "Failed to create performance entity." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let payload: PerformancePayload;
  try {
    payload = (await request.json()) as PerformancePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const entity = typeof payload.entity === "string" ? payload.entity : "";

  try {
    if (entity === "review_status") {
      if (typeof payload.reviewId !== "number" || typeof payload.status !== "string") {
        return NextResponse.json(
          { error: "reviewId and status are required." },
          { status: 400 }
        );
      }

      if (
        !HR_REVIEW_STATUSES.includes(
          payload.status as (typeof HR_REVIEW_STATUSES)[number]
        )
      ) {
        return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
      }

      const review = await updatePerformanceReviewStatus(
        payload.reviewId,
        payload.status as (typeof HR_REVIEW_STATUSES)[number]
      );
      if (!review) {
        return NextResponse.json({ error: "Review not found." }, { status: 404 });
      }
      return NextResponse.json({ review });
    }

    if (entity === "pip_status") {
      if (typeof payload.pipId !== "number" || typeof payload.status !== "string") {
        return NextResponse.json(
          { error: "pipId and status are required." },
          { status: 400 }
        );
      }

      if (
        !HR_PIP_STATUSES.includes(payload.status as (typeof HR_PIP_STATUSES)[number])
      ) {
        return NextResponse.json({ error: "Invalid PIP status." }, { status: 400 });
      }

      const pip = await updatePipStatus(
        payload.pipId,
        payload.status as (typeof HR_PIP_STATUSES)[number],
        typeof payload.progressNote === "string" ? payload.progressNote : null
      );
      if (!pip) {
        return NextResponse.json({ error: "PIP not found." }, { status: 404 });
      }
      return NextResponse.json({ pip });
    }

    return NextResponse.json(
      { error: "entity must be review_status or pip_status." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update performance entity", error);
    return NextResponse.json(
      { error: "Failed to update performance entity." },
      { status: 500 }
    );
  }
}
