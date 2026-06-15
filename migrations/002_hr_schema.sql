ALTER TABLE hr_employees
  DROP CONSTRAINT IF EXISTS hr_employees_department_check,
  ADD CONSTRAINT hr_employees_department_check
    CHECK (department IN ('Operations', 'Marketing', 'Tech', 'Finance & Compliance', 'HR & Admin'));

UPDATE hr_employees
SET department = 'Finance & Compliance'
WHERE department = 'Finance & HR';

ALTER TABLE hr_recruitment_roles
  DROP CONSTRAINT IF EXISTS hr_recruitment_roles_department_check,
  ADD CONSTRAINT hr_recruitment_roles_department_check
    CHECK (department IN ('Operations', 'Marketing', 'Tech', 'Finance & Compliance', 'HR & Admin'));

UPDATE hr_recruitment_roles
SET department = 'Finance & Compliance'
WHERE department = 'Finance & HR';

CREATE TABLE IF NOT EXISTS hr_employees (
  id                   SERIAL PRIMARY KEY,
  employee_code        TEXT NOT NULL UNIQUE,
  full_name            TEXT NOT NULL,
  work_email           TEXT UNIQUE,
  department           TEXT NOT NULL CHECK (department IN ('Operations', 'Marketing', 'Tech', 'Finance & Compliance', 'HR & Admin')),
  contract_type        TEXT NOT NULL CHECK (contract_type IN ('full_time', 'part_time', 'intern', 'contractor')),
  work_mode            TEXT NOT NULL DEFAULT 'onsite' CHECK (work_mode IN ('onsite', 'hybrid', 'remote')),
  employment_status    TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated', 'resigned')),
  manager_employee_id  INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
  hire_date            DATE NOT NULL,
  probation_end_date   DATE,
  contract_end_date    DATE,
  exit_date            DATE,
  exit_type            TEXT CHECK (exit_type IN ('voluntary', 'involuntary')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'onsite';

ALTER TABLE hr_employees
  DROP CONSTRAINT IF EXISTS hr_employees_work_mode_check;

ALTER TABLE hr_employees
  ADD CONSTRAINT hr_employees_work_mode_check
    CHECK (work_mode IN ('onsite', 'hybrid', 'remote'));

CREATE TABLE IF NOT EXISTS hr_recruitment_roles (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  department    TEXT NOT NULL CHECK (department IN ('Operations', 'Marketing', 'Tech', 'Finance & Compliance', 'HR & Admin')),
  hiring_stage  TEXT NOT NULL DEFAULT 'screening',
  vacancies     INTEGER NOT NULL DEFAULT 1,
  opened_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_at     DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_recruitment_applicants (
  id               SERIAL PRIMARY KEY,
  role_id          INTEGER NOT NULL REFERENCES hr_recruitment_roles(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  email            TEXT,
  employment_track TEXT NOT NULL CHECK (employment_track IN ('intern', 'full_time')),
  current_stage    TEXT NOT NULL DEFAULT 'applied' CHECK (current_stage IN ('applied', 'screened', 'interviewed', 'offered', 'hired')),
  applied_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  offered_at       DATE,
  hired_at         DATE,
  offer_status     TEXT CHECK (offer_status IN ('pending', 'accepted', 'rejected')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_recruitment_stage_events (
  id            SERIAL PRIMARY KEY,
  applicant_id  INTEGER NOT NULL REFERENCES hr_recruitment_applicants(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL CHECK (stage IN ('applied', 'screened', 'interviewed', 'offered', 'hired')),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_disciplinary_cases (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
  category      TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('warning_issued', 'resolved', 'escalated')),
  summary       TEXT NOT NULL,
  opened_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date      DATE,
  resolved_at   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_policy_violations (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
  category      TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  notes         TEXT,
  occurred_on   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_followup_actions (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
  action_type   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  due_date      DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_payroll_cycles (
  id            SERIAL PRIMARY KEY,
  cycle_month   DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('processed', 'pending', 'issues_flagged')),
  processed_at  DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_month)
);

CREATE TABLE IF NOT EXISTS hr_payroll_anomalies (
  id                SERIAL PRIMARY KEY,
  payroll_cycle_id  INTEGER NOT NULL REFERENCES hr_payroll_cycles(id) ON DELETE CASCADE,
  employee_id       INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
  anomaly_type      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  details           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_leave_balances (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL UNIQUE REFERENCES hr_employees(id) ON DELETE CASCADE,
  annual_days   NUMERIC(8,2) NOT NULL DEFAULT 0,
  used_days     NUMERIC(8,2) NOT NULL DEFAULT 0,
  carry_days    NUMERIC(8,2) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type    TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  days          NUMERIC(8,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr_performance_reviews (
  id                   SERIAL PRIMARY KEY,
  employee_id          INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  review_period        TEXT NOT NULL,
  due_date             DATE NOT NULL,
  completed_at         DATE,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  reviewer_employee_id INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_pips (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('active', 'improving', 'completed', 'failed')),
  start_date    DATE NOT NULL,
  end_date      DATE,
  progress_note TEXT,
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_kpi_scores (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  metric_name   TEXT NOT NULL,
  score         NUMERIC(8,2) NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_training_modules (
  id              SERIAL PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,
  duration_hours  NUMERIC(8,2) NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_training_assignments (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  module_id     INTEGER NOT NULL REFERENCES hr_training_modules(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  assigned_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at  DATE
);

CREATE TABLE IF NOT EXISTS hr_onboarding_checklists (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  item_name     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  due_date      DATE,
  completed_at  DATE
);

CREATE TABLE IF NOT EXISTS hr_import_runs (
  id            SERIAL PRIMARY KEY,
  scope         TEXT NOT NULL,
  dry_run       BOOLEAN NOT NULL DEFAULT TRUE,
  rows_total    INTEGER NOT NULL DEFAULT 0,
  rows_success  INTEGER NOT NULL DEFAULT 0,
  rows_failed   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_employees_department ON hr_employees(department);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON hr_employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_hr_recruitment_applicants_stage ON hr_recruitment_applicants(current_stage);
CREATE INDEX IF NOT EXISTS idx_hr_recruitment_roles_opened_at ON hr_recruitment_roles(opened_at);
CREATE INDEX IF NOT EXISTS idx_hr_followup_actions_due_status ON hr_followup_actions(status, due_date);
CREATE INDEX IF NOT EXISTS idx_hr_disciplinary_cases_status ON hr_disciplinary_cases(status);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_cycles_status ON hr_payroll_cycles(status);
CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_status ON hr_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_performance_reviews_status ON hr_performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_hr_pips_status ON hr_pips(status);
CREATE INDEX IF NOT EXISTS idx_hr_training_assignments_status ON hr_training_assignments(status);
