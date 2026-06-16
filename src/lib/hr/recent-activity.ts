import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { ActivityItem, HRAuditLogEntry } from "@/lib/types";
import { asNullableString, asRecordRows, asString } from "@/lib/hr/shared";
import { listHrAuditLog } from "@/lib/hr/hr-audit";

function formatAuditActivity(entry: HRAuditLogEntry): ActivityItem {
  const recordLabel = entry.record_type.replaceAll("_", " ");
  const actionLabel = entry.action.replaceAll("_", " ");

  return {
    id: `audit-${entry.id}`,
    label: `${recordLabel} ${actionLabel}`.replace(/\b\w/g, (char) => char.toUpperCase()),
    actor: entry.edited_by || null,
    occurred_at: entry.created_at,
    href: null,
  };
}

export async function getRecentActivity(options: { limit?: number } = {}): Promise<ActivityItem[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const limit = options.limit ?? 10;

  const [auditEntries, scoreRes, kpiRes, taskRes, rewardRes] = await Promise.all([
    listHrAuditLog({ limit: Math.max(limit, 8) }),
    pool.query(
      `
        SELECT s.id, s.period, s.approval_status, s.locked_at, s.created_at, e.full_name
        FROM hr_monthly_scores s
        INNER JOIN hr_employees e ON e.id = s.employee_id
        WHERE s.approval_status IN ('approved', 'locked')
        ORDER BY COALESCE(s.locked_at, s.created_at) DESC
        LIMIT 6
      `
    ),
    pool.query(
      `
        SELECT c.id, c.period, c.status, c.updated_at, e.full_name
        FROM hr_kpi_cards c
        INNER JOIN hr_employees e ON e.id = c.employee_id
        WHERE c.status IN ('submitted', 'active', 'hr_reviewed')
        ORDER BY c.updated_at DESC
        LIMIT 6
      `
    ),
    pool.query(
      `
        SELECT t.id, t.title, t.status, t.completed_at, t.created_at, t.due_date, e.full_name
        FROM hr_tasks t
        INNER JOIN hr_employees e ON e.id = t.employee_id
        WHERE t.status IN ('completed', 'in_progress', 'delayed', 'assigned')
        ORDER BY COALESCE(t.completed_at, t.created_at::date) DESC, t.created_at DESC
        LIMIT 6
      `
    ),
    pool.query(
      `
        SELECT r.id, r.reward_status, r.date_approved, r.awarded_on, e.full_name
        FROM hr_rewards r
        INNER JOIN hr_employees e ON e.id = r.employee_id
        WHERE r.reward_status IN ('approved', 'paid', 'pending_approval')
        ORDER BY COALESCE(r.date_approved, r.awarded_on) DESC NULLS LAST
        LIMIT 6
      `
    ),
  ]);

  const synthetic: ActivityItem[] = [];

  for (const row of asRecordRows(scoreRes.rows)) {
    synthetic.push({
      id: `score-${asString(row.id)}`,
      label: `Monthly scores approved for ${asString(row.full_name)}`,
      actor: "HR Admin",
      occurred_at: asNullableString(row.locked_at) ?? asString(row.created_at),
      href: "/admin/scores",
    });
  }

  for (const row of asRecordRows(kpiRes.rows)) {
    const status = asString(row.status);
    synthetic.push({
      id: `kpi-${asString(row.id)}`,
      label:
        status === "submitted" || status === "hr_reviewed"
          ? `New KPI submitted by ${asString(row.full_name)}`
          : `KPI card activated for ${asString(row.full_name)}`,
      actor: asString(row.full_name),
      occurred_at: asString(row.updated_at),
      href: "/admin/kpi-cards",
    });
  }

  for (const row of asRecordRows(taskRes.rows)) {
    const status = asString(row.status);
    const dueDate = asNullableString(row.due_date);
    const isOverdue =
      status !== "completed" && dueDate !== null && dueDate < new Date().toISOString().slice(0, 10);

    synthetic.push({
      id: `task-${asString(row.id)}`,
      label:
        status === "completed"
          ? `Task completed: ${asString(row.title)}`
          : isOverdue
            ? `Task overdue: ${asString(row.title)}`
            : `Task updated: ${asString(row.title)}`,
      actor: asString(row.full_name),
      occurred_at:
        asNullableString(row.completed_at) ??
        asString(row.created_at),
      href: "/admin/tasks",
    });
  }

  for (const row of asRecordRows(rewardRes.rows)) {
    const status = asString(row.reward_status);
    synthetic.push({
      id: `reward-${asString(row.id)}`,
      label:
        status === "approved" || status === "paid"
          ? `Reward approved for ${asString(row.full_name)}`
          : `Reward pending approval for ${asString(row.full_name)}`,
      actor: "HR Admin",
      occurred_at:
        asNullableString(row.date_approved) ??
        asNullableString(row.awarded_on) ??
        new Date().toISOString(),
      href: "/admin/rewards",
    });
  }

  const merged = [
    ...auditEntries.map(formatAuditActivity),
    ...synthetic,
  ].sort((left, right) => right.occurred_at.localeCompare(left.occurred_at));

  const seen = new Set<string>();
  const unique: ActivityItem[] = [];

  for (const item of merged) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}
