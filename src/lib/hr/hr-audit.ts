import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRAuditAction, HRAuditLogEntry } from "@/lib/types";
import { applyListLimit, asRecordRows, asString } from "@/lib/hr/shared";

export type LogHrAuditInput = {
  recordType: string;
  recordId: number;
  action: HRAuditAction;
  editedBy: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  approvedBy?: string | null;
};

function normalizeAuditEntry(row: Record<string, unknown>): HRAuditLogEntry {
  return {
    id: Number(row.id) || 0,
    record_type: asString(row.record_type),
    record_id: Number(row.record_id) || 0,
    action: asString(row.action) as HRAuditLogEntry["action"],
    edited_by: asString(row.edited_by),
    field_changed: row.field_changed ? asString(row.field_changed) : null,
    old_value: row.old_value ? asString(row.old_value) : null,
    new_value: row.new_value ? asString(row.new_value) : null,
    reason: row.reason ? asString(row.reason) : null,
    approved_by: row.approved_by ? asString(row.approved_by) : null,
    created_at: asString(row.created_at),
  };
}

export async function logHrAudit(input: LogHrAuditInput): Promise<void> {
  await ensureDbSchema();
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO hr_audit_log (
        record_type, record_id, action, edited_by,
        field_changed, old_value, new_value, reason, approved_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      input.recordType,
      input.recordId,
      input.action,
      input.editedBy,
      input.fieldChanged?.trim() || null,
      input.oldValue ?? null,
      input.newValue ?? null,
      input.reason?.trim() || null,
      input.approvedBy?.trim() || null,
    ]
  );
}

export async function listHrAuditLog(options: {
  recordType?: string;
  recordId?: number;
  limit?: number;
} = {}): Promise<HRAuditLogEntry[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.recordType?.trim()) {
    values.push(options.recordType.trim());
    conditions.push(`record_type = $${values.length}`);
  }
  if (options.recordId && Number.isFinite(options.recordId)) {
    values.push(options.recordId);
    conditions.push(`record_id = $${values.length}`);
  }

  let query = `
    SELECT id, record_type, record_id, action, edited_by,
      field_changed, old_value, new_value, reason, approved_by, created_at
    FROM hr_audit_log
  `;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY created_at DESC";
  query = applyListLimit(query, values, options.limit ?? 50);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeAuditEntry);
}
