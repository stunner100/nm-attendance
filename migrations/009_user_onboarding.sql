-- Personal accounts: link logins to HR employees and job level.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_level TEXT
    CHECK (job_level IS NULL OR job_level IN ('associate', 'mid_level', 'manager', 'hod')),
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_employee_id_unique
  ON users (employee_id)
  WHERE employee_id IS NOT NULL;

-- Hard rollout: remove shared / legacy login rows. HR and attendance data are unchanged.
DELETE FROM users;
