import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { CreatePipStack } from "@/components/hr/create-pip-stack";
import { CreateReviewStack } from "@/components/hr/create-review-stack";
import { PerformancePipAccordion } from "@/components/hr/performance-pip-accordion";
import { PerformanceReviewAccordion } from "@/components/hr/performance-review-accordion";
import { DeleteRecordForm } from "@/components/hr/delete-record-form";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, readFormRecordId, redirectWithFormSuccess, readFormSuccess } from "@/lib/hr/form-actions";
import {
  createKpiScore,
  createPerformanceReview,
  createPip,
  deleteKpiScore,
  deletePerformanceReview,
  deletePip,
  getPerformanceModuleData,
  listHREmployeeOptions,
  updatePerformanceReviewStatus,
  updatePipStatus,
} from "@/lib/hr-db";
import { HR_PIP_STATUSES, HR_REVIEW_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PerformancePageProps = {
  searchParams: Promise<{ reviewStatus?: string; pipStatus?: string; error?: string; success?: string }>;
};

async function createReviewAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const reviewPeriod = String(formData.get("reviewPeriod") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const reviewerEmployeeId = Number(formData.get("reviewerEmployeeId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isFinite(employeeId) || !reviewPeriod || !dueDate) {
    redirectWithFormError("/admin/performance", "Employee, review period, and due date are required.");
  }

  await createPerformanceReview({
    employeeId,
    reviewPeriod,
    dueDate,
    reviewerEmployeeId:
      Number.isFinite(reviewerEmployeeId) && reviewerEmployeeId > 0
        ? reviewerEmployeeId
        : null,
    notes: notes || null,
  });

  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "Performance review scheduled successfully.");
}

async function createPipAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const status = String(formData.get("status") ?? "active").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const progressNote = String(formData.get("progressNote") ?? "").trim();

  if (!Number.isFinite(employeeId) || !startDate) {
    redirectWithFormError("/admin/performance", "Employee and PIP start date are required.");
  }
  if (!HR_PIP_STATUSES.includes(status as (typeof HR_PIP_STATUSES)[number])) {
    redirectWithFormError("/admin/performance", "Select a valid PIP status.");
  }

  await createPip({
    employeeId,
    status: status as (typeof HR_PIP_STATUSES)[number],
    startDate,
    endDate: endDate || null,
    progressNote: progressNote || null,
  });

  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "Improvement plan created successfully.");
}

async function createKpiAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const metricName = String(formData.get("metricName") ?? "").trim();
  const score = Number(formData.get("score") ?? "");
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();

  if (!Number.isFinite(employeeId) || !metricName || !Number.isFinite(score) || !periodStart || !periodEnd) {
    redirectWithFormError("/admin/performance", "Complete all KPI score fields.");
  }

  await createKpiScore({
    employeeId,
    metricName,
    score,
    periodStart,
    periodEnd,
  });

  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "KPI score saved successfully.");
}

async function updateReviewStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const reviewId = Number(formData.get("reviewId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(reviewId)) {
    redirectWithFormError("/admin/performance", "Review ID is required.");
  }
  if (!HR_REVIEW_STATUSES.includes(status as (typeof HR_REVIEW_STATUSES)[number])) {
    redirectWithFormError("/admin/performance", "Select a valid review status.");
  }

  await updatePerformanceReviewStatus(reviewId, status as (typeof HR_REVIEW_STATUSES)[number]);
  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "Review status updated successfully.");
}

async function updatePipStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const pipId = Number(formData.get("pipId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const progressNote = String(formData.get("progressNote") ?? "").trim();

  if (!Number.isFinite(pipId)) {
    redirectWithFormError("/admin/performance", "PIP ID is required.");
  }
  if (!HR_PIP_STATUSES.includes(status as (typeof HR_PIP_STATUSES)[number])) {
    redirectWithFormError("/admin/performance", "Select a valid PIP status.");
  }

  await updatePipStatus(
    pipId,
    status as (typeof HR_PIP_STATUSES)[number],
    progressNote || null
  );
  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "Improvement plan status updated successfully.");
}

async function deleteReviewAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const reviewId = readFormRecordId(formData, "reviewId");
  if (!reviewId) {
    redirectWithFormError("/admin/performance", "Review ID is required.");
  }

  const deleted = await deletePerformanceReview(reviewId);
  if (!deleted) {
    redirectWithFormError("/admin/performance", "Review not found.");
  }

  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "Performance review deleted successfully.");
}

async function deletePipAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const pipId = readFormRecordId(formData, "pipId");
  if (!pipId) {
    redirectWithFormError("/admin/performance", "Improvement plan ID is required.");
  }

  const deleted = await deletePip(pipId);
  if (!deleted) {
    redirectWithFormError("/admin/performance", "Improvement plan not found.");
  }

  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "Improvement plan deleted successfully.");
}

async function deleteKpiScoreAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const scoreId = readFormRecordId(formData, "scoreId");
  if (!scoreId) {
    redirectWithFormError("/admin/performance", "KPI score ID is required.");
  }

  const deleted = await deleteKpiScore(scoreId);
  if (!deleted) {
    redirectWithFormError("/admin/performance", "KPI score not found.");
  }

  revalidatePath("/admin/performance");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/performance", "KPI score deleted successfully.");
}

export default async function PerformancePage({ searchParams }: PerformancePageProps) {
  const params = await searchParams;

  const reviewStatusFilter = params.reviewStatus?.trim() || "";
  const pipStatusFilter = params.pipStatus?.trim() || "";

  const [data, employees] = await Promise.all([
    getPerformanceModuleData({
      reviewStatus: reviewStatusFilter,
      pipStatus: pipStatusFilter,
    }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Track review completion, improvement plan progress, and KPI score trends."
      />

      <AdminFormAlert message={readFormError(params)} />
      <AdminFormAlert message={readFormSuccess(params)} variant="success" />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Review status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={reviewStatusFilter}
                name="reviewStatus"
              >
                <option value="">All statuses</option>
                {HR_REVIEW_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Improvement plan status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={pipStatusFilter}
                name="pipStatus"
              >
                <option value="">All statuses</option>
                {HR_PIP_STATUSES.map((status) => (
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Review</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateReviewStack
              employeeOptions={employees}
              createReviewAction={createReviewAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Improvement Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePipStack
              employeeOptions={employees}
              createPipAction={createPipAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add KPI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createKpiAction} className="grid gap-3">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
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
              <Input name="metricName" placeholder="Metric name" required />
              <Input name="score" placeholder="Score" step="0.1" type="number" required />
              <Input name="periodStart" type="date" required />
              <Input name="periodEnd" type="date" required />
              <Button type="submit">Save KPI</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Reviews &amp; improvement plans</h2>

        <Card>
          <CardHeader>
            <CardTitle>Performance Reviews ({data.reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceReviewAccordion
              reviews={data.reviews}
              employeeOptions={employees}
              updateReviewStatusAction={updateReviewStatusAction}
              deleteReviewAction={deleteReviewAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improvement Plans ({data.pips.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformancePipAccordion
              pips={data.pips}
              employeeOptions={employees}
              updatePipStatusAction={updatePipStatusAction}
              deletePipAction={deletePipAction}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KPI Score Trends ({data.kpiScores.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.kpiScores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No KPI scores logged.</p>
          ) : (
            data.kpiScores.map((kpi) => (
              <div key={kpi.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{kpi.metric_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {kpi.period_start} to {kpi.period_end}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={`${kpi.score.toFixed(1)} pts`} />
                  <DeleteRecordForm
                    action={deleteKpiScoreAction}
                    recordId={kpi.id}
                    recordIdFieldName="scoreId"
                    confirmMessage={`Delete KPI score "${kpi.metric_name}"? This cannot be undone.`}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
