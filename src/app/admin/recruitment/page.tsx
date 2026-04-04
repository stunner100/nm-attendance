import { revalidatePath } from "next/cache";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getRecruitmentModuleData } from "@/lib/hr-db";
import {
  createRecruitmentApplicant,
  createRecruitmentRole,
  listRecruitmentRoleOptions,
  updateRecruitmentApplicantStage,
} from "@/lib/hr-db";
import { requireAdminPage } from "@/lib/admin-auth";
import { HR_DEPARTMENTS, HR_RECRUITMENT_STAGES } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type RecruitmentPageProps = {
  searchParams: Promise<{ department?: string; stage?: string }>;
};

async function createRoleAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminPage("/admin/recruitment");

  const title = String(formData.get("title") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const vacancies = Number(formData.get("vacancies") ?? 1);
  const openedAt = String(formData.get("openedAt") ?? "").trim();

  if (!title || !HR_DEPARTMENTS.includes(department as (typeof HR_DEPARTMENTS)[number])) {
    return;
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
    return;
  }
  if (employmentTrack !== "intern" && employmentTrack !== "full_time") {
    return;
  }
  if (
    !HR_RECRUITMENT_STAGES.includes(
      currentStage as (typeof HR_RECRUITMENT_STAGES)[number]
    )
  ) {
    return;
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
    return;
  }
  if (!HR_RECRUITMENT_STAGES.includes(stage as (typeof HR_RECRUITMENT_STAGES)[number])) {
    return;
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
        title="Recruitment Pipeline"
        description="Track open roles, applicant progression, and hiring conversion."
      />

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
              <form action={createRoleAction} className="grid gap-3 sm:grid-cols-2">
                <Input name="title" placeholder="Role title" required />
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  name="department"
                  required
                  defaultValue="Tech"
                >
                  {HR_DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <Input name="vacancies" type="number" min={1} placeholder="Vacancies" />
                <Input name="openedAt" type="date" />
                <div className="sm:col-span-2">
                  <Button type="submit">Create Role</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Applicant</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createApplicantAction} className="grid gap-3 sm:grid-cols-2">
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm sm:col-span-2"
                  name="roleId"
                  required
                  defaultValue=""
                >
                  <option disabled value="">
                    Select role
                  </option>
                  {roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({role.department})
                    </option>
                  ))}
                </select>
                <Input name="fullName" placeholder="Applicant full name" required />
                <Input name="email" placeholder="Applicant email" type="email" />
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  name="employmentTrack"
                  defaultValue="full_time"
                >
                  <option value="full_time">{humanizeLabel("full_time")}</option>
                  <option value="intern">{humanizeLabel("intern")}</option>
                </select>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  name="currentStage"
                  defaultValue="applied"
                >
                  {HR_RECRUITMENT_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {humanizeLabel(stage)}
                    </option>
                  ))}
                </select>
                <Input className="sm:col-span-2" name="appliedAt" type="date" />
                <div className="sm:col-span-2">
                  <Button type="submit">Add Applicant</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Open Roles ({data.roles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open roles. Create one above to start tracking applicants.</p>
            ) : (
              data.roles.map((role) => (
                <div
                  key={role.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{role.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {role.department} &bull; Vacancies: {role.vacancies} &bull; Opened {role.opened_at}
                    </p>
                  </div>
                  <StatusBadge status={role.hiring_stage} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applicants ({data.applicants.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.applicants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applicants yet. Add one above to start tracking the hiring pipeline.
              </p>
            ) : (
              data.applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{applicant.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stage: {humanizeLabel(applicant.current_stage)} &bull; Applied {applicant.applied_at}
                    </p>
                  </div>
                  <form action={updateApplicantStageAction} className="flex items-center gap-2">
                    <input name="applicantId" type="hidden" value={applicant.id} />
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      defaultValue={applicant.current_stage}
                      name="stage"
                    >
                      {HR_RECRUITMENT_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {humanizeLabel(stage)}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" type="submit" variant="outline">
                      Update
                    </Button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Role</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createRoleAction} className="grid gap-3 sm:grid-cols-2">
              <Input name="title" placeholder="Role title" required />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                name="department"
                required
                defaultValue="Tech"
              >
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <Input name="vacancies" type="number" min={1} placeholder="Vacancies" />
              <Input name="openedAt" type="date" />
              <div className="sm:col-span-2">
                <Button type="submit">Create Role</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Applicant</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createApplicantAction} className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm sm:col-span-2"
                name="roleId"
                required
                defaultValue=""
              >
                <option disabled value="">
                  Select role
                </option>
                {roleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title} ({role.department})
                  </option>
                ))}
              </select>
              <Input name="fullName" placeholder="Applicant full name" required />
              <Input name="email" placeholder="Applicant email" type="email" />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                name="employmentTrack"
                defaultValue="full_time"
              >
                <option value="full_time">full_time</option>
                <option value="intern">intern</option>
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                name="currentStage"
                defaultValue="applied"
              >
                {HR_RECRUITMENT_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <Input className="sm:col-span-2" name="appliedAt" type="date" />
              <div className="sm:col-span-2">
                <Button type="submit">Create Applicant</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Roles ({data.roles.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles found for the current filters.</p>
          ) : (
            data.roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{role.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {role.department} • Vacancies: {role.vacancies} • Opened {role.opened_at}
                  </p>
                </div>
                <StatusBadge status={role.hiring_stage} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applicant Funnel ({data.applicants.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.applicants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No applicants found for the current filters.
            </p>
          ) : (
            data.applicants.map((applicant) => (
              <div
                key={applicant.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{applicant.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stage: {applicant.current_stage} • Applied {applicant.applied_at}
                  </p>
                </div>
                <form action={updateApplicantStageAction} className="flex items-center gap-2">
                  <input name="applicantId" type="hidden" value={applicant.id} />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    defaultValue={applicant.current_stage}
                    name="stage"
                  >
                    {HR_RECRUITMENT_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline">
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
