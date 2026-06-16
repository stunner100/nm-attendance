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
  addKpiCardItem,
  createKpiCard,
  currentPeriod,
  DEPARTMENT_FRAMEWORK,
  listActiveCompanyGoalOptions,
  listDepartmentGoalOptions,
  listHREmployeeOptions,
  listKpiCardItems,
  listKpiCards,
  updateKpiCardStatus,
} from "@/lib/hr-db";
import { HR_DEPARTMENTS, HR_KPI_CARD_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ status?: string; period?: string; error?: string }>;
};

async function createCardAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/kpi-cards");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const period = String(formData.get("period") ?? "").trim();
  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const companyGoalIdRaw = Number(formData.get("companyGoalId") ?? "");
  const departmentGoalIdRaw = Number(formData.get("departmentGoalId") ?? "");
  const companyGoal = String(formData.get("companyGoal") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!Number.isFinite(employeeId) || !period) {
    redirectWithFormError("/admin/kpi-cards", "Employee and period are required.");
  }
  if (!HR_KPI_CARD_STATUSES.includes(status as (typeof HR_KPI_CARD_STATUSES)[number])) {
    redirectWithFormError("/admin/kpi-cards", "Select a valid card status.");
  }

  await createKpiCard({
    employeeId,
    period,
    roleTitle: roleTitle || null,
    companyGoal: companyGoal || null,
    companyGoalId: Number.isFinite(companyGoalIdRaw) ? companyGoalIdRaw : null,
    departmentGoalId: Number.isFinite(departmentGoalIdRaw) ? departmentGoalIdRaw : null,
    status: status as (typeof HR_KPI_CARD_STATUSES)[number],
  });

  revalidatePath("/admin/kpi-cards");
  revalidatePath("/admin");
}

async function addItemAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/kpi-cards");

  const cardId = Number(formData.get("cardId") ?? "");
  const kpiText = String(formData.get("kpiText") ?? "").trim();
  const targetMeasure = String(formData.get("targetMeasure") ?? "").trim();
  const weight = Number(formData.get("weight") ?? "0");

  if (!Number.isFinite(cardId) || !kpiText) {
    redirectWithFormError("/admin/kpi-cards", "KPI text is required.");
  }

  await addKpiCardItem({
    cardId,
    kpiText,
    targetMeasure: targetMeasure || null,
    weight: Number.isFinite(weight) ? weight : 0,
  });

  revalidatePath("/admin/kpi-cards");
}

async function updateCardStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/kpi-cards");

  const cardId = Number(formData.get("cardId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(cardId)) {
    redirectWithFormError("/admin/kpi-cards", "Card ID is required.");
  }
  if (!HR_KPI_CARD_STATUSES.includes(status as (typeof HR_KPI_CARD_STATUSES)[number])) {
    redirectWithFormError("/admin/kpi-cards", "Select a valid card status.");
  }

  await updateKpiCardStatus(cardId, status as (typeof HR_KPI_CARD_STATUSES)[number]);
  revalidatePath("/admin/kpi-cards");
  revalidatePath("/admin");
}

export default async function KpiCardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status?.trim() || "";
  const periodFilter = params.period?.trim() || "";

  const [cards, employees, companyGoals, departmentGoals] = await Promise.all([
    listKpiCards({ status: statusFilter, period: periodFilter }),
    listHREmployeeOptions(),
    listActiveCompanyGoalOptions(),
    listDepartmentGoalOptions(periodFilter || currentPeriod()),
  ]);

  const items = await Promise.all(
    cards.map(async (card) => ({
      cardId: card.id,
      list: await listKpiCardItems(card.id),
    }))
  );
  const itemsByCard = new Map(items.map((entry) => [entry.cardId, entry.list]));

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Employee KPI Cards"
        description="Document SMART, role-specific KPIs per employee. KPIs are reviewed weekly, scored monthly, and reviewed deeply each quarter."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={statusFilter}
                name="status"
              >
                <option value="">All statuses</option>
                {HR_KPI_CARD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Period (YYYY-MM)</span>
              <Input defaultValue={periodFilter} name="period" placeholder="2026-06" />
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
          <CardTitle>Create KPI Card</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCardAction} className="grid gap-3 sm:grid-cols-2">
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
            <Input name="roleTitle" placeholder="Role title" />
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue="draft"
              name="status"
            >
              {HR_KPI_CARD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeLabel(status)}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue=""
              name="companyGoalId"
            >
              <option value="">Link company goal</option>
              {companyGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title} ({goal.period})
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue=""
              name="departmentGoalId"
            >
              <option value="">Link department goal</option>
              {departmentGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.department}: {goal.title}
                </option>
              ))}
            </select>
            <Textarea
              className="sm:col-span-2"
              name="companyGoal"
              placeholder="Legacy goal text (optional if linked above)"
            />
            <div className="sm:col-span-2">
              <Button type="submit">Create Card</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KPI Cards ({cards.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No KPI cards yet.</p>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {card.employee_name}
                      <span className="text-muted-foreground"> &middot; {card.period}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.role_title || "Role not set"}
                      {card.company_goal ? ` \u2022 Goal: ${card.company_goal}` : ""}
                    </p>
                  </div>
                  <form action={updateCardStatusAction} className="flex items-center gap-2">
                    <input name="cardId" type="hidden" value={card.id} />
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      defaultValue={card.status}
                      name="status"
                    >
                      {HR_KPI_CARD_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {humanizeLabel(status)}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" type="submit" variant="outline">
                      Save
                    </Button>
                    <StatusBadge status={card.status} />
                  </form>
                </div>

                <div className="mt-3 space-y-1.5">
                  {(itemsByCard.get(card.id) ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No KPIs added to this card yet.</p>
                  ) : (
                    (itemsByCard.get(card.id) ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{item.kpi_text}</p>
                          {item.target_measure ? (
                            <p className="text-xs text-slate-500">Target: {item.target_measure}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-slate-500">
                          {item.weight}%
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <form action={addItemAction} className="mt-3 grid gap-2 sm:grid-cols-[2fr_1.4fr_0.6fr_auto]">
                  <input name="cardId" type="hidden" value={card.id} />
                  <Input className="h-8 text-xs" name="kpiText" placeholder="SMART KPI" required />
                  <Input className="h-8 text-xs" name="targetMeasure" placeholder="Target / measure" />
                  <Input
                    className="h-8 text-xs"
                    name="weight"
                    placeholder="Weight %"
                    step="1"
                    type="number"
                  />
                  <Button size="sm" type="submit" variant="outline">
                    Add KPI
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department KPI Focus Areas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HR_DEPARTMENTS.map((department) => (
            <div key={department} className="rounded-lg border p-3">
              <p className="text-sm font-semibold text-slate-800">{department}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {DEPARTMENT_FRAMEWORK[department].focusAreas.map((area) => (
                  <li key={area} className="flex gap-2">
                    <span className="text-emerald-500">&bull;</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
