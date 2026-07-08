---
name: triage_alerts
description: Prioritize HR admin alerts and suggest an order of work.
---

When an admin asks what to do first, what needs attention, or how to prioritize:

1. Call `get_needs_attention` for the current period.
2. If they need broader context, also call `get_overview`.
3. Group results by severity: high, then medium, then low.
4. Within each group, prefer items with a due date, then score-related risks, then leave/payroll.
5. Return a numbered action list. Each item must include:
   - the label
   - severity
   - category
   - the `href` deep link
   - one sentence on why it matters
6. End with a single recommended first step.

Do not invent alerts. Only describe items returned by tools.
