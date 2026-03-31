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
  schemaInitPromise?: Promise<void>;
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

async function ensureSchema(): Promise<void> {
  if (globalForDb.schemaInitPromise) {
    return globalForDb.schemaInitPromise;
  }

  globalForDb.schemaInitPromise = (async () => {
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

  return globalForDb.schemaInitPromise;
}

async function ensureEmployeeRoster(): Promise<void> {
  if (globalForDb.employeeSeedPromise) {
    return globalForDb.employeeSeedPromise;
  }

  globalForDb.employeeSeedPromise = (async () => {
    await ensureSchema();

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
    await ensureSchema();

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
  await ensureSchema();

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
  await ensureSchema();
  await ensureEmployeeRoster();

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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenConsumeResult = await client.query(
      `
        UPDATE checkin_scan_tokens
        SET used_at = NOW()
        WHERE token_hash = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        RETURNING id
      `,
      [scanTokenHash]
    );

    if ((tokenConsumeResult.rowCount ?? 0) === 0) {
      throw new CheckinRejectedError(
        "This scan is no longer valid. Please scan the QR code again."
      );
    }

    await client.query(
      `
        INSERT INTO employees (name)
        SELECT $1
        WHERE NOT EXISTS (
          SELECT 1
          FROM employees
          WHERE LOWER(btrim(name)) = LOWER($1)
        )
      `,
      [attendeeName]
    );

    await client.query(
      `
        INSERT INTO attendance (name, timestamp, latitude, longitude, location)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        attendeeName,
        input.timestamp,
        input.latitude,
        input.longitude,
        input.location ?? null,
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllAttendance(date?: string): Promise<AttendanceRow[]> {
  await ensureSchema();

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
  await ensureSchema();
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
  await ensureSchema();
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
  await ensureSchema();
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
  await ensureSchema();

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
