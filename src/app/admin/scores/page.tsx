import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { ScoreListAccordion } from "@/components/hr/score-list-accordion";
import { ScoreStack } from "@/components/hr/score-stack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  currentPeriod,
  formatMonthlyScoreFormula,
  listHREmployeeOptions,
  listMonthlyScores,
  RATING_BANDS,
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
  const disciplineScore = Number(formData.get("disciplineScore") ?? "0");
  const attendanceScore = Number(formData.get("attendanceScore") ?? "0");
  const hygieneScore = Number(formData.get("hygieneScore") ?? "0");
  const extracurricularScore = Number(formData.get("extracurricularScore") ?? "0");
  const notes = String(formData.get("notes") ?? "").trim();
  const scoredBy = String(formData.get("scoredBy") ?? "").trim();

  if (!Number.isFinite(employeeId) || !period) {
    redirectWithFormError("/admin/scores", "Employee and period are required.");
  }

  await upsertMonthlyScore({
    employeeId,
    period,
    kpiScore,
    disciplineScore,
    attendanceScore,
    hygieneScore,
    extracurricularScore,
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
        description={`Monthly score out of 100: ${formatMonthlyScoreFormula()}. Rating is derived automatically.`}
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
          <ScoreStack
            employeeOptions={employees}
            defaultPeriod={currentPeriod()}
            saveScoreAction={saveScoreAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Scores ({scores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreListAccordion scores={scores} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating Bands</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {RATING_BANDS.map((band) => (
            <div key={band.band} className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-foreground">{band.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {band.min === 0
                  ? `Below ${band.max + 1}`
                  : band.max >= 100
                    ? `${band.min}–${band.max}`
                    : `${band.min}–${band.max}`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
