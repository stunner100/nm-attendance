import { revalidatePath } from "next/cache";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  createKpiScore,
  createPerformanceReview,
  createPip,
  getPerformanceModuleData,
  listHREmployeeOptions,
  updatePerformanceReviewStatus,
  updatePipStatus,
} from "@/lib/hr-db";
import { HR_PIP_STATUSES, HR_REVIEW_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PerformancePageProps = {
  searchParams: Promise<{ reviewStatus?: string; pipStatus?: string }>;
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
    return;
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
    return;
  }
  if (!HR_PIP_STATUSES.includes(status as (typeof HR_PIP_STATUSES)[number])) {
    return;
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
    return;
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
}

async function updateReviewStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const reviewId = Number(formData.get("reviewId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(reviewId)) {
    return;
  }
  if (!HR_REVIEW_STATUSES.includes(status as (typeof HR_REVIEW_STATUSES)[number])) {
    return;
  }

  await updatePerformanceReviewStatus(reviewId, status as (typeof HR_REVIEW_STATUSES)[number]);
  revalidatePath("/admin/performance");
  revalidatePath("/admin");
}

async function updatePipStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/performance");

  const pipId = Number(formData.get("pipId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const progressNote = String(formData.get("progressNote") ?? "").trim();

  if (!Number.isFinite(pipId)) {
    return;
  }
  if (!HR_PIP_STATUSES.includes(status as (typeof HR_PIP_STATUSES)[number])) {
    return;
  }

  await updatePipStatus(
    pipId,
    status as (typeof HR_PIP_STATUSES)[number],
    progressNote || null
  );
  revalidatePath("/admin/performance");
  revalidatePath("/admin");
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
        title="Performance Management"
        description="Track review completion, improvement plan progress, and KPI score trends."
      />

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
            <form action={createReviewAction} className="grid gap-3">
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
              <Input name="reviewPeriod" placeholder="Review period (Q2 2026)" required />
              <Input name="dueDate" type="date" required />
              <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue="" name="reviewerEmployeeId">
                <option value="">Reviewer (optional)</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
              <Input name="notes" placeholder="Notes (optional)" />
              <Button type="submit">Create Review</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Improvement Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPipAction} className="grid gap-3">
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
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="active"
                name="status"
              >
                {HR_PIP_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <Input name="startDate" type="date" required />
              <Input name="endDate" type="date" />
              <Input name="progressNote" placeholder="Progress note" />
              <Button type="submit">Create Improvement Plan</Button>
            </form>
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

      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews ({data.reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Start by scheduling a review for an employee.</p>
          ) : (
            data.reviews.map((review) => (
              <div key={review.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{review.review_period}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {review.due_date}
                    {review.completed_at ? ` \u2022 Completed ${review.completed_at}` : ""}
                  </p>
                </div>
                <form action={updateReviewStatusAction} className="flex items-center gap-2">
                  <input name="reviewId" type="hidden" value={review.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={review.status}
                    name="status"
                  >
                    {HR_REVIEW_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={review.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Plans ({data.pips.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.pips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No improvement plans active.</p>
          ) : (
            data.pips.map((pip) => (
              <div key={pip.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">PIP started {pip.start_date}</p>
                  <p className="text-xs text-muted-foreground">
                    {pip.start_date}
                    {pip.end_date ? ` to ${pip.end_date}` : ""}
                    {pip.progress_note ? ` \u2022 ${pip.progress_note}` : ""}
                  </p>
                </div>
                <form action={updatePipStatusAction} className="flex flex-wrap items-center gap-2">
                  <input name="pipId" type="hidden" value={pip.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={pip.status}
                    name="status"
                  >
                    {HR_PIP_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Input className="h-8 w-40 text-xs" name="progressNote" placeholder="Progress note" />
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={pip.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
                <StatusBadge status={`${kpi.score.toFixed(1)} pts`} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
