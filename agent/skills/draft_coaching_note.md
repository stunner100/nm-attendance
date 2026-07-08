---
name: draft_coaching_note
description: Draft an accountability or coaching note for an underperforming employee.
---

When an admin asks for a coaching note, improvement note, or accountability draft:

1. If they name an employee, call `search_hr` then `get_employee_profile` for that person.
2. If they give a score or situation without a name, ask for the employee name or id unless profile data was already loaded in the thread.
3. Use factual context from the profile: current score, score trend, missed/overdue tasks, attendance summary, open accountability, and active PIP if any.
4. Produce a draft with these sections:
   - **Subject** (one line)
   - **Observed performance** (2–4 bullets, factual)
   - **Impact** (1–2 sentences)
   - **Expectations** (2–4 specific, measurable actions)
   - **Support offered** (coaching, training, check-in cadence)
   - **Next review date** (suggest within 2–4 weeks)
5. Tone: direct, respectful, specific. No punitive language.
6. Remind the admin this is a draft to paste into `/admin/accountability` — you do not save it.
