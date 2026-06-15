import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRDepartment, HRRecruitmentApplicant, HRRecruitmentRole, HRRecruitmentStage } from "@/lib/types";
import { HR_DEPARTMENTS, HR_RECRUITMENT_STAGES } from "@/lib/types";
import {
  applyListLimit,
  asNullableDateOnly,
  asNumber,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  normalizeApplicant,
  normalizeRole,
} from "@/lib/hr/shared";
import type {
  CreateRecruitmentApplicantInput,
  CreateRecruitmentRoleInput,
} from "@/lib/hr/types";

export type ListRecruitmentRolesOptions = {
  department?: string;
  limit?: number;
};

export type HRRecruitmentRoleOption = {
  id: number;
  title: string;
  department: HRDepartment;
  closed_at: string | null;
};

export async function listRecruitmentRoles(
  options: ListRecruitmentRolesOptions = {}
): Promise<HRRecruitmentRole[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.department?.trim()) {
    values.push(options.department.trim());
    conditions.push(`department = $${values.length}`);
  }

  let query = `
    SELECT id, title, department, hiring_stage, vacancies, opened_at, closed_at, created_at
    FROM hr_recruitment_roles
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY opened_at DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeRole);
}

export async function listRecruitmentRoleOptions(): Promise<HRRecruitmentRoleOption[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`
    SELECT id, title, department, closed_at
    FROM hr_recruitment_roles
    ORDER BY closed_at ASC NULLS FIRST, opened_at DESC, id DESC
  `);

  return asRecordRows(result.rows).map((row) => ({
    id: asNumber(row.id),
    title: asString(row.title),
    department: asString(row.department) as HRDepartment,
    closed_at: asNullableDateOnly(row.closed_at),
  }));
}

export async function createRecruitmentRole(
  input: CreateRecruitmentRoleInput
): Promise<HRRecruitmentRole> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_recruitment_roles (
        title, department, hiring_stage, vacancies, opened_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, department, hiring_stage, vacancies, opened_at, closed_at, created_at
    `,
    [
      input.title.trim(),
      ensureEnumValue(input.department, HR_DEPARTMENTS, "department"),
      input.hiringStage?.trim() || "screening",
      Math.max(1, Number(input.vacancies || 1)),
      ensureDateOnly(input.openedAt) || new Date().toISOString().slice(0, 10),
    ]
  );
  return normalizeRole(asRecordRows(result.rows)[0]);
}

export async function updateRecruitmentRole(
  roleId: number,
  patch: { hiringStage?: string; vacancies?: number; closedAt?: string | null }
): Promise<HRRecruitmentRole | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_recruitment_roles
      SET hiring_stage = COALESCE($2, hiring_stage),
          vacancies = COALESCE($3, vacancies),
          closed_at = COALESCE($4, closed_at)
      WHERE id = $1
      RETURNING id, title, department, hiring_stage, vacancies, opened_at, closed_at, created_at
    `,
    [roleId, patch.hiringStage ?? null, patch.vacancies ?? null, ensureDateOnly(patch.closedAt)]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeRole(asRecordRows(result.rows)[0]);
}

export async function listRecruitmentApplicants(options: {
  stage?: string;
  limit?: number;
} = {}): Promise<HRRecruitmentApplicant[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.stage?.trim()) {
    values.push(options.stage.trim());
    conditions.push(`current_stage = $${values.length}`);
  }

  let query = `
    SELECT
      id, role_id, full_name, email, employment_track, current_stage,
      applied_at, offered_at, hired_at, offer_status, created_at
    FROM hr_recruitment_applicants
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY applied_at DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeApplicant);
}

export async function createRecruitmentApplicant(
  input: CreateRecruitmentApplicantInput
): Promise<HRRecruitmentApplicant> {
  await ensureDbSchema();
  const pool = getDbPool();

  const stage = ensureEnumValue(
    input.currentStage || "applied",
    HR_RECRUITMENT_STAGES,
    "currentStage"
  );

  const result = await pool.query(
    `
      INSERT INTO hr_recruitment_applicants (
        role_id, full_name, email, employment_track, current_stage, applied_at
      )
      VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6)
      RETURNING
        id, role_id, full_name, email, employment_track, current_stage,
        applied_at, offered_at, hired_at, offer_status, created_at
    `,
    [
      input.roleId,
      input.fullName.trim(),
      input.email?.trim() || null,
      input.employmentTrack,
      stage,
      ensureDateOnly(input.appliedAt) || new Date().toISOString().slice(0, 10),
    ]
  );

  const applicant = normalizeApplicant(asRecordRows(result.rows)[0]);
  await pool.query(
    `
      INSERT INTO hr_recruitment_stage_events (applicant_id, stage)
      VALUES ($1, $2)
    `,
    [applicant.id, stage]
  );

  return applicant;
}

export async function updateRecruitmentApplicantStage(
  applicantId: number,
  stage: HRRecruitmentStage,
  patch?: { offeredAt?: string | null; hiredAt?: string | null; offerStatus?: string | null }
): Promise<HRRecruitmentApplicant | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_recruitment_applicants
      SET current_stage = $2,
          offered_at = COALESCE($3, offered_at),
          hired_at = COALESCE($4, hired_at),
          offer_status = COALESCE($5, offer_status)
      WHERE id = $1
      RETURNING
        id, role_id, full_name, email, employment_track, current_stage,
        applied_at, offered_at, hired_at, offer_status, created_at
    `,
    [
      applicantId,
      stage,
      ensureDateOnly(patch?.offeredAt),
      ensureDateOnly(patch?.hiredAt),
      patch?.offerStatus || null,
    ]
  );
  if (result.rows.length === 0) {
    return null;
  }

  await pool.query(
    `
      INSERT INTO hr_recruitment_stage_events (applicant_id, stage)
      VALUES ($1, $2)
    `,
    [applicantId, stage]
  );

  return normalizeApplicant(asRecordRows(result.rows)[0]);
}
