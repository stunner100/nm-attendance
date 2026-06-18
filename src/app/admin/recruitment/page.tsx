import { revalidatePath } from "next/cache";

import { AddApplicantStack } from "@/components/hr/add-applicant-stack";
import { AddRoleStack } from "@/components/hr/add-role-stack";
import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { RecruitmentApplicantsAccordion } from "@/components/hr/recruitment-applicants-accordion";
import { RecruitmentRolesAccordion } from "@/components/hr/recruitment-roles-accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecruitmentModuleData } from "@/lib/hr-db";
import {
  createRecruitmentApplicant,
  createRecruitmentRole,
  listRecruitmentRoleOptions,
  updateRecruitmentApplicantStage,
} from "@/lib/hr-db";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import { HR_DEPARTMENTS, HR_RECRUITMENT_STAGES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type RecruitmentPageProps = {
  searchParams: Promise<{ department?: string; stage?: string; error?: string }>;
};

async function createRoleAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/recruitment");

  const title = String(formData.get("title") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const vacancies = Number(formData.get("vacancies") ?? 1);
  const openedAt = String(formData.get("openedAt") ?? "").trim();

  if (!title || !HR_DEPARTMENTS.includes(department as (typeof HR_DEPARTMENTS)[number])) {
    redirectWithFormError("/admin/recruitment", "Role title and a valid department are required.");
  }

  await createRecruitmentRole({
    title,
    department: department as (typeof HR_DEPARTMENTS)[number],
    vacancies: Number.isFinite(vacancies) && vacancies > 0 ? vacancies : 1,
    openedAt: openedAt || undefined,
  });

  revalidatePath("/admin/recruitment");
  revalidatePath("/admin");
}

async function createApplicantAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/recruitment");

  const roleId = Number(formData.get("roleId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const employmentTrack = String(formData.get("employmentTrack") ?? "full_time");
  const currentStage = String(formData.get("currentStage") ?? "applied");
  const appliedAt = String(formData.get("appliedAt") ?? "").trim();

  if (!Number.isFinite(roleId) || !fullName) {
    redirectWithFormError("/admin/recruitment", "Role and applicant name are required.");
  }
  if (employmentTrack !== "intern" && employmentTrack !== "full_time") {
    redirectWithFormError("/admin/recruitment", "Select a valid employment track.");
  }
  if (
    !HR_RECRUITMENT_STAGES.includes(
      currentStage as (typeof HR_RECRUITMENT_STAGES)[number]
    )
  ) {
    redirectWithFormError("/admin/recruitment", "Select a valid recruitment stage.");
  }

  await createRecruitmentApplicant({
    roleId,
    fullName,
    email: email || null,
    employmentTrack,
    currentStage: currentStage as (typeof HR_RECRUITMENT_STAGES)[number],
    appliedAt: appliedAt || undefined,
  });

  revalidatePath("/admin/recruitment");
  revalidatePath("/admin");
}

async function updateApplicantStageAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/recruitment");

  const applicantId = Number(formData.get("applicantId") ?? "");
  const stage = String(formData.get("stage") ?? "").trim();

  if (!Number.isFinite(applicantId)) {
    redirectWithFormError("/admin/recruitment", "Applicant ID is required.");
  }
  if (!HR_RECRUITMENT_STAGES.includes(stage as (typeof HR_RECRUITMENT_STAGES)[number])) {
    redirectWithFormError("/admin/recruitment", "Select a valid recruitment stage.");
  }

  await updateRecruitmentApplicantStage(
    applicantId,
    stage as (typeof HR_RECRUITMENT_STAGES)[number]
  );

  revalidatePath("/admin/recruitment");
  revalidatePath("/admin");
}

export default async function RecruitmentPage({ searchParams }: RecruitmentPageProps) {
  const params = await searchParams;
  const selectedDepartment = params.department?.trim() || "";
  const selectedStage = params.stage?.trim() || "";

  const [data, roleOptions] = await Promise.all([
    getRecruitmentModuleData({
      department: selectedDepartment,
      stage: selectedStage,
    }),
    listRecruitmentRoleOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Track open roles, applicant progression, and hiring conversion."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Department</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                name="department"
                defaultValue={selectedDepartment}
              >
                <option value="">All departments</option>
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Applicant stage</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                name="stage"
                defaultValue={selectedStage}
              >
                <option value="">All stages</option>
                {HR_RECRUITMENT_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {humanizeLabel(stage)}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Role</CardTitle>
          </CardHeader>
          <CardContent>
            <AddRoleStack createRoleAction={createRoleAction} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Applicant</CardTitle>
          </CardHeader>
          <CardContent>
            <AddApplicantStack
              roleOptions={roleOptions}
              createApplicantAction={createApplicantAction}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Roles ({data.roles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <RecruitmentRolesAccordion roles={data.roles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applicants ({data.applicants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <RecruitmentApplicantsAccordion
            applicants={data.applicants}
            roles={data.roles}
            updateApplicantStageAction={updateApplicantStageAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
