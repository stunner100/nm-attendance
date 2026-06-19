import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { AddTaskStack } from "@/components/hr/add-task-stack";
import { TaskListAccordion } from "@/components/hr/task-list-accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, readFormRecordId, redirectWithFormSuccess, readFormSuccess } from "@/lib/hr/form-actions";
import {
  createTask,
  deleteTask,
  listHREmployeeOptions,
  listKpiCards,
  listTasks,
  updateTaskStatus,
} from "@/lib/hr-db";
import { HR_TASK_STATUSES } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{ status?: string; employeeId?: string; error?: string; success?: string }>;
};

async function createTaskAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/tasks");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const cardIdRaw = Number(formData.get("cardId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

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
  redirectWithFormSuccess("/admin/tasks", "Task created successfully.");
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

async function deleteTaskAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/tasks");

  const taskId = readFormRecordId(formData, "taskId");
  if (!taskId) {
    redirectWithFormError("/admin/tasks", "Task ID is required.");
  }

  const deleted = await deleteTask(taskId);
  if (!deleted) {
    redirectWithFormError("/admin/tasks", "Task not found.");
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
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
        description="Tasks linked to KPIs. Employees update progress; managers verify completion before it counts toward monthly scores."
      />

      <AdminFormAlert message={readFormError(params)} />
      <AdminFormAlert message={readFormSuccess(params)} variant="success" />

      <Card>
        <CardHeader>
          <CardTitle>Assign task</CardTitle>
        </CardHeader>
        <CardContent>
          <AddTaskStack
            createTaskAction={createTaskAction}
            employeeOptions={employees}
            kpiCards={kpiCards}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskListAccordion
            tasks={tasks}
            updateStatusAction={updateStatusAction}
            deleteTaskAction={deleteTaskAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
