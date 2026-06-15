CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           SERIAL PRIMARY KEY,
  action       TEXT NOT NULL,
  actor_email  TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON admin_audit_log (created_at DESC);

DELETE FROM employees e1
USING employees e2
WHERE e1.id > e2.id
  AND LOWER(btrim(e1.name)) = LOWER(btrim(e2.name));

CREATE UNIQUE INDEX IF NOT EXISTS employees_name_lower_unique
  ON employees (LOWER(btrim(name)));

CREATE INDEX IF NOT EXISTS idx_checkin_scan_tokens_expires_at
  ON checkin_scan_tokens (expires_at)
  WHERE used_at IS NULL;
