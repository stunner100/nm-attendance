import { ensureDbSchema, getDbPool } from "@/lib/db";

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  return 0;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    return ["true", "1", "yes"].includes(value.trim().toLowerCase());
  }
  return false;
}

export async function logImportRun(input: {
  scope: string;
  dryRun: boolean;
  rowsTotal: number;
  rowsSuccess: number;
  rowsFailed: number;
}): Promise<void> {
  await ensureDbSchema();
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO hr_import_runs (scope, dry_run, rows_total, rows_success, rows_failed)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [input.scope, input.dryRun, input.rowsTotal, input.rowsSuccess, input.rowsFailed]
  );
}

export type HRImportRun = {
  id: number;
  scope: string;
  dry_run: boolean;
  rows_total: number;
  rows_success: number;
  rows_failed: number;
  created_at: string;
};

export async function listImportRuns(limit = 50): Promise<HRImportRun[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const safeLimit = Math.max(1, Math.min(200, Number(limit)));

  const result = await pool.query(
    `
      SELECT
        id, scope, dry_run, rows_total, rows_success, rows_failed, created_at
      FROM hr_import_runs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: asNumber(row.id),
    scope: asString(row.scope),
    dry_run: asBoolean(row.dry_run),
    rows_total: asNumber(row.rows_total),
    rows_success: asNumber(row.rows_success),
    rows_failed: asNumber(row.rows_failed),
    created_at: asString(row.created_at),
  }));
}
