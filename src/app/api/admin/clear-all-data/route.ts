import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDbPool } from "@/lib/db";

const DELETE_ORDER = [
  "hr_onboarding_checklists",
  "hr_kpi_scores",
  "hr_pips",
  "hr_performance_reviews",
  "hr_leave_requests",
  "hr_leave_balances",
  "hr_payroll_anomalies",
  "hr_payroll_cycles",
  "hr_followup_actions",
  "hr_policy_violations",
  "hr_disciplinary_cases",
  "hr_training_assignments",
  "hr_training_modules",
  "hr_recruitment_stage_events",
  "hr_recruitment_applicants",
  "hr_recruitment_roles",
  "hr_employees",
  "hr_import_runs",
  "attendance",
  "checkin_scan_tokens",
  "employees",
];

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const results: Record<string, number> = {};

    for (const table of DELETE_ORDER) {
      const res = await client.query(`DELETE FROM ${table}`);
      results[table] = res.rowCount ?? 0;
    }

    await client.query("COMMIT");

    return NextResponse.json({ ok: true, deleted: results });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to clear all data", error);
    return NextResponse.json(
      { error: "Failed to clear all data." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pool = getDbPool();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "json";

  try {
    const results: Record<string, unknown[]> = {};

    for (const table of DELETE_ORDER) {
      const res = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
      results[table] = res.rows;
    }

    if (format === "csv") {
      const csvParts: string[] = [];

      for (const [table, rows] of Object.entries(results)) {
        if (rows.length === 0) continue;

        const headers = Object.keys(rows[0] as Record<string, unknown>);
        const csvRows = [
          headers.map((h) => `"${h}"`).join(","),
          ...rows.map((row) =>
            headers
              .map((h) => {
                const val = (row as Record<string, unknown>)[h];
                const str = val === null || val === undefined ? "" : String(val);
                return `"${str.replace(/"/g, '""')}"`;
              })
              .join(",")
          ),
        ];

        csvParts.push(`-- ${table}\n${csvRows.join("\n")}`);
      }

      return new Response(csvParts.join("\n\n"), {
        headers: {
          "Content-Type": "text/csv;charset=utf-8;",
          "Content-Disposition": `attachment; filename="abonten-technologies-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to export data", error);
    return NextResponse.json(
      { error: "Failed to export data." },
      { status: 500 }
    );
  }
}
