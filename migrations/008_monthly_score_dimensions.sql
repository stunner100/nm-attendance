-- Monthly score: KPI 75%, Discipline 10%, Attendance 10%, Hygiene 2.5%, Extracurricular 2.5%
-- Legacy columns task_score / comms_score store discipline / attendance; teamwork_score is retired.

ALTER TABLE hr_monthly_scores
  ADD COLUMN IF NOT EXISTS hygiene_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extracurricular_score NUMERIC(5,2) NOT NULL DEFAULT 0;
