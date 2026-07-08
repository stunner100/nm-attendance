import { ensureDbSchema, getDbPool } from "@/lib/db";
import { asRecordRows, asString } from "@/lib/hr/shared";

export type HRSearchResult = {
  label: string;
  href: string;
  group: string;
};

export async function searchHRRecords(
  query: string,
  limit = 8
): Promise<HRSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  await ensureDbSchema();
  const pool = getDbPool();
  const pattern = `%${trimmed}%`;

  const [employeesRes, kpiRes, tasksRes] = await Promise.all([
    pool.query(
      `
        SELECT id, full_name, department
        FROM hr_employees
        WHERE employment_status = 'active'
          AND full_name ILIKE $1
        ORDER BY full_name ASC
        LIMIT $2
      `,
      [pattern, limit]
    ),
    pool.query(
      `
        SELECT c.id, c.period, e.full_name, c.role_title
        FROM hr_kpi_cards c
        INNER JOIN hr_employees e ON e.id = c.employee_id
        WHERE c.role_title ILIKE $1
           OR e.full_name ILIKE $1
        ORDER BY c.updated_at DESC
        LIMIT $2
      `,
      [pattern, limit]
    ),
    pool.query(
      `
        SELECT t.id, t.title, e.full_name
        FROM hr_tasks t
        INNER JOIN hr_employees e ON e.id = t.employee_id
        WHERE t.title ILIKE $1
           OR e.full_name ILIKE $1
        ORDER BY t.created_at DESC
        LIMIT $2
      `,
      [pattern, limit]
    ),
  ]);

  const results: HRSearchResult[] = [];

  for (const row of asRecordRows(employeesRes.rows)) {
    results.push({
      label: asString(row.full_name),
      href: `/admin/headcount/${asString(row.id)}`,
      group: `Employee · ${asString(row.department)}`,
    });
  }

  for (const row of asRecordRows(kpiRes.rows)) {
    results.push({
      label: `${asString(row.full_name)} · ${asString(row.role_title) || "KPI card"}`,
      href: "/admin/kpi-cards",
      group: `KPI · ${asString(row.period)}`,
    });
  }

  for (const row of asRecordRows(tasksRes.rows)) {
    results.push({
      label: `${asString(row.title)} · ${asString(row.full_name)}`,
      href: "/admin/tasks",
      group: "Task",
    });
  }

  return results.slice(0, limit);
}
