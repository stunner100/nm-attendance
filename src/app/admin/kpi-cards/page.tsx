import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { AddKpiCardStack } from "@/components/hr/add-kpi-card-stack";
import { KpiCardListAccordion } from "@/components/hr/kpi-card-list-accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, readFormRecordId, redirectWithFormSuccess, readFormSuccess } from "@/lib/hr/form-actions";
import {
  addKpiCardItem,
  createKpiCard,
  currentPeriod,
  deleteKpiCard,
  deleteKpiCardItem,
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
  searchParams: Promise<{ status?: string; period?: string; error?: string; success?: string }>;
};

async function createCardAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/kpi-cards");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const period = String(formData.get("period") ?? "").trim();
  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const companyGoalId = readFormRecordId(formData, "companyGoalId");
  const departmentGoalId = readFormRecordId(formData, "departmentGoalId");
  const companyGoal = String(formData.get("companyGoal") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!Number.isFinite(employeeId) || employeeId <= 0 || !period) {
    redirectWithFormError("/admin/kpi-cards", "Employee and period are required.");
  }
  if (!HR_KPI_CARD_STATUSES.includes(status as (typeof HR_KPI_CARD_STATUSES)[number])) {
    redirectWithFormError("/admin/kpi-cards", "Select a valid card status.");
  }

  try {
    await createKpiCard({
      employeeId,
      period,
      roleTitle: roleTitle || null,
      companyGoal: companyGoal || null,
      companyGoalId,
      departmentGoalId,
      status: status as (typeof HR_KPI_CARD_STATUSES)[number],
    });
  } catch (error) {
    console.error("Failed to create KPI card", error);
    redirectWithFormError(
      "/admin/kpi-cards",
      "Could not create KPI card. Verify the employee and linked goals, then try again."
    );
  }

  revalidatePath("/admin/kpi-cards");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/kpi-cards", "KPI card created successfully.");
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
  redirectWithFormSuccess("/admin/kpi-cards", "KPI item added successfully.");
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
  redirectWithFormSuccess("/admin/kpi-cards", "KPI card status updated successfully.");
}

async function deleteCardAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/kpi-cards");

  const cardId = readFormRecordId(formData, "cardId");
  if (!cardId) {
    redirectWithFormError("/admin/kpi-cards", "Card ID is required.");
  }

  const deleted = await deleteKpiCard(cardId);
  if (!deleted) {
    redirectWithFormError("/admin/kpi-cards", "KPI card not found.");
  }

  revalidatePath("/admin/kpi-cards");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/kpi-cards", "KPI card deleted successfully.");
}

async function deleteItemAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/kpi-cards");

  const itemId = readFormRecordId(formData, "itemId");
  if (!itemId) {
    redirectWithFormError("/admin/kpi-cards", "KPI item ID is required.");
  }

  const deleted = await deleteKpiCardItem(itemId);
  if (!deleted) {
    redirectWithFormError("/admin/kpi-cards", "KPI item not found.");
  }

  revalidatePath("/admin/kpi-cards");
  redirectWithFormSuccess("/admin/kpi-cards", "KPI item deleted successfully.");
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
  const itemsByCard = Object.fromEntries(
    items.map((entry) => [entry.cardId, entry.list])
  );

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Document SMART, role-specific KPIs per employee. KPIs are reviewed weekly, scored monthly, and reviewed deeply each quarter."
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
          <AddKpiCardStack
            companyGoals={companyGoals}
            createCardAction={createCardAction}
            defaultPeriod={currentPeriod()}
            departmentGoals={departmentGoals}
            employeeOptions={employees}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KPI Cards ({cards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCardListAccordion
            addItemAction={addItemAction}
            cards={cards}
            itemsByCard={itemsByCard}
            updateCardStatusAction={updateCardStatusAction}
            deleteCardAction={deleteCardAction}
            deleteItemAction={deleteItemAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department KPI Focus Areas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HR_DEPARTMENTS.map((department) => (
            <div key={department} className="rounded-lg border p-3">
              <p className="text-sm font-medium text-foreground">{department}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {DEPARTMENT_FRAMEWORK[department].focusAreas.map((area) => (
                  <li key={area} className="flex gap-2">
                    <span className="text-[var(--color-ink-muted)]">&bull;</span>
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
