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
  createTask,
  listHREmployeeOptions,
  listKpiCards,
  listTasks,
  updateTaskStatus,
} from "@/lib/hr-db";
import { HR_TASK_PRIORITIES, HR_TASK_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ status?: string; employeeId?: string; error?: string }>;
};

async function createTaskAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/tasks");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const cardIdRaw = Number(formData.get("cardId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium").trim();

  if (!Number.isFinite(employeeId) || !title) {
    redirectWithFormError("/admin/tasks", "Employee and task title are required.");
  }

  await createTask({
    employeeId,
    cardId: Number.isFinite(cardIdRaw) ? cardIdRaw : null,
    title,
    description: description || null,
    dueDate: dueDate || null,
    status: "not_started",
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
}

async function updateStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/tasks");

  const taskId = Number(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("qualityNote") ?? "").trim();

  if (!Number.isFinite(taskId)) {
    redirectWithFormError("/admin/tasks", "Task ID is required.");
  }
  if (!HR_TASK_STATUSES.includes(status as (typeof HR_TASK_STATUSES)[number])) {
    redirectWithFormError("/admin/tasks", "Invalid task status.");
  }

  await updateTaskStatus(
    taskId,
    status as (typeof HR_TASK_STATUSES)[number],
    note || null
  );

  revalidatePath("/admin/tasks");
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status?.trim() || "";
  const employeeIdFilter = Number(params.employeeId ?? "");

  const [tasks, employees, kpiCards] = await Promise.all([
    listTasks({
      status: statusFilter,
      employeeId: Number.isFinite(employeeIdFilter) ? employeeIdFilter : undefined,
      limit: 100,
    }),
    listHREmployeeOptions(),
    listKpiCards({ status: "active", limit: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Task tracker"
        description="Tasks linked to KPIs. Employees update progress; managers verify completion before it counts toward monthly scores."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Assign task</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTaskAction} className="grid gap-4 md:grid-cols-2">
            <select
              name="employeeId"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
            <select
              name="cardId"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Link KPI card (optional)</option>
              {kpiCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.employee_name} · {c.period}
                </option>
              ))}
            </select>
            <Input name="title" placeholder="Task title" required className="md:col-span-2" />
            <Input name="dueDate" type="date" />
            <select
              name="priority"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="medium"
            >
              {HR_TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {humanizeLabel(p)}
                </option>
              ))}
            </select>
            <Textarea
              name="description"
              placeholder="Description"
              className="md:col-span-2"
              rows={2}
            />
            <Button type="submit" className="w-fit">
              Create task
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.employee_name}
                    {task.due_date ? ` · Due ${task.due_date}` : ""}
                    {task.card_id ? ` · KPI #${task.card_id}` : ""}
                  </p>
                </div>
                <form action={updateStatusAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="taskId" value={task.id} />
                  <StatusBadge status={task.status} />
                  <select
                    name="status"
                    defaultValue={task.status}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {HR_TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {humanizeLabel(s)}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    Update
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
