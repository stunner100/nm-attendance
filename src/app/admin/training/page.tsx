import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { AssignTrainingStack } from "@/components/hr/assign-training-stack";
import { StatusBadge } from "@/components/hr/status-badge";
import { TrainingAssignmentAccordion } from "@/components/hr/training-assignment-accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError, redirectWithFormSuccess, readFormSuccess } from "@/lib/hr/form-actions";
import {
  createOnboardingChecklistItem,
  createTrainingAssignment,
  createTrainingModule,
  getTrainingModuleData,
  listHREmployeeOptions,
  listTrainingModuleOptions,
  updateOnboardingChecklistStatus,
  updateTrainingAssignmentStatus,
} from "@/lib/hr-db";
import { HR_TRAINING_STATUSES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type TrainingPageProps = {
  searchParams: Promise<{ category?: string; assignmentStatus?: string; error?: string; success?: string }>;
};

async function createModuleAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/training");

  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const durationHours = Number(formData.get("durationHours") ?? "");

  if (!code || !title || !category) {
    redirectWithFormError("/admin/training", "Module code, title, and category are required.");
  }

  await createTrainingModule({
    code,
    title,
    category,
    durationHours: Number.isFinite(durationHours) ? durationHours : 0,
  });

  revalidatePath("/admin/training");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/training", "Training module saved successfully.");
}

async function createAssignmentAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/training");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const moduleId = Number(formData.get("moduleId") ?? "");
  const status = String(formData.get("status") ?? "assigned").trim();
  const assignedAt = String(formData.get("assignedAt") ?? "").trim();

  if (!Number.isFinite(employeeId) || !Number.isFinite(moduleId)) {
    redirectWithFormError("/admin/training", "Employee and training module are required.");
  }
  if (!HR_TRAINING_STATUSES.includes(status as (typeof HR_TRAINING_STATUSES)[number])) {
    redirectWithFormError("/admin/training", "Select a valid training status.");
  }

  await createTrainingAssignment({
    employeeId,
    moduleId,
    status: status as (typeof HR_TRAINING_STATUSES)[number],
    assignedAt: assignedAt || undefined,
  });

  revalidatePath("/admin/training");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/training", "Training assigned successfully.");
}

async function createOnboardingAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/training");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const itemName = String(formData.get("itemName") ?? "").trim();
  const status = String(formData.get("status") ?? "pending").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!Number.isFinite(employeeId) || !itemName) {
    redirectWithFormError("/admin/training", "Employee and onboarding item name are required.");
  }
  if (status !== "pending" && status !== "completed") {
    redirectWithFormError("/admin/training", "Select a valid onboarding status.");
  }

  await createOnboardingChecklistItem({
    employeeId,
    itemName,
    status,
    dueDate: dueDate || undefined,
  });

  revalidatePath("/admin/training");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/training", "Onboarding checklist item added successfully.");
}

async function updateAssignmentStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/training");

  const assignmentId = Number(formData.get("assignmentId") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(assignmentId)) {
    redirectWithFormError("/admin/training", "Assignment ID is required.");
  }
  if (!HR_TRAINING_STATUSES.includes(status as (typeof HR_TRAINING_STATUSES)[number])) {
    redirectWithFormError("/admin/training", "Select a valid training status.");
  }

  await updateTrainingAssignmentStatus(
    assignmentId,
    status as (typeof HR_TRAINING_STATUSES)[number]
  );
  revalidatePath("/admin/training");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/training", "Training status updated successfully.");
}

async function updateOnboardingStatusAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/training");

  const checklistId = Number(formData.get("checklistId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  if (!Number.isFinite(checklistId) || (status !== "pending" && status !== "completed")) {
    redirectWithFormError("/admin/training", "Valid checklist ID and status are required.");
  }

  await updateOnboardingChecklistStatus(checklistId, status);
  revalidatePath("/admin/training");
  revalidatePath("/admin");
  redirectWithFormSuccess("/admin/training", "Onboarding status updated successfully.");
}

export default async function TrainingPage({ searchParams }: TrainingPageProps) {
  const params = await searchParams;

  const categoryFilter = params.category?.trim() || "";
  const assignmentStatusFilter = params.assignmentStatus?.trim() || "";

  const [data, employees, moduleOptions] = await Promise.all([
    getTrainingModuleData({
      category: categoryFilter,
      assignmentStatus: assignmentStatusFilter,
    }),
    listHREmployeeOptions(),
    listTrainingModuleOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Monitor onboarding completion and training curriculum progress."
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
              <span className="mb-1 block text-xs text-muted-foreground">Module category</span>
              <Input defaultValue={categoryFilter} name="category" placeholder="e.g. CS" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Assignment status</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={assignmentStatusFilter}
                name="assignmentStatus"
              >
                <option value="">All statuses</option>
                {HR_TRAINING_STATUSES.map((status) => (
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
            <CardTitle>Create Training Module</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createModuleAction} className="grid gap-3">
              <Input name="code" placeholder="Module code" required />
              <Input name="title" placeholder="Module title" required />
              <Input name="category" placeholder="Category (CS, Onboarding...)" required />
              <Input name="durationHours" placeholder="Duration (hours)" step="0.25" type="number" />
              <Button type="submit">Save Module</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign to Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignTrainingStack
              employees={employees}
              moduleOptions={moduleOptions}
              createAssignmentAction={createAssignmentAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Checklist Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createOnboardingAction} className="grid gap-3">
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
              <Input name="itemName" placeholder="Checklist item" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                defaultValue="pending"
                name="status"
              >
                <option value="pending">{humanizeLabel("pending")}</option>
                <option value="completed">{humanizeLabel("completed")}</option>
              </select>
              <Input name="dueDate" type="date" />
              <Button type="submit">Save Checklist Item</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Modules ({data.modules.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create your first training module to get started.</p>
          ) : (
            data.modules.map((module) => (
              <div key={module.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {module.code} - {module.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {module.category} {"\u2022"} {module.duration_hours} hours
                  </p>
                </div>
                <StatusBadge status={module.active ? "active" : "inactive"} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments ({data.assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingAssignmentAccordion
            assignments={data.assignments}
            employees={employees}
            moduleOptions={moduleOptions}
            updateAssignmentStatusAction={updateAssignmentStatusAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Checklist ({data.onboarding.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.onboarding.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add your first onboarding checklist item to get started.</p>
          ) : (
            data.onboarding.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {item.due_date || "Not set"}
                  </p>
                </div>
                <form action={updateOnboardingStatusAction} className="flex items-center gap-2">
                  <input name="checklistId" type="hidden" value={item.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={item.status}
                    name="status"
                  >
                    <option value="pending">{humanizeLabel("pending")}</option>
                    <option value="completed">{humanizeLabel("completed")}</option>
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save
                  </Button>
                  <StatusBadge status={item.status} />
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
