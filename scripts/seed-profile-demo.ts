/**
 * Seeds KPI cards, tasks, and monthly scores for one employee so profile accordions are visible.
 *
 * Usage: npm run seed:profile-demo
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional when DATABASE_URL is already exported
  }
}

loadEnvLocal();

const DEMO_EMPLOYEE_NAME = "Mr Patrick Addo";

async function main() {
  const { ensureDbSchema, getDbPool } = await import("@/lib/db");
  const { createKpiCard, addKpiCardItem } = await import("@/lib/hr/kpi-cards");
  const { createTask } = await import("@/lib/hr/tasks");
  const { upsertMonthlyScore } = await import("@/lib/hr/scores");

  await ensureDbSchema();
  const pool = getDbPool();

  const employeeRes = await pool.query(
    `
      SELECT id, full_name
      FROM hr_employees
      WHERE full_name ILIKE $1
      ORDER BY id ASC
      LIMIT 1
    `,
    [`%${DEMO_EMPLOYEE_NAME}%`]
  );

  if (employeeRes.rows.length === 0) {
    console.error(`No employee matching "${DEMO_EMPLOYEE_NAME}" found.`);
    process.exit(1);
  }

  const employeeId = Number(employeeRes.rows[0].id);
  const fullName = String(employeeRes.rows[0].full_name);
  const period = new Date().toISOString().slice(0, 7);

  const existingCard = await pool.query(
    `
      SELECT id
      FROM hr_kpi_cards
      WHERE employee_id = $1 AND period = $2
      LIMIT 1
    `,
    [employeeId, period]
  );

  let cardId: number;
  if (existingCard.rows.length > 0) {
    cardId = Number(existingCard.rows[0].id);
    console.log(`Reusing KPI card ${cardId} for ${fullName} (${period})`);
  } else {
    const card = await createKpiCard({
      employeeId,
      period,
      roleTitle: "HR Operations Lead",
      companyGoal: "Strengthen people operations and onboarding quality",
      status: "active",
    });
    cardId = card.id;
    console.log(`Created KPI card ${cardId} for ${fullName}`);

    await addKpiCardItem({
      cardId,
      kpiText: "Complete monthly HR compliance checklist",
      targetMeasure: "100% by month end",
      weight: 40,
    });
    await addKpiCardItem({
      cardId,
      kpiText: "Reduce onboarding cycle time",
      targetMeasure: "≤ 5 business days average",
      weight: 35,
    });
    await addKpiCardItem({
      cardId,
      kpiText: "Employee satisfaction pulse score",
      targetMeasure: "≥ 4.2 / 5",
      weight: 25,
    });
  }

  const taskTitles = [
    "Finalize Q2 headcount report",
    "Review onboarding playbook updates",
    "Schedule 1:1s with new hires",
  ];

  for (const title of taskTitles) {
    const existingTask = await pool.query(
      `
        SELECT id
        FROM hr_tasks
        WHERE employee_id = $1 AND title = $2
        LIMIT 1
      `,
      [employeeId, title]
    );
    if (existingTask.rows.length > 0) {
      console.log(`Task already exists: "${title}"`);
      continue;
    }

    const status =
      title.includes("headcount") ? "in_progress" : title.includes("1:1") ? "not_started" : "completed";

    await createTask({
      employeeId,
      cardId,
      title,
      description: `Demo task for profile accordion preview — ${period}`,
      dueDate: `${period}-28`,
      status,
    });
    console.log(`Created task: "${title}" (${status})`);
  }

  await upsertMonthlyScore({
    employeeId,
    period,
    kpiScore: 88,
    disciplineScore: 82,
    attendanceScore: 90,
    hygieneScore: 85,
    extracurricularScore: 80,
    notes: "Demo monthly score for profile accordion preview",
    scoredBy: "seed:profile-demo",
  });
  console.log(`Upserted monthly score for ${period}`);

  const priorPeriod = (() => {
    const [year, month] = period.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  })();

  await upsertMonthlyScore({
    employeeId,
    period: priorPeriod,
    kpiScore: 80,
    disciplineScore: 78,
    attendanceScore: 84,
    hygieneScore: 82,
    extracurricularScore: 79,
    notes: "Prior month demo score",
    scoredBy: "seed:profile-demo",
  });
  console.log(`Upserted monthly score for ${priorPeriod}`);

  console.log(`\nDone. Open: /admin/headcount/${employeeId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
