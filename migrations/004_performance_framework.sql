ALTER TABLE hr_employees
  DROP CONSTRAINT IF EXISTS hr_employees_department_check,
  ADD CONSTRAINT hr_employees_department_check
    CHECK (department IN ('Operations', 'Product', 'Marketing', 'Tech', 'Finance & Compliance', 'HR & Admin'));

ALTER TABLE hr_recruitment_roles
  DROP CONSTRAINT IF EXISTS hr_recruitment_roles_department_check,
  ADD CONSTRAINT hr_recruitment_roles_department_check
    CHECK (department IN ('Operations', 'Product', 'Marketing', 'Tech', 'Finance & Compliance', 'HR & Admin'));

CREATE TABLE IF NOT EXISTS hr_kpi_cards (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,
  role_title      TEXT,
  company_goal    TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_kpi_card_items (
  id              SERIAL PRIMARY KEY,
  card_id         INTEGER NOT NULL REFERENCES hr_kpi_cards(id) ON DELETE CASCADE,
  kpi_text        TEXT NOT NULL,
  target_measure  TEXT,
  weight          NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_tasks (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  card_id         INTEGER REFERENCES hr_kpi_cards(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'delayed')),
  completed_at    DATE,
  quality_note    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_monthly_scores (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,
  kpi_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  task_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  comms_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  teamwork_score  NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  rating          TEXT NOT NULL CHECK (rating IN ('excellent', 'strong', 'acceptable', 'below_expectation', 'poor')),
  notes           TEXT,
  scored_by       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period)
);

CREATE TABLE IF NOT EXISTS hr_presentations (
  id                SERIAL PRIMARY KEY,
  employee_id       INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  period            TEXT NOT NULL,
  presenter_type    TEXT NOT NULL CHECK (presenter_type IN ('associate', 'mid_level', 'manager', 'hod')),
  status            TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'submitted', 'reviewed')),
  achievements      TEXT,
  kpi_results       TEXT,
  tasks_completed   TEXT,
  tasks_delayed     TEXT,
  challenges        TEXT,
  support_needed    TEXT,
  lessons           TEXT,
  next_priorities   TEXT,
  roadmap_health    TEXT CHECK (roadmap_health IN ('on_track', 'at_risk', 'delayed') OR roadmap_health IS NULL),
  key_wins          TEXT,
  blockers          TEXT,
  risks             TEXT,
  dependencies      TEXT,
  qa_notes          TEXT,
  submitted_at      DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_rewards (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  tier            TEXT NOT NULL CHECK (tier IN ('weekly', 'monthly', 'quarterly', 'long_term')),
  reward_type     TEXT NOT NULL,
  description     TEXT,
  awarded_on      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_accountability_actions (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL CHECK (stage IN ('coaching', 'verbal_warning', 'written_warning', 'pip', 'final_review', 'reassignment', 'termination', 'investigation')),
  reason          TEXT NOT NULL,
  issued_on       DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_growth_plans (
  id                       SERIAL PRIMARY KEY,
  employee_id              INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  "current_role"           TEXT,
  current_responsibilities TEXT,
  required_kpis            TEXT,
  skills_to_improve        TEXT,
  possible_next_role       TEXT,
  promotion_requirements   TEXT,
  training_needed          TEXT,
  review_timeline          TEXT,
  status                   TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed')),
  next_review_date         DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_kpi_cards_employee ON hr_kpi_cards(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_kpi_cards_period ON hr_kpi_cards(period);
CREATE INDEX IF NOT EXISTS idx_hr_kpi_card_items_card ON hr_kpi_card_items(card_id);
CREATE INDEX IF NOT EXISTS idx_hr_tasks_employee_status ON hr_tasks(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_hr_tasks_due ON hr_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_hr_monthly_scores_employee_period ON hr_monthly_scores(employee_id, period);
CREATE INDEX IF NOT EXISTS idx_hr_monthly_scores_period ON hr_monthly_scores(period);
CREATE INDEX IF NOT EXISTS idx_hr_presentations_period_status ON hr_presentations(period, status);
CREATE INDEX IF NOT EXISTS idx_hr_rewards_employee ON hr_rewards(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_rewards_awarded_on ON hr_rewards(awarded_on);
CREATE INDEX IF NOT EXISTS idx_hr_accountability_employee_status ON hr_accountability_actions(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_hr_growth_plans_employee ON hr_growth_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_growth_plans_review ON hr_growth_plans(next_review_date);
