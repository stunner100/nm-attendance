import { getDbPool } from "@/lib/db";

export const DATA_WIPE_CONFIRM_PHRASE = "DELETE ALL DATA";

/** Tables wiped by clear-all-data (users/admin accounts are preserved). */
export const DATA_DELETE_ORDER = [
  "hr_onboarding_checklists",
  "hr_kpi_scores",
  "hr_pips",
  "hr_performance_reviews",
  "hr_leave_requests",
  "hr_leave_balances",
  "hr_payroll_anomalies",
  "hr_payroll_cycles",
  "hr_followup_actions",
  "hr_policy_violations",
  "hr_disciplinary_cases",
  "hr_training_assignments",
  "hr_training_modules",
  "hr_recruitment_stage_events",
  "hr_recruitment_applicants",
  "hr_recruitment_roles",
  "hr_employees",
  "hr_import_runs",
  "attendance",
  "checkin_scan_tokens",
  "employees",
] as const;

/** Full backup order — users included but password hashes are redacted on export. */
export const DATA_EXPORT_ORDER = [
  ...DATA_DELETE_ORDER,
  "admin_audit_log",
  "schema_migrations",
  "users",
] as const;

export type BackupTable = (typeof DATA_EXPORT_ORDER)[number];

const ALLOWED_TABLES = new Set<string>(DATA_EXPORT_ORDER);

export function assertAllowedTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Disallowed table: ${table}`);
  }
}

export async function exportTableRows(
  table: BackupTable
): Promise<Record<string, unknown>[]> {
  assertAllowedTable(table);
  const pool = getDbPool();

  if (table === "users") {
    const result = await pool.query(
      `SELECT id, email, role, created_at FROM users ORDER BY id`
    );
    return result.rows as Record<string, unknown>[];
  }

  const result = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
  return result.rows as Record<string, unknown>[];
}

export async function exportAllTables(): Promise<Record<string, unknown[]>> {
  const results: Record<string, unknown[]> = {};

  for (const table of DATA_EXPORT_ORDER) {
    results[table] = await exportTableRows(table);
  }

  return results;
}

export async function deleteOperationalData(): Promise<Record<string, number>> {
  const pool = getDbPool();
  const client = await pool.connect();
  const results: Record<string, number> = {};

  try {
    await client.query("BEGIN");

    for (const table of DATA_DELETE_ORDER) {
      assertAllowedTable(table);
      const res = await client.query(`DELETE FROM ${table}`);
      results[table] = res.rowCount ?? 0;
    }

    await client.query("COMMIT");
    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function tablesToCsv(results: Record<string, unknown[]>): string {
  const csvParts: string[] = [];

  for (const [table, rows] of Object.entries(results)) {
    if (rows.length === 0) {
      continue;
    }

    const headers = Object.keys(rows[0] as Record<string, unknown>);
    const csvRows = [
      headers.map((header) => `"${header}"`).join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = (row as Record<string, unknown>)[header];
            const text = value === null || value === undefined ? "" : String(value);
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    csvParts.push(`-- ${table}\n${csvRows.join("\n")}`);
  }

  return csvParts.join("\n\n");
}

export function isDataWipeAllowed(): boolean {
  return process.env.ALLOW_DATA_WIPE === "true" || process.env.NODE_ENV !== "production";
}
