import bcrypt from "bcryptjs";

import { ensureDbSchema, getDbPool } from "@/lib/db";
import { HR_JOB_LEVELS, type HRJobLevel } from "@/lib/types";

export type AuthUserRecord = {
  id: number;
  email: string;
  passwordHash: string;
  role: string;
  employeeId: number | null;
  jobLevel: HRJobLevel | null;
  employeeName: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
};

type AuthUserRow = {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  employee_id: number | null;
  job_level: string | null;
  employee_name: string | null;
  onboarding_completed_at: string | Date | null;
  created_at: string | Date;
};

export type CreateSignupUserInput = {
  email: string;
  password: string;
  employeeId: number;
  jobLevel: HRJobLevel;
};

const MIN_PASSWORD_LENGTH = 8;

export function isSignupOpen(): boolean {
  return process.env.SIGNUP_OPEN === "true";
}

export function getAuthSessionVersion(): string {
  return process.env.AUTH_SESSION_VERSION?.trim() || "1";
}

function normalizeAuthUserRow(row: AuthUserRow): AuthUserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    employeeId: row.employee_id,
    jobLevel:
      row.job_level && HR_JOB_LEVELS.includes(row.job_level as HRJobLevel)
        ? (row.job_level as HRJobLevel)
        : null,
    employeeName: row.employee_name,
    onboardingCompletedAt: row.onboarding_completed_at
      ? typeof row.onboarding_completed_at === "string"
        ? row.onboarding_completed_at
        : row.onboarding_completed_at.toISOString()
      : null,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
  };
}

const authUserSelect = `
  SELECT
    u.id,
    u.email,
    u.password_hash,
    u.role,
    u.employee_id,
    u.job_level,
    e.full_name AS employee_name,
    u.onboarding_completed_at,
    u.created_at
  FROM users u
  LEFT JOIN hr_employees e ON e.id = u.employee_id
`;

export async function getAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
  await ensureDbSchema();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const pool = getDbPool();
  const result = await pool.query<AuthUserRow>(
    `
      ${authUserSelect}
      WHERE u.email = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return normalizeAuthUserRow(result.rows[0]);
}

export async function listEmployeesForSignup(): Promise<
  Array<{ id: number; fullName: string; department: string }>
> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query<{ id: number; full_name: string; department: string }>(
    `
      SELECT e.id, e.full_name, e.department
      FROM hr_employees e
      WHERE e.employment_status = 'active'
        AND btrim(e.full_name) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.employee_id = e.id
        )
      ORDER BY e.full_name ASC
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    department: row.department,
  }));
}

export async function createSignupUser(
  input: CreateSignupUserInput
): Promise<AuthUserRecord> {
  if (!isSignupOpen()) {
    throw new Error("Sign-up is closed.");
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const employeeId = input.employeeId;
  const jobLevel = input.jobLevel;

  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required.");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  if (!HR_JOB_LEVELS.includes(jobLevel)) {
    throw new Error("Select a valid job level.");
  }

  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    throw new Error("Select your employee profile.");
  }

  await ensureDbSchema();
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const employeeResult = await client.query<{ id: number; employment_status: string }>(
      `
        SELECT id, employment_status
        FROM hr_employees
        WHERE id = $1
        LIMIT 1
      `,
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      throw new Error("That employee profile was not found.");
    }

    if (employeeResult.rows[0].employment_status !== "active") {
      throw new Error("That employee profile is not active.");
    }

    const takenEmployee = await client.query(
      `SELECT id FROM users WHERE employee_id = $1 LIMIT 1`,
      [employeeId]
    );
    if ((takenEmployee.rowCount ?? 0) > 0) {
      throw new Error("That employee profile already has a login.");
    }

    const takenEmail = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    if ((takenEmail.rowCount ?? 0) > 0) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const insertResult = await client.query<{ id: number }>(
      `
        INSERT INTO users (
          email, password_hash, role, employee_id, job_level, onboarding_completed_at
        )
        VALUES ($1, $2, 'admin', $3, $4, NOW())
        RETURNING id
      `,
      [email, passwordHash, employeeId, jobLevel]
    );

    const userId = insertResult.rows[0]?.id;
    if (!userId) {
      throw new Error("Unable to create account.");
    }

    await client.query(
      `
        UPDATE hr_employees
        SET job_level = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [employeeId, jobLevel]
    );

    await client.query("COMMIT");

    const created = await getAuthUserByEmail(email);
    if (!created) {
      throw new Error("Account created but could not be loaded.");
    }

    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
