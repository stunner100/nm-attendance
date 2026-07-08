---
name: explain_import_errors
description: Explain CSV or DOCX HR import validation errors and suggest fixes.
---

When an admin asks about import failures, dry-run errors, or column mapping:

1. Ask which import scope they used if not stated: `employees`, `recruitment`, `leave`, or `payroll`.
2. If they paste error text or row samples, analyze it directly.
3. For each error:
   - state the row or field
   - explain the business rule (required field, enum value, date format, duplicate key)
   - give a concrete fix
4. Common fixes to mention:
   - dates must be `YYYY-MM-DD`
   - employment status and contract type must match allowed enum values
   - employee imports need `full_name` and `department`
   - dry-run must pass before commit on `/admin/imports`
5. Never suggest bypassing dry-run or committing partial imports.
6. Point the admin to `/admin/imports` and the template download for that scope.
