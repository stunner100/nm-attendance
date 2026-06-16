import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { ensureDbSchema, getDbPool } from "@/lib/db";

const EXPORT_TYPES = [
  "monthly-scores",
  "kpi-cards",
  "rewards",
  "accountability",
  "growth-plans",
  "department-roadmap",
  "employee-performance",
] as const;

type ExportType = (typeof EXPORT_TYPES)[number];

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  return [headers.join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string }> }
): Promise<NextResponse> {
  const { response: authError } = await requireAdminApi();
  if (authError) {
    return authError;
  }
  await ensureDbSchema();
  const pool = getDbPool();
  const { type } = await context.params;

  if (!EXPORT_TYPES.includes(type as ExportType)) {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  let csv = "";

  switch (type as ExportType) {
    case "monthly-scores": {
      const res = await pool.query(`
        SELECT e.full_name, e.department, s.period, s.kpi_score, s.task_score,
          s.comms_score, s.teamwork_score, s.total_score, s.rating, s.approval_status
        FROM hr_monthly_scores s
        INNER JOIN hr_employees e ON e.id = s.employee_id
        ORDER BY s.period DESC, s.total_score DESC
      `);
      csv = toCsv(
        [
          "Employee",
          "Department",
          "Period",
          "KPI",
          "Tasks",
          "Comms",
          "Teamwork",
          "Total",
          "Rating",
          "Approval",
        ],
        res.rows.map((r) => [
          String(r.full_name),
          String(r.department),
          String(r.period),
          String(r.kpi_score),
          String(r.task_score),
          String(r.comms_score),
          String(r.teamwork_score),
          String(r.total_score),
          String(r.rating),
          String(r.approval_status ?? "draft"),
        ])
      );
      break;
    }
    case "kpi-cards": {
      const res = await pool.query(`
        SELECT e.full_name, e.department, c.period, c.role_title, c.status,
          cg.title AS company_goal, dg.title AS department_goal
        FROM hr_kpi_cards c
        INNER JOIN hr_employees e ON e.id = c.employee_id
        LEFT JOIN hr_company_goals cg ON cg.id = c.company_goal_id
        LEFT JOIN hr_department_goals dg ON dg.id = c.department_goal_id
        ORDER BY c.period DESC
      `);
      csv = toCsv(
        ["Employee", "Department", "Period", "Role", "Status", "Company goal", "Dept goal"],
        res.rows.map((r) => [
          String(r.full_name),
          String(r.department),
          String(r.period),
          String(r.role_title ?? ""),
          String(r.status),
          String(r.company_goal ?? ""),
          String(r.department_goal ?? ""),
        ])
      );
      break;
    }
    case "rewards": {
      const res = await pool.query(`
        SELECT e.full_name, e.department, r.tier, r.reward_type, r.reward_status,
          r.reason, r.awarded_on
        FROM hr_rewards r
        INNER JOIN hr_employees e ON e.id = r.employee_id
        ORDER BY r.awarded_on DESC
      `);
      csv = toCsv(
        ["Employee", "Department", "Tier", "Type", "Status", "Reason", "Date"],
        res.rows.map((r) => [
          String(r.full_name),
          String(r.department ?? ""),
          String(r.tier),
          String(r.reward_type),
          String(r.reward_status ?? ""),
          String(r.reason ?? r.description ?? ""),
          String(r.awarded_on),
        ])
      );
      break;
    }
    case "accountability": {
      const res = await pool.query(`
        SELECT e.full_name, e.department, a.issue_type, a.stage, a.status,
          a.reason, a.issued_on, a.follow_up_date
        FROM hr_accountability_actions a
        INNER JOIN hr_employees e ON e.id = a.employee_id
        ORDER BY a.issued_on DESC
      `);
      csv = toCsv(
        ["Employee", "Department", "Issue", "Stage", "Status", "Reason", "Issued", "Follow-up"],
        res.rows.map((r) => [
          String(r.full_name),
          String(r.department ?? ""),
          String(r.issue_type ?? ""),
          String(r.stage),
          String(r.status),
          String(r.reason),
          String(r.issued_on),
          String(r.follow_up_date ?? ""),
        ])
      );
      break;
    }
    case "growth-plans": {
      const res = await pool.query(`
        SELECT e.full_name, g."current_role", g.possible_next_role, g.growth_status,
          g.review_timeline, g.next_review_date, g.status
        FROM hr_growth_plans g
        INNER JOIN hr_employees e ON e.id = g.employee_id
        ORDER BY g.next_review_date ASC NULLS LAST
      `);
      csv = toCsv(
        ["Employee", "Current role", "Next role", "Growth status", "Timeline", "Review date", "Status"],
        res.rows.map((r) => [
          String(r.full_name),
          String(r.current_role ?? ""),
          String(r.possible_next_role ?? ""),
          String(r.growth_status ?? ""),
          String(r.review_timeline ?? ""),
          String(r.next_review_date ?? ""),
          String(r.status),
        ])
      );
      break;
    }
    case "department-roadmap": {
      const res = await pool.query(`
        SELECT d.department, d.period, d.title, c.title AS company_goal,
          d.roadmap_health, d.status_reason, d.key_blockers, d.next_priorities
        FROM hr_department_goals d
        LEFT JOIN hr_company_goals c ON c.id = d.company_goal_id
        ORDER BY d.period DESC, d.department
      `);
      csv = toCsv(
        ["Department", "Period", "Goal", "Company goal", "Health", "Reason", "Blockers", "Priorities"],
        res.rows.map((r) => [
          String(r.department),
          String(r.period),
          String(r.title),
          String(r.company_goal ?? ""),
          String(r.roadmap_health),
          String(r.status_reason ?? ""),
          String(r.key_blockers ?? ""),
          String(r.next_priorities ?? ""),
        ])
      );
      break;
    }
    case "employee-performance": {
      const res = await pool.query(`
        SELECT e.full_name, e.department, e.job_level, s.period, s.total_score, s.rating
        FROM hr_employees e
        LEFT JOIN LATERAL (
          SELECT period, total_score, rating
          FROM hr_monthly_scores ms
          WHERE ms.employee_id = e.id
          ORDER BY period DESC
          LIMIT 1
        ) s ON TRUE
        WHERE e.employment_status = 'active'
        ORDER BY e.department, e.full_name
      `);
      csv = toCsv(
        ["Employee", "Department", "Level", "Latest period", "Score", "Rating"],
        res.rows.map((r) => [
          String(r.full_name),
          String(r.department),
          String(r.job_level ?? ""),
          String(r.period ?? ""),
          String(r.total_score ?? ""),
          String(r.rating ?? ""),
        ])
      );
      break;
    }
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-export.csv"`,
    },
  });
}
