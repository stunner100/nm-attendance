import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  createPresentation,
  currentPeriod,
  listHREmployeeOptions,
  listPresentations,
  REVIEW_TIMELINE,
  updatePresentationStatus,
} from "@/lib/hr-db";
import {
  HR_PRESENTATION_STATUSES,
  HR_PRESENTER_TYPES,
  HR_ROADMAP_HEALTH,
} from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    period?: string;
    presenterType?: string;
    error?: string;
  }>;
};

function field(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

async function createPresentationAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/presentations");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const period = String(formData.get("period") ?? "").trim();
  const presenterType = String(formData.get("presenterType") ?? "").trim();
  const status = String(formData.get("status") ?? "scheduled").trim();
  const roadmapHealth = String(formData.get("roadmapHealth") ?? "").trim();

  if (!Number.isFinite(employeeId) || !period) {
    redirectWithFormError("/admin/presentations", "Employee and period are required.");
  }
  if (!HR_PRESENTER_TYPES.includes(presenterType as (typeof HR_PRESENTER_TYPES)[number])) {
    redirectWithFormError("/admin/presentations", "Select a valid presenter type.");
  }
  if (!HR_PRESENTATION_STATUSES.includes(status as (typeof HR_PRESENTATION_STATUSES)[number])) {
    redirectWithFormError("/admin/presentations", "Select a valid status.");
  }

  await createPresentation({
    employeeId,
    period,
    presenterType: presenterType as (typeof HR_PRESENTER_TYPES)[number],
    status: status as (typeof HR_PRESENTATION_STATUSES)[number],
    achievements: field(formData, "achievements"),
    kpiResults: field(formData, "kpiResults"),
    tasksCompleted: field(formData, "tasksCompleted"),
    tasksDelayed: field(formData, "tasksDelayed"),
    challenges: field(formData, "challenges"),
    supportNeeded: field(formData, "supportNeeded"),
    lessons: field(formData, "lessons"),
    nextPriorities: field(formData, "nextPriorities"),
    roadmapHealth: HR_ROADMAP_HEALTH.includes(
      roadmapHealth as (typeof HR_ROADMAP_HEALTH)[number]
    )
      ? (roadmapHealth as (typeof HR_ROADMAP_HEALTH)[number])
      : null,
    keyWins: field(formData, "keyWins"),
    blockers: field(formData, "blockers"),
    risks: field(formData, "risks"),
    dependencies: field(formData, "dependencies"),
    qaNotes: field(formData, "qaNotes"),
  });

  revalidatePath("/admin/presentations");
  revalidatePath("/admin");
}

async function updateStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/presentations");

  const presentationId = Number(formData.get("presentationId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const qaNotes = String(formData.get("qaNotes") ?? "").trim();

  if (!Number.isFinite(presentationId)) {
    redirectWithFormError("/admin/presentations", "Presentation ID is required.");
  }
  if (!HR_PRESENTATION_STATUSES.includes(status as (typeof HR_PRESENTATION_STATUSES)[number])) {
    redirectWithFormError("/admin/presentations", "Select a valid status.");
  }

  await updatePresentationStatus(
    presentationId,
    status as (typeof HR_PRESENTATION_STATUSES)[number],
    qaNotes || null
  );
  revalidatePath("/admin/presentations");
  revalidatePath("/admin");
}

export default async function PresentationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status?.trim() || "";
  const periodFilter = params.period?.trim() || "";
  const presenterFilter = params.presenterType?.trim() || "";

  const [presentations, employees] = await Promise.all([
    listPresentations({
      status: statusFilter,
      period: periodFilter,
      presenterType: presenterFilter,
    }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Monthly KPI Presentations"
        description="Associates and mid-level staff present achievements, KPI results, and next steps; managers and HODs present department roadmap health. Used to build ownership and accountability, not to embarrass."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-4" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Period</span>
              <Input defaultValue={periodFilter} name="period" placeholder="2026-06" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Presenter type</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={presenterFilter}
                name="presenterType"
              >
                <option value="">All</option>
                {HR_PRESENTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {humanizeLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={statusFilter}
                name="status"
              >
                <option value="">All</option>
                {HR_PRESENTATION_STATUSES.map((status) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Log Presentation</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPresentationAction} className="grid gap-3 sm:grid-cols-2">
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
            <Input defaultValue={currentPeriod()} name="period" placeholder="2026-06" required />
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue="associate"
              name="presenterType"
            >
              {HR_PRESENTER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanizeLabel(type)}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue="scheduled"
              name="status"
            >
              {HR_PRESENTATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeLabel(status)}
                </option>
              ))}
            </select>

            <Textarea name="achievements" placeholder="Achievements" />
            <Textarea name="kpiResults" placeholder="KPI results achieved" />
            <Textarea name="tasksCompleted" placeholder="Tasks completed" />
            <Textarea name="tasksDelayed" placeholder="Tasks delayed / not completed (with reasons)" />
            <Textarea name="challenges" placeholder="Challenges / blockers faced" />
            <Textarea name="supportNeeded" placeholder="Support needed" />
            <Textarea name="lessons" placeholder="Key lessons learned" />
            <Textarea name="nextPriorities" placeholder="Priorities for next month" />

            <div className="sm:col-span-2 rounded-lg border border-dashed p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Manager / HOD roadmap section (optional)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  defaultValue=""
                  name="roadmapHealth"
                >
                  <option value="">Roadmap health (n/a)</option>
                  {HR_ROADMAP_HEALTH.map((health) => (
                    <option key={health} value={health}>
                      {humanizeLabel(health)}
                    </option>
                  ))}
                </select>
                <Textarea name="keyWins" placeholder="Key wins" />
                <Textarea name="blockers" placeholder="Major blockers" />
                <Textarea name="risks" placeholder="Department risks" />
                <Textarea name="dependencies" placeholder="Cross-department dependencies" />
              </div>
            </div>

            <Textarea className="sm:col-span-2" name="qaNotes" placeholder="Q&A notes" />
            <div className="sm:col-span-2">
              <Button type="submit">Save Presentation</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presentations ({presentations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {presentations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No presentations logged yet.</p>
          ) : (
            presentations.map((presentation) => (
              <div key={presentation.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {presentation.employee_name}
                      <span className="text-muted-foreground"> &middot; {presentation.period}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {presentation.department} &bull; {humanizeLabel(presentation.presenter_type)}
                      {presentation.roadmap_health
                        ? ` \u2022 Roadmap: ${humanizeLabel(presentation.roadmap_health)}`
                        : ""}
                    </p>
                  </div>
                  <form action={updateStatusAction} className="flex flex-wrap items-center gap-2">
                    <input name="presentationId" type="hidden" value={presentation.id} />
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      defaultValue={presentation.status}
                      name="status"
                    >
                      {HR_PRESENTATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {humanizeLabel(status)}
                        </option>
                      ))}
                    </select>
                    <Input className="h-8 w-40 text-xs" name="qaNotes" placeholder="Q&A note" />
                    <Button size="sm" type="submit" variant="outline">
                      Save
                    </Button>
                    <StatusBadge status={presentation.status} />
                  </form>
                </div>
                {presentation.achievements || presentation.next_priorities ? (
                  <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    {presentation.achievements ? (
                      <p>
                        <span className="font-semibold">Achievements:</span> {presentation.achievements}
                      </p>
                    ) : null}
                    {presentation.next_priorities ? (
                      <p>
                        <span className="font-semibold">Next priorities:</span>{" "}
                        {presentation.next_priorities}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {REVIEW_TIMELINE.map((entry, index) => (
            <div key={index} className="flex gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
              <span className="w-32 shrink-0 font-semibold text-slate-700">{entry.cadence}</span>
              <span className="text-slate-600">{entry.focus}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
