ALTER TABLE hr_leave_requests
  ADD COLUMN IF NOT EXISTS request_category TEXT NOT NULL DEFAULT 'leave',
  ADD COLUMN IF NOT EXISTS late_arrival_time TIME,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS coverage_plan TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by_email TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_note TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin';

ALTER TABLE hr_leave_requests
  DROP CONSTRAINT IF EXISTS hr_leave_requests_request_category_check,
  ADD CONSTRAINT hr_leave_requests_request_category_check
    CHECK (request_category IN ('leave', 'late_arrival'));

ALTER TABLE hr_leave_requests
  DROP CONSTRAINT IF EXISTS hr_leave_requests_source_check,
  ADD CONSTRAINT hr_leave_requests_source_check
    CHECK (source IN ('admin', 'staff_self_service'));

CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_employee_dates_status
  ON hr_leave_requests (employee_id, start_date, end_date, status);

CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_category_status
  ON hr_leave_requests (request_category, status);
