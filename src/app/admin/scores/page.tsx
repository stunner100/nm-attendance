import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { ScoreForm } from "@/components/hr/score-form";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  currentPeriod,
  listHREmployeeOptions,
  listMonthlyScores,
  RATING_BANDS,
  SCORE_WEIGHTS,
  upsertMonthlyScore,
} from "@/lib/hr-db";
import { HR_RATING_BANDS } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ period?: string; rating?: string; error?: string }>;
};

async function saveScoreAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/scores");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const period = String(formData.get("period") ?? "").trim();
  const kpiScore = Number(formData.get("kpiScore") ?? "0");
  const taskScore = Number(formData.get("taskScore") ?? "0");
  const commsScore = Number(formData.get("commsScore") ?? "0");
  const teamworkScore = Number(formData.get("teamworkScore") ?? "0");
  const notes = String(formData.get("notes") ?? "").trim();
  const scoredBy = String(formData.get("scoredBy") ?? "").trim();

  if (!Number.isFinite(employeeId) || !period) {
    redirectWithFormError("/admin/scores", "Employee and period are required.");
  }

  await upsertMonthlyScore({
    employeeId,
    period,
    kpiScore,
    taskScore,
    commsScore,
    teamworkScore,
    notes: notes || null,
    scoredBy: scoredBy || null,
  });

  revalidatePath("/admin/scores");
  revalidatePath("/admin");
}

export default async function ScoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const periodFilter = params.period?.trim() || "";
  const ratingFilter = params.rating?.trim() || "";

  const [scores, employees] = await Promise.all([
    listMonthlyScores({ period: periodFilter, rating: ratingFilter }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Monthly Performance Scores"
        description={`Scored out of 100: KPI ${SCORE_WEIGHTS.kpi}%, Tasks ${SCORE_WEIGHTS.task}%, Communication ${SCORE_WEIGHTS.comms}%, Teamwork ${SCORE_WEIGHTS.teamwork}%. Rating is derived automatically.`}
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Period (YYYY-MM)</span>
              <Input defaultValue={periodFilter} name="period" placeholder="2026-06" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Rating</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={ratingFilter}
                name="rating"
              >
                <option value="">All ratings</option>
                {HR_RATING_BANDS.map((rating) => (
                  <option key={rating} value={rating}>
                    {humanizeLabel(rating)}
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
          <CardTitle>Record Monthly Score</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreForm
            action={saveScoreAction}
            defaultPeriod={currentPeriod()}
            employees={employees}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Scores ({scores.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No monthly scores recorded yet.</p>
          ) : (
            scores.map((score) => (
              <div
                key={score.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {score.employee_name}
                    <span className="text-muted-foreground"> &middot; {score.period}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {score.department} &bull; KPI {score.kpi_score} &middot; Tasks {score.task_score} &middot;
                    Comms {score.comms_score} &middot; Teamwork {score.teamwork_score}
                    {score.scored_by ? ` \u2022 by ${score.scored_by}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-900">
                    {score.total_score.toFixed(1)}
                  </span>
                  <StatusBadge status={score.rating} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating Bands</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {RATING_BANDS.map((band) => (
            <div key={band.band} className="rounded-lg border p-3 text-center">
              <p className="text-sm font-semibold text-slate-800">{band.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                {band.min}
                {band.max >= 100 ? "+" : `-${band.max}`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
