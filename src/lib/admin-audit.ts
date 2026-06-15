import { ensureDbSchema, getDbPool } from "@/lib/db";

export type AdminAuditAction =
  | "export_all_data"
  | "export_attendance"
  | "clear_all_data"
  | "clear_attendance";

export async function logAdminAction(input: {
  action: AdminAuditAction;
  actorEmail?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  await ensureDbSchema();
  const pool = getDbPool();

  await pool.query(
    `
      INSERT INTO admin_audit_log (action, actor_email, details)
      VALUES ($1, $2, $3::jsonb)
    `,
    [
      input.action,
      input.actorEmail?.trim() || null,
      JSON.stringify(input.details ?? {}),
    ]
  );
}
