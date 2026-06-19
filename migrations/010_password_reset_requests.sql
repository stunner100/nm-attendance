CREATE TABLE IF NOT EXISTS password_reset_requests (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS password_reset_requests_email_created_idx
  ON password_reset_requests (email, created_at DESC);
