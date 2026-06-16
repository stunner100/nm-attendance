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
  createCompanyGoal,
  currentPeriod,
  listCompanyGoals,
  updateCompanyGoal,
} from "@/lib/hr-db";
import { HR_GOAL_PRIORITIES, HR_GOAL_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ period?: string; status?: string; error?: string }>;
};

async function createGoalAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/company-goals");

  const title = String(formData.get("title") ?? "").trim();
  const period = String(formData.get("period") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium").trim();
  const owner = String(formData.get("owner") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!title || !period) {
    redirectWithFormError("/admin/company-goals", "Title and period are required.");
  }

  await createCompanyGoal({
    title,
    period,
    description: description || null,
    priority: priority as (typeof HR_GOAL_PRIORITIES)[number],
    owner: owner || null,
    status: status as (typeof HR_GOAL_STATUSES)[number],
  });

  revalidatePath("/admin/company-goals");
  revalidatePath("/admin");
}

async function approveGoalAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/company-goals");

  const id = Number(formData.get("goalId") ?? "");
  if (!Number.isFinite(id)) {
    redirectWithFormError("/admin/company-goals", "Goal ID is required.");
  }

  const goals = await listCompanyGoals({ limit: 200 });
  const goal = goals.find((g) => g.id === id);
  if (!goal) {
    redirectWithFormError("/admin/company-goals", "Goal not found.");
  }

  await updateCompanyGoal(id, {
    ...goal,
    status: "active",
    approvedBy: "Management",
    dateApproved: new Date().toISOString().slice(0, 10),
  });

  revalidatePath("/admin/company-goals");
}

export default async function CompanyGoalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const periodFilter = params.period?.trim() || "";
  const statusFilter = params.status?.trim() || "";

  const goals = await listCompanyGoals({
    period: periodFilter,
    status: statusFilter,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Company goals"
        description="Set company-wide objectives that department goals and employee KPIs connect to."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Create company goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGoalAction} className="grid gap-4 md:grid-cols-2">
            <Input name="title" placeholder="Goal title" required />
            <Input name="period" defaultValue={currentPeriod()} placeholder="2026-06" required />
            <select
              name="priority"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="medium"
            >
              {HR_GOAL_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {humanizeLabel(p)}
                </option>
              ))}
            </select>
            <Input name="owner" placeholder="Owner" />
            <select
              name="status"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="draft"
            >
              {HR_GOAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanizeLabel(s)}
                </option>
              ))}
            </select>
            <Textarea
              name="description"
              placeholder="Description"
              className="md:col-span-2"
              rows={3}
            />
            <Button type="submit" className="md:col-span-2 w-fit">
              Save goal
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals ({goals.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No company goals yet.</p>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-lg border border-border p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.period} · {goal.owner || "No owner"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={goal.priority} />
                    <StatusBadge status={goal.status} />
                  </div>
                </div>
                {goal.description ? (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                ) : null}
                {goal.status === "draft" ? (
                  <form action={approveGoalAction}>
                    <input type="hidden" name="goalId" value={goal.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Approve & activate
                    </Button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
