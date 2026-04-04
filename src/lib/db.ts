import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

import type { AttendanceRow } from "@/lib/types";
import {
  normalizeRosterName,
  normalizeRosterNames,
  splitRosterNames,
} from "@/lib/roster";

type InsertAttendanceInput = {
  name: string;
  scanToken: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  location?: string | null;
};

type AttendanceRowDb = Omit<AttendanceRow, "created_at"> & {
  created_at: string | Date;
};

type AuthUserDb = {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  created_at: string | Date;
};

export class CheckinRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckinRejectedError";
  }
}

export type AuthUser = {
  id: number;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
};

const globalForDb = globalThis as unknown as {
  pool?: Pool;
  baseSchemaInitPromise?: Promise<void>;
  hrSchemaInitPromise?: Promise<void>;
  adminSeedPromise?: Promise<void>;
  employeeSeedPromise?: Promise<void>;
};

const CHECKIN_SCAN_TOKEN_TTL_MINUTES = 30;

function normalizeEmployeeName(name: string): string {
  return normalizeRosterName(name);
}

function hashCheckinScanToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getPool(): Pool {
  if (globalForDb.pool) {
    return globalForDb.pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local and Vercel environment variables."
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  globalForDb.pool = pool;
  return pool;
}

export function getDbPool(): Pool {
  return getPool();
}

async function ensureBaseSchema(): Promise<void> {
  if (globalForDb.baseSchemaInitPromise) {
    return globalForDb.baseSchemaInitPromise;
  }

  globalForDb.baseSchemaInitPromise = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        timestamp   TEXT NOT NULL,
        latitude    DOUBLE PRECISION,
        longitude   DOUBLE PRECISION,
        location    TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS employees (
        id   SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'admin',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checkin_scan_tokens (
        id          SERIAL PRIMARY KEY,
        token_hash  TEXT NOT NULL UNIQUE,
        expires_at  TIMESTAMPTZ NOT NULL,
        used_at     TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  })();

  return globalForDb.baseSchemaInitPromise;
}

async function ensureHrSchema(): Promise<void> {
  await ensureBaseSchema();

  if (globalForDb.hrSchemaInitPromise) {
    return globalForDb.hrSchemaInitPromise;
  }

  globalForDb.hrSchemaInitPromise = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        id                   SERIAL PRIMARY KEY,
        employee_code        TEXT NOT NULL UNIQUE,
        full_name            TEXT NOT NULL,
        work_email           TEXT UNIQUE,
        department           TEXT NOT NULL CHECK (department IN ('Operations', 'Marketing', 'Tech', 'Finance & HR')),
        contract_type        TEXT NOT NULL CHECK (contract_type IN ('full_time', 'part_time', 'intern', 'contractor')),
        employment_status    TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated', 'resigned')),
        manager_employee_id  INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
        hire_date            DATE NOT NULL,
        probation_end_date   DATE,
        contract_end_date    DATE,
        exit_date            DATE,
        exit_type            TEXT CHECK (exit_type IN ('voluntary', 'involuntary')),
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_recruitment_roles (
        id            SERIAL PRIMARY KEY,
        title         TEXT NOT NULL,
        department    TEXT NOT NULL CHECK (department IN ('Operations', 'Marketing', 'Tech', 'Finance & HR')),
        hiring_stage  TEXT NOT NULL DEFAULT 'screening',
        vacancies     INTEGER NOT NULL DEFAULT 1,
        opened_at     DATE NOT NULL DEFAULT CURRENT_DATE,
        closed_at     DATE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_recruitment_applicants (
        id               SERIAL PRIMARY KEY,
        role_id          INTEGER NOT NULL REFERENCES hr_recruitment_roles(id) ON DELETE CASCADE,
        full_name        TEXT NOT NULL,
        email            TEXT,
        employment_track TEXT NOT NULL CHECK (employment_track IN ('intern', 'full_time')),
        current_stage    TEXT NOT NULL DEFAULT 'applied' CHECK (current_stage IN ('applied', 'screened', 'interviewed', 'offered', 'hired')),
        applied_at       DATE NOT NULL DEFAULT CURRENT_DATE,
        offered_at       DATE,
        hired_at         DATE,
        offer_status     TEXT CHECK (offer_status IN ('pending', 'accepted', 'rejected')),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_recruitment_stage_events (
        id            SERIAL PRIMARY KEY,
        applicant_id  INTEGER NOT NULL REFERENCES hr_recruitment_applicants(id) ON DELETE CASCADE,
        stage         TEXT NOT NULL CHECK (stage IN ('applied', 'screened', 'interviewed', 'offered', 'hired')),
        changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_disciplinary_cases (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
        category      TEXT NOT NULL,
        status        TEXT NOT NULL CHECK (status IN ('warning_issued', 'resolved', 'escalated')),
        summary       TEXT NOT NULL,
        opened_at     DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date      DATE,
        resolved_at   DATE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_policy_violations (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
        category      TEXT NOT NULL,
        severity      TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        notes         TEXT,
        occurred_on   DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_followup_actions (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
        action_type   TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
        due_date      DATE,
        notes         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_payroll_cycles (
        id            SERIAL PRIMARY KEY,
        cycle_month   DATE NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('processed', 'pending', 'issues_flagged')),
        processed_at  DATE,
        notes         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (cycle_month)
      );

      CREATE TABLE IF NOT EXISTS hr_payroll_anomalies (
        id                SERIAL PRIMARY KEY,
        payroll_cycle_id  INTEGER NOT NULL REFERENCES hr_payroll_cycles(id) ON DELETE CASCADE,
        employee_id       INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
        anomaly_type      TEXT NOT NULL,
        status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
        details           TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_leave_balances (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER NOT NULL UNIQUE REFERENCES hr_employees(id) ON DELETE CASCADE,
        annual_days   NUMERIC(8,2) NOT NULL DEFAULT 0,
        used_days     NUMERIC(8,2) NOT NULL DEFAULT 0,
        carry_days    NUMERIC(8,2) NOT NULL DEFAULT 0,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_leave_requests (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        leave_type    TEXT NOT NULL,
        start_date    DATE NOT NULL,
        end_date      DATE NOT NULL,
        days          NUMERIC(8,2) NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at   TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS hr_performance_reviews (
        id                   SERIAL PRIMARY KEY,
        employee_id          INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        review_period        TEXT NOT NULL,
        due_date             DATE NOT NULL,
        completed_at         DATE,
        status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
        reviewer_employee_id INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
        notes                TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_pips (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        status        TEXT NOT NULL CHECK (status IN ('active', 'improving', 'completed', 'failed')),
        start_date    DATE NOT NULL,
        end_date      DATE,
        progress_note TEXT,
        last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_kpi_scores (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        metric_name   TEXT NOT NULL,
        score         NUMERIC(8,2) NOT NULL,
        period_start  DATE NOT NULL,
        period_end    DATE NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_training_modules (
        id              SERIAL PRIMARY KEY,
        code            TEXT NOT NULL UNIQUE,
        title           TEXT NOT NULL,
        category        TEXT NOT NULL,
        duration_hours  NUMERIC(8,2) NOT NULL DEFAULT 0,
        active          BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_training_assignments (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        module_id     INTEGER NOT NULL REFERENCES hr_training_modules(id) ON DELETE CASCADE,
        status        TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
        assigned_at   DATE NOT NULL DEFAULT CURRENT_DATE,
        completed_at  DATE
      );

      CREATE TABLE IF NOT EXISTS hr_onboarding_checklists (
        id            SERIAL PRIMARY KEY,
        employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        item_name     TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
        due_date      DATE,
        completed_at  DATE
      );

      CREATE TABLE IF NOT EXISTS hr_import_runs (
        id            SERIAL PRIMARY KEY,
        scope         TEXT NOT NULL,
        dry_run       BOOLEAN NOT NULL DEFAULT TRUE,
        rows_total    INTEGER NOT NULL DEFAULT 0,
        rows_success  INTEGER NOT NULL DEFAULT 0,
        rows_failed   INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_hr_employees_department ON hr_employees(department);
      CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON hr_employees(employment_status);
      CREATE INDEX IF NOT EXISTS idx_hr_recruitment_applicants_stage ON hr_recruitment_applicants(current_stage);
      CREATE INDEX IF NOT EXISTS idx_hr_recruitment_roles_opened_at ON hr_recruitment_roles(opened_at);
      CREATE INDEX IF NOT EXISTS idx_hr_followup_actions_due_status ON hr_followup_actions(status, due_date);
      CREATE INDEX IF NOT EXISTS idx_hr_disciplinary_cases_status ON hr_disciplinary_cases(status);
      CREATE INDEX IF NOT EXISTS idx_hr_payroll_cycles_status ON hr_payroll_cycles(status);
      CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_status ON hr_leave_requests(status);
      CREATE INDEX IF NOT EXISTS idx_hr_performance_reviews_status ON hr_performance_reviews(status);
      CREATE INDEX IF NOT EXISTS idx_hr_pips_status ON hr_pips(status);
      CREATE INDEX IF NOT EXISTS idx_hr_training_assignments_status ON hr_training_assignments(status);
    `);
  })();

  return globalForDb.hrSchemaInitPromise;
}

export async function ensureDbSchema(): Promise<void> {
  await ensureHrSchema();
}

export async function ensureBaseDbSchema(): Promise<void> {
  await ensureBaseSchema();
}

async function ensureEmployeeRoster(): Promise<void> {
  if (globalForDb.employeeSeedPromise) {
    return globalForDb.employeeSeedPromise;
  }

  globalForDb.employeeSeedPromise = (async () => {
    await ensureBaseSchema();

    const pool = getPool();
    const seedEmployeeNames = splitRosterNames(
      process.env.ALLOWED_EMPLOYEE_NAMES?.trim() ||
        process.env.EMPLOYEE_NAMES?.trim() ||
        ""
    );
    if (seedEmployeeNames.length > 0) {
      await pool.query(
        `
          INSERT INTO employees (name)
          SELECT DISTINCT name
          FROM unnest($1::text[]) AS employee_names(name)
          ON CONFLICT (name) DO NOTHING
        `,
        [seedEmployeeNames]
      );
    }
  })();

  return globalForDb.employeeSeedPromise;
}

export async function ensureDefaultAdmin(): Promise<void> {
  if (globalForDb.adminSeedPromise) {
    return globalForDb.adminSeedPromise;
  }

  globalForDb.adminSeedPromise = (async () => {
    await ensureBaseSchema();

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const pool = getPool();

    await pool.query(
      `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role
      `,
      [adminEmail, passwordHash, "admin"]
    );
  })();

  return globalForDb.adminSeedPromise;
}

export async function issueCheckinScanToken(): Promise<string> {
  await ensureBaseSchema();

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashCheckinScanToken(rawToken);
  const pool = getPool();

  await pool.query(
    `
      INSERT INTO checkin_scan_tokens (token_hash, expires_at)
      VALUES ($1, NOW() + ($2 || ' minutes')::interval)
    `,
    [tokenHash, String(CHECKIN_SCAN_TOKEN_TTL_MINUTES)]
  );

  return rawToken;
}

function normalizeAttendanceRow(row: AttendanceRowDb): AttendanceRow {
  return {
    ...row,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
  };
}

function normalizeAuthUser(row: AuthUserDb): AuthUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
  };
}

export async function insertAttendance(input: InsertAttendanceInput): Promise<void> {
  await ensureBaseSchema();

  const attendeeName = normalizeEmployeeName(input.name);
  if (!attendeeName) {
    throw new CheckinRejectedError("Name is required.");
  }

  const scanToken = input.scanToken.trim();
  if (!scanToken) {
    throw new CheckinRejectedError(
      "This scan is no longer valid. Please scan the QR code again."
    );
  }

  const scanTokenHash = hashCheckinScanToken(scanToken);
  const pool = getPool();
  const result = await pool.query(
    `
      WITH consumed_scan_token AS (
        UPDATE checkin_scan_tokens
        SET used_at = NOW()
        WHERE token_hash = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        RETURNING id
      ),
      inserted_employee AS (
        INSERT INTO employees (name)
        SELECT $2
        WHERE EXISTS (SELECT 1 FROM consumed_scan_token)
          AND NOT EXISTS (
            SELECT 1
            FROM employees
            WHERE LOWER(btrim(name)) = LOWER($2)
          )
        ON CONFLICT (name) DO NOTHING
      ),
      inserted_attendance AS (
        INSERT INTO attendance (name, timestamp, latitude, longitude, location)
        SELECT $2, $3, $4, $5, $6
        WHERE EXISTS (SELECT 1 FROM consumed_scan_token)
        RETURNING id
      )
      SELECT id
      FROM inserted_attendance
    `,
    [
      scanTokenHash,
      attendeeName,
      input.timestamp,
      input.latitude,
      input.longitude,
      input.location ?? null,
    ]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new CheckinRejectedError(
      "This scan is no longer valid. Please scan the QR code again."
    );
  }
}

export async function getAllAttendance(date?: string): Promise<AttendanceRow[]> {
  await ensureBaseSchema();

  const pool = getPool();

  if (date) {
    const result = await pool.query<AttendanceRowDb>(
      `
        SELECT id, name, timestamp, latitude, longitude, location, created_at
        FROM attendance
        WHERE LEFT(timestamp, 10) = $1
        ORDER BY timestamp DESC
      `,
      [date]
    );
    return result.rows.map(normalizeAttendanceRow);
  }

  const result = await pool.query<AttendanceRowDb>(
    `
      SELECT id, name, timestamp, latitude, longitude, location, created_at
      FROM attendance
      ORDER BY timestamp DESC
    `
  );

  return result.rows.map(normalizeAttendanceRow);
}

export async function getEmployeeNames(): Promise<string[]> {
  await ensureBaseSchema();
  await ensureEmployeeRoster();

  const pool = getPool();
  const result = await pool.query<{ name: string }>(
    `
      SELECT DISTINCT ON (LOWER(btrim(name))) btrim(name) AS name
      FROM employees
      WHERE btrim(name) <> ''
      ORDER BY LOWER(btrim(name)), name
    `
  );

  return result.rows.map((row) => row.name);
}

export async function addEmployeeNames(names: string[]): Promise<string[]> {
  await ensureBaseSchema();
  await ensureEmployeeRoster();

  const approvedNames = normalizeRosterNames(names);
  if (approvedNames.length === 0) {
    return [];
  }

  const pool = getPool();
  const result = await pool.query<{ name: string }>(
    `
      INSERT INTO employees (name)
      SELECT DISTINCT name
      FROM unnest($1::text[]) AS employee_names(name)
      WHERE NOT EXISTS (
        SELECT 1
        FROM employees existing_employees
        WHERE LOWER(btrim(existing_employees.name)) = LOWER(employee_names.name)
      )
      ON CONFLICT (name) DO NOTHING
      RETURNING name
    `,
    [approvedNames]
  );

  return result.rows.map((row) => row.name);
}

export async function removeEmployeeName(name: string): Promise<boolean> {
  await ensureBaseSchema();
  await ensureEmployeeRoster();

  const approvedName = normalizeRosterName(name);
  if (!approvedName) {
    return false;
  }

  const pool = getPool();
  const result = await pool.query(
    `
      DELETE FROM employees
      WHERE LOWER(btrim(name)) = LOWER($1)
    `,
    [approvedName]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getAuthUserByEmail(email: string): Promise<AuthUser | null> {
  await ensureBaseSchema();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const pool = getPool();
  const result = await pool.query<AuthUserDb>(
    `
      SELECT id, email, password_hash, role, created_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return normalizeAuthUser(result.rows[0]);
}
