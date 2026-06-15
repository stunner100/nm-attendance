CREATE TABLE IF NOT EXISTS attendance (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  timestamp   TEXT NOT NULL,
  checkout_timestamp TEXT,
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

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS checkout_timestamp TEXT;
