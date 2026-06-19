import { getAdminContactEmail } from "@/lib/auth-contact";
import { getAuthUserByEmail } from "@/lib/auth-users";
import { ensureDbSchema, getDbPool } from "@/lib/db";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const RESET_REQUEST_COOLDOWN_MINUTES = 15;

export function isValidResetRequestEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 && normalized.includes("@");
}

export async function recordPasswordResetRequest(email: string): Promise<number | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidResetRequestEmail(normalizedEmail)) {
    return null;
  }

  await ensureDbSchema();
  const pool = getDbPool();

  const recent = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM password_reset_requests
      WHERE email = $1
        AND created_at > NOW() - ($2::text || ' minutes')::interval
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [normalizedEmail, String(RESET_REQUEST_COOLDOWN_MINUTES)]
  );

  if ((recent.rowCount ?? 0) > 0) {
    return recent.rows[0]?.id ?? null;
  }

  const insert = await pool.query<{ id: number }>(
    `
      INSERT INTO password_reset_requests (email)
      VALUES ($1)
      RETURNING id
    `,
    [normalizedEmail]
  );

  return insert.rows[0]?.id ?? null;
}

export async function processPasswordResetRequest(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const requestId = await recordPasswordResetRequest(normalizedEmail);

  if (!requestId || !isEmailConfigured()) {
    return;
  }

  const adminEmail = getAdminContactEmail();
  if (!adminEmail) {
    return;
  }

  const user = await getAuthUserByEmail(normalizedEmail);
  if (!user) {
    return;
  }

  const employeeLabel = user.employeeName?.trim() || "Unknown employee";

  await sendEmail({
    to: adminEmail,
    subject: "Password reset request — Abonten HR",
    text: [
      "A user requested a password reset for the Abonten HR system.",
      "",
      `Email: ${normalizedEmail}`,
      `Employee: ${employeeLabel}`,
      "",
      "Please verify their identity and reset their password in the admin settings or database.",
    ].join("\n"),
    html: [
      "<p>A user requested a password reset for the Abonten HR system.</p>",
      "<ul>",
      `<li><strong>Email:</strong> ${normalizedEmail}</li>`,
      `<li><strong>Employee:</strong> ${employeeLabel}</li>`,
      "</ul>",
      "<p>Please verify their identity and reset their password in the admin settings or database.</p>",
    ].join(""),
  });

  const pool = getDbPool();
  await pool.query(
    `
      UPDATE password_reset_requests
      SET notified_at = NOW()
      WHERE id = $1
    `,
    [requestId]
  );
}
