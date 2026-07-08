---
name: draft_growth_plan
description: Draft growth plan objectives and development actions for an employee.
---

When an admin asks for a growth plan draft or development objectives:

1. Call `search_hr` and `get_employee_profile` for the named employee.
2. Review current score, KPI cards, training assignments, and any active growth plan status.
3. Produce a draft with:
   - **Employee** and **period focus**
   - **Strengths to leverage** (2–3 bullets from score dimensions or completed work)
   - **Development gaps** (2–3 bullets tied to score bands or missed tasks)
   - **Objectives** (3 SMART objectives)
   - **Actions** (training, mentoring, stretch tasks with owners)
   - **Success measures** (how progress will be tracked next month)
4. Link the admin to `/admin/growth` for entry.
5. Do not save the plan — output copy-ready text only.
