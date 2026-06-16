-- Company goals
CREATE TABLE IF NOT EXISTS hr_company_goals (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  period          TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  owner           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'delayed', 'cancelled')),
  created_by      TEXT,
  approved_by     TEXT,
  date_created    DATE NOT NULL DEFAULT CURRENT_DATE,
  date_approved   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Department goals linked to company goals
CREATE TABLE IF NOT EXISTS hr_department_goals (
  id                SERIAL PRIMARY KEY,
  department        TEXT NOT NULL
    CHECK (department IN ('Operations', 'Product', 'Marketing', 'Tech', 'Finance & Compliance', 'HR & Admin')),
  company_goal_id   INTEGER REFERENCES hr_company_goals(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  period            TEXT NOT NULL,
  owner             TEXT,
  roadmap_health    TEXT NOT NULL DEFAULT 'on_track'
    CHECK (roadmap_health IN ('on_track', 'at_risk', 'delayed', 'blocked', 'completed')),
  status_reason     TEXT,
  key_blockers      TEXT,
  next_priorities   TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'delayed', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HR audit trail (sensitive record changes)
CREATE TABLE IF NOT EXISTS hr_audit_log (
  id              SERIAL PRIMARY KEY,
  record_type     TEXT NOT NULL,
  record_id       INTEGER NOT NULL,
  action          TEXT NOT NULL
    CHECK (action IN ('created', 'edited', 'submitted', 'approved', 'rejected', 'locked', 'reopened')),
  edited_by       TEXT NOT NULL,
  field_changed   TEXT,
  old_value       TEXT,
  new_value       TEXT,
  reason          TEXT,
  approved_by     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Formal change requests after approval
CREATE TABLE IF NOT EXISTS hr_change_requests (
  id              SERIAL PRIMARY KEY,
  record_type     TEXT NOT NULL,
  record_id       INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  requested_by    TEXT NOT NULL,
  approved_by     TEXT,
  date_approved   DATE,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee level and notes
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS job_level TEXT
    CHECK (job_level IS NULL OR job_level IN ('associate', 'mid_level', 'manager', 'hod')),
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS manager_notes TEXT,
  ADD COLUMN IF NOT EXISTS hr_notes TEXT;

-- KPI cards: link to goals and approval workflow
ALTER TABLE hr_kpi_cards
  ADD COLUMN IF NOT EXISTS company_goal_id INTEGER REFERENCES hr_company_goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_goal_id INTEGER REFERENCES hr_department_goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS job_level TEXT,
  ADD COLUMN IF NOT EXISTS kpi_title TEXT,
  ADD COLUMN IF NOT EXISTS kpi_description TEXT,
  ADD COLUMN IF NOT EXISTS evidence_required TEXT,
  ADD COLUMN IF NOT EXISTS proposed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by_hr TEXT,
  ADD COLUMN IF NOT EXISTS approved_by_mgmt TEXT,
  ADD COLUMN IF NOT EXISTS employee_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

UPDATE hr_kpi_cards SET status = 'closed' WHERE status = 'archived';

ALTER TABLE hr_kpi_cards DROP CONSTRAINT IF EXISTS hr_kpi_cards_status_check;
ALTER TABLE hr_kpi_cards ADD CONSTRAINT hr_kpi_cards_status_check
  CHECK (status IN ('draft', 'submitted', 'hr_reviewed', 'approved', 'active', 'closed', 'locked'));

-- Tasks: expanded workflow
UPDATE hr_tasks SET status = 'not_started' WHERE status = 'assigned';

ALTER TABLE hr_tasks DROP CONSTRAINT IF EXISTS hr_tasks_status_check;
ALTER TABLE hr_tasks ADD CONSTRAINT hr_tasks_status_check
  CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed', 'missed', 'blocked'));

ALTER TABLE hr_tasks
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS assigned_by TEXT,
  ADD COLUMN IF NOT EXISTS evidence TEXT,
  ADD COLUMN IF NOT EXISTS employee_progress_note TEXT,
  ADD COLUMN IF NOT EXISTS manager_verification TEXT NOT NULL DEFAULT 'pending'
    CHECK (manager_verification IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS manager_comment TEXT;

-- Monthly scores: approval workflow
ALTER TABLE hr_monthly_scores
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'submitted', 'hr_reviewed', 'approved', 'locked')),
  ADD COLUMN IF NOT EXISTS employee_comment TEXT,
  ADD COLUMN IF NOT EXISTS manager_comment TEXT,
  ADD COLUMN IF NOT EXISTS hr_comment TEXT,
  ADD COLUMN IF NOT EXISTS evidence_attached TEXT,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Rewards: link to scores and approval
ALTER TABLE hr_rewards
  ADD COLUMN IF NOT EXISTS period TEXT,
  ADD COLUMN IF NOT EXISTS monthly_score_id INTEGER REFERENCES hr_monthly_scores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS recommended_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS reward_status TEXT NOT NULL DEFAULT 'recommended'
    CHECK (reward_status IN ('recommended', 'pending_approval', 'approved', 'paid', 'rejected', 'locked')),
  ADD COLUMN IF NOT EXISTS date_approved DATE,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Accountability: expanded fields
ALTER TABLE hr_accountability_actions
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS linked_kpi_id INTEGER REFERENCES hr_kpi_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_task_id INTEGER REFERENCES hr_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_score_id INTEGER REFERENCES hr_monthly_scores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issue_type TEXT
    CHECK (issue_type IS NULL OR issue_type IN (
      'missed_kpi', 'missed_task', 'poor_communication', 'misconduct',
      'false_reporting', 'attendance_issue', 'other'
    )),
  ADD COLUMN IF NOT EXISTS evidence TEXT,
  ADD COLUMN IF NOT EXISTS manager_note TEXT,
  ADD COLUMN IF NOT EXISTS employee_response TEXT,
  ADD COLUMN IF NOT EXISTS hr_note TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by_hr TEXT;

UPDATE hr_accountability_actions SET manager_note = notes WHERE manager_note IS NULL AND notes IS NOT NULL;

ALTER TABLE hr_accountability_actions DROP CONSTRAINT IF EXISTS hr_accountability_actions_status_check;
ALTER TABLE hr_accountability_actions ADD CONSTRAINT hr_accountability_actions_status_check
  CHECK (status IN ('open', 'resolved', 'escalated', 'closed', 'reversed'));

-- PIPs: richer tracking
ALTER TABLE hr_pips
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS linked_score_id INTEGER REFERENCES hr_monthly_scores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_kpi_id INTEGER REFERENCES hr_kpi_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_task_id INTEGER REFERENCES hr_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS improvement_targets TEXT,
  ADD COLUMN IF NOT EXISTS weekly_checkin_notes TEXT,
  ADD COLUMN IF NOT EXISTS manager_support_required TEXT,
  ADD COLUMN IF NOT EXISTS hr_notes TEXT,
  ADD COLUMN IF NOT EXISTS final_outcome TEXT
    CHECK (final_outcome IS NULL OR final_outcome IN ('improved', 'extended', 'failed', 'reassigned', 'exited'));

-- Growth plans: performance linkage
ALTER TABLE hr_growth_plans
  ADD COLUMN IF NOT EXISTS current_department TEXT,
  ADD COLUMN IF NOT EXISTS performance_trend TEXT,
  ADD COLUMN IF NOT EXISTS growth_status TEXT NOT NULL DEFAULT 'on_track'
    CHECK (growth_status IN ('on_track', 'at_risk', 'not_ready', 'ready_for_next_role')),
  ADD COLUMN IF NOT EXISTS manager_comment TEXT,
  ADD COLUMN IF NOT EXISTS hr_comment TEXT,
  ADD COLUMN IF NOT EXISTS required_performance_level TEXT;

ALTER TABLE hr_growth_plans DROP CONSTRAINT IF EXISTS hr_growth_plans_status_check;
ALTER TABLE hr_growth_plans ADD CONSTRAINT hr_growth_plans_status_check
  CHECK (status IN ('active', 'on_hold', 'completed', 'closed'));

-- Training: link to growth / weak areas
ALTER TABLE hr_training_assignments
  ADD COLUMN IF NOT EXISTS growth_plan_id INTEGER REFERENCES hr_growth_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS weak_area TEXT,
  ADD COLUMN IF NOT EXISTS assigned_by TEXT,
  ADD COLUMN IF NOT EXISTS deadline DATE,
  ADD COLUMN IF NOT EXISTS completion_evidence TEXT,
  ADD COLUMN IF NOT EXISTS hr_comment TEXT;

-- Roadmap health expanded enum on department goals (already set above)

CREATE INDEX IF NOT EXISTS idx_hr_company_goals_period ON hr_company_goals(period);
CREATE INDEX IF NOT EXISTS idx_hr_company_goals_status ON hr_company_goals(status);
CREATE INDEX IF NOT EXISTS idx_hr_department_goals_dept_period ON hr_department_goals(department, period);
CREATE INDEX IF NOT EXISTS idx_hr_department_goals_health ON hr_department_goals(roadmap_health);
CREATE INDEX IF NOT EXISTS idx_hr_audit_log_record ON hr_audit_log(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_hr_kpi_cards_goals ON hr_kpi_cards(company_goal_id, department_goal_id);
CREATE INDEX IF NOT EXISTS idx_hr_monthly_scores_approval ON hr_monthly_scores(approval_status);
CREATE INDEX IF NOT EXISTS idx_hr_rewards_status ON hr_rewards(reward_status);
