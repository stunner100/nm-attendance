import bcrypt from "bcryptjs";
import { Pool } from "pg";

import {
  CHECKIN_SCAN_TOKEN_TTL_MINUTES,
  createRawCheckinScanToken,
  hashCheckinScanToken,
} from "@/lib/checkin-tokens";
import {
  needsLocationBackfill,
  resolveLocationLabel,
} from "@/lib/reverse-geocode";
import { isSignupOpen } from "@/lib/auth-users";
import { runMigrations } from "@/lib/migrate";
import type { AttendanceRow } from "@/lib/types";
import {
  normalizeRosterName,
  normalizeRosterNames,
  splitRosterNames,
} from "@/lib/roster";

export type CheckinEmployeeOption = {
  id: number;
  fullName: string;
  department: string;
};

type CheckinAttendanceInput = {
  employeeId: number;
  scanToken: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  location?: string | null;
};

type CheckoutAttendanceInput = {
  employeeId: number;
  scanToken: string;
  timestamp: string;
  latitude: number;
  longitude: number;
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

function normalizeEmployeeName(name: string): string {
  return normalizeRosterName(name);
}

async function resolveActiveHrEmployeeName(
  employeeId: number,
  client?: { query: Pool["query"] }
): Promise<string> {
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    throw new CheckinRejectedError("Please select your name from the list.");
  }

  const query = client?.query ?? getPool().query.bind(getPool());
  const result = await query<{ full_name: string }>(
    `
      SELECT full_name
      FROM hr_employees
      WHERE id = $1
        AND employment_status = 'active'
        AND btrim(full_name) <> ''
      LIMIT 1
    `,
    [employeeId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new CheckinRejectedError("Please select a valid employee from the list.");
  }

  return normalizeEmployeeName(result.rows[0].full_name);
}

export async function listActiveHrEmployeesForCheckin(): Promise<CheckinEmployeeOption[]> {
  await ensureSchema();

  const pool = getPool();
  const result = await pool.query<{
    id: number;
    full_name: string;
    department: string;
  }>(
    `
      SELECT id, full_name, department
      FROM hr_employees
      WHERE employment_status = 'active'
        AND btrim(full_name) <> ''
      ORDER BY full_name ASC
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name.trim(),
    department: row.department.trim(),
  }));
}

export async function hasOpenCheckinForEmployee(employeeId: number): Promise<boolean> {
  await ensureSchema();

  const attendeeName = await resolveActiveHrEmployeeName(employeeId);
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id
      FROM attendance
      WHERE LOWER(btrim(name)) = LOWER($1)
        AND checkout_timestamp IS NULL
      LIMIT 1
    `,
    [attendeeName]
  );

  return (result.rowCount ?? 0) > 0;
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

async function ensureSchema(): Promise<void> {
  if (globalForDb.schemaInitPromise) {
    return globalForDb.schemaInitPromise;
  }

  globalForDb.schemaInitPromise = runMigrations();
  return globalForDb.schemaInitPromise;
}

export async function ensureDbSchema(): Promise<void> {
  await ensureSchema();
}

export async function ensureBaseDbSchema(): Promise<void> {
  await ensureSchema();
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
  if (isSignupOpen()) {
    return;
  }

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

  const rawToken = createRawCheckinScanToken();
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
    checkout_latitude:
      row.checkout_latitude === null || row.checkout_latitude === undefined
        ? null
        : Number(row.checkout_latitude),
    checkout_longitude:
      row.checkout_longitude === null || row.checkout_longitude === undefined
        ? null
        : Number(row.checkout_longitude),
    checkout_location: row.checkout_location
      ? String(row.checkout_location)
      : null,
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

export async function insertAttendance(input: CheckinAttendanceInput): Promise<void> {
  await ensureSchema();

  const scanToken = input.scanToken.trim();
  if (!scanToken) {
    throw new CheckinRejectedError(
      "This scan is no longer valid. Please scan the QR code again."
    );
  }

  const scanTokenHash = hashCheckinScanToken(scanToken);
  const locationLabel =
    input.location?.trim() ||
    (input.latitude !== null && input.longitude !== null
      ? await resolveLocationLabel(input.latitude, input.longitude)
      : null);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const attendeeName = await resolveActiveHrEmployeeName(input.employeeId, client);

    await client.query(
      `
        SELECT pg_advisory_xact_lock(hashtext(LOWER($1)))
      `,
      [attendeeName]
    );

    const activeCheckinResult = await client.query(
      `
        SELECT id
        FROM attendance
        WHERE LOWER(btrim(name)) = LOWER($1)
          AND checkout_timestamp IS NULL
        LIMIT 1
      `,
      [attendeeName]
    );

    if ((activeCheckinResult.rowCount ?? 0) > 0) {
      throw new CheckinRejectedError(
        "You already have an active check-in. Please check out before checking in again."
      );
    }

    const consumedTokenResult = await client.query(
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

    if ((consumedTokenResult.rowCount ?? 0) === 0) {
      throw new CheckinRejectedError(
        "This scan is no longer valid. Please scan the QR code again."
      );
    }

    const insertedAttendanceResult = await client.query(
      `
        INSERT INTO attendance (name, timestamp, latitude, longitude, location)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        attendeeName,
        input.timestamp,
        input.latitude,
        input.longitude,
        locationLabel,
      ]
    );

    if ((insertedAttendanceResult.rowCount ?? 0) === 0) {
      throw new CheckinRejectedError("Failed to record check-in.");
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkoutAttendance(input: CheckoutAttendanceInput): Promise<void> {
  await ensureSchema();

  const scanToken = input.scanToken.trim();
  if (!scanToken) {
    throw new CheckinRejectedError(
      "This scan is no longer valid. Please scan the QR code again."
    );
  }

  const scanTokenHash = hashCheckinScanToken(scanToken);
  const checkoutLocation =
    input.location?.trim() ||
    (await resolveLocationLabel(input.latitude, input.longitude));
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const attendeeName = await resolveActiveHrEmployeeName(input.employeeId, client);

    const consumedTokenResult = await client.query(
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

    if ((consumedTokenResult.rowCount ?? 0) === 0) {
      throw new CheckinRejectedError(
        "This scan is no longer valid. Please scan the QR code again."
      );
    }

    const checkoutResult = await client.query(
      `
        UPDATE attendance
        SET checkout_timestamp = $2,
            checkout_latitude = $3,
            checkout_longitude = $4,
            checkout_location = $5
        WHERE id = (
          SELECT id
          FROM attendance
          WHERE LOWER(btrim(name)) = LOWER($1)
            AND checkout_timestamp IS NULL
          ORDER BY timestamp DESC
          LIMIT 1
        )
        RETURNING id
      `,
      [attendeeName, input.timestamp, input.latitude, input.longitude, checkoutLocation]
    );

    if ((checkoutResult.rowCount ?? 0) === 0) {
      throw new CheckinRejectedError(
        "No active check-in found for this name. Please check in first."
      );
    }

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

  const query = date
    ? {
        sql: `
        SELECT id, name, timestamp, checkout_timestamp, latitude, longitude,
          checkout_latitude, checkout_longitude, location, checkout_location, created_at
        FROM attendance
        WHERE LEFT(timestamp, 10) = $1
        ORDER BY timestamp DESC
      `,
        params: [date] as const,
      }
    : {
        sql: `
      SELECT id, name, timestamp, checkout_timestamp, latitude, longitude,
        checkout_latitude, checkout_longitude, location, checkout_location, created_at
      FROM attendance
      ORDER BY timestamp DESC
    `,
        params: [] as const,
      };

  const result = await pool.query<AttendanceRowDb>(query.sql, [...query.params]);
  const rows = result.rows.map(normalizeAttendanceRow);

  return hydrateAttendanceLocations(pool, rows);
}

async function hydrateAttendanceLocations(
  pool: Pool,
  rows: AttendanceRow[]
): Promise<AttendanceRow[]> {
  const targets = rows
    .filter(
      (row) =>
        needsLocationBackfill(row.location, row.latitude, row.longitude) ||
        (row.checkout_timestamp &&
          needsLocationBackfill(
            row.checkout_location,
            row.checkout_latitude,
            row.checkout_longitude
          ))
    )
    .slice(0, 25);

  if (targets.length === 0) {
    return rows;
  }

  const updates = new Map<number, Partial<AttendanceRow>>();

  for (const row of targets) {
    const patch: Partial<AttendanceRow> = {};

    if (needsLocationBackfill(row.location, row.latitude, row.longitude)) {
      const location = await resolveLocationLabel(row.latitude as number, row.longitude as number);
      patch.location = location;
      await pool.query(`UPDATE attendance SET location = $2 WHERE id = $1`, [row.id, location]);
    }

    if (
      row.checkout_timestamp &&
      needsLocationBackfill(
        row.checkout_location,
        row.checkout_latitude,
        row.checkout_longitude
      )
    ) {
      const checkoutLocation = await resolveLocationLabel(
        row.checkout_latitude as number,
        row.checkout_longitude as number
      );
      patch.checkout_location = checkoutLocation;
      await pool.query(`UPDATE attendance SET checkout_location = $2 WHERE id = $1`, [
        row.id,
        checkoutLocation,
      ]);
    }

    if (Object.keys(patch).length > 0) {
      updates.set(row.id, patch);
    }
  }

  if (updates.size === 0) {
    return rows;
  }

  return rows.map((row) => ({
    ...row,
    ...updates.get(row.id),
  }));
}

export async function getEmployeeNames(): Promise<string[]> {
  const employees = await listActiveHrEmployeesForCheckin();
  return employees.map((employee) => employee.fullName);
}

const SUGGEST_MIN_QUERY_LENGTH = 2;
const SUGGEST_MAX_RESULTS = 15;

export async function suggestEmployeeNames(query: string): Promise<string[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < SUGGEST_MIN_QUERY_LENGTH) {
    return [];
  }

  const employees = await listActiveHrEmployeesForCheckin();
  const pattern = normalizedQuery.toLowerCase();

  return employees
    .filter((employee) => employee.fullName.toLowerCase().includes(pattern))
    .slice(0, SUGGEST_MAX_RESULTS)
    .map((employee) => employee.fullName);
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

export async function clearAttendance(): Promise<number> {
  await ensureSchema();

  const pool = getPool();
  const result = await pool.query("DELETE FROM attendance");
  return result.rowCount ?? 0;
}
