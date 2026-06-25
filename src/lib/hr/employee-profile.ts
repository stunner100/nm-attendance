import { ensureDbSchema, getAttendanceForEmployee, getDbPool } from "@/lib/db";
import type { AttendanceRow, HREmployee } from "@/lib/types";
import { asNumber, asRecordRows, asString, normalizeEmployee } from "@/lib/hr/shared";
import { listAccountabilityActions } from "@/lib/hr/accountability";
import { listGrowthPlans } from "@/lib/hr/growth";
import { listKpiCards, listKpiCardItems } from "@/lib/hr/kpi-cards";
import { listMonthlyScores } from "@/lib/hr/scores";
import { listRewards } from "@/lib/hr/rewards";
import { listTasks } from "@/lib/hr/tasks";
import { listTrainingAssignments } from "@/lib/hr/training";

export type EmployeePerformanceProfile = {
  employee: HREmployee;
  managerName: string | null;
  displayRole: string | null;
  attendanceRecords: AttendanceRow[];
  attendanceSummary: {
    totalCheckins: number;
    completedCheckouts: number;
    lastCheckinAt: string | null;
  };
  currentScore: {
    period: string;
    total: number;
    rating: string;
  } | null;
  scoreTrend: Array<{ period: string; total: number; rating: string }>;
  kpiCards: Awaited<ReturnType<typeof listKpiCards>>;
  kpiItems: Array<{ cardId: number; items: Awaited<ReturnType<typeof listKpiCardItems>> }>;
  tasks: Awaited<ReturnType<typeof listTasks>>;
  rewards: Awaited<ReturnType<typeof listRewards>>;
  accountability: Awaited<ReturnType<typeof listAccountabilityActions>>;
  activePip: {
    id: number;
    status: string;
    start_date: string;
    end_date: string | null;
    reason: string | null;
  } | null;
  growthPlan: Awaited<ReturnType<typeof listGrowthPlans>>[number] | null;
  training: Awaited<ReturnType<typeof listTrainingAssignments>>;
};

export async function getEmployeeById(id: number): Promise<HREmployee | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT *
      FROM hr_employees
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeEmployee(asRecordRows(result.rows)[0]);
}

export async function getEmployeePerformanceProfile(
  employeeId: number
): Promise<EmployeePerformanceProfile | null> {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    return null;
  }

  await ensureDbSchema();
  const pool = getDbPool();

  const managerRes = employee.manager_employee_id
    ? await pool.query(`SELECT full_name FROM hr_employees WHERE id = $1`, [
        employee.manager_employee_id,
      ])
    : { rows: [] };

  const pipRes = await pool.query(
    `
      SELECT id, status, start_date, end_date, reason
      FROM hr_pips
      WHERE employee_id = $1 AND status IN ('active', 'improving')
      ORDER BY start_date DESC
      LIMIT 1
    `,
    [employeeId]
  );

  const [
    scores,
    kpiCards,
    tasks,
    rewards,
    accountability,
    growthPlans,
    training,
    attendanceRecords,
  ] = await Promise.all([
    listMonthlyScores({ limit: 12 }),
    listKpiCards({ limit: 24 }),
    listTasks({ employeeId, limit: 50 }),
    listRewards({ limit: 100 }),
    listAccountabilityActions({ limit: 100 }),
    listGrowthPlans({ limit: 50 }),
    listTrainingAssignments({ limit: 200 }),
    getAttendanceForEmployee(employeeId, 30),
  ]);

  const employeeScores = scores
    .filter((s) => s.employee_id === employeeId)
    .sort((a, b) => b.period.localeCompare(a.period));

  const employeeKpiCards = kpiCards.filter((c) => c.employee_id === employeeId);
  const displayRole = employee.job_title?.trim() || null;
  const kpiItems = await Promise.all(
    employeeKpiCards.map(async (card) => ({
      cardId: card.id,
      items: await listKpiCardItems(card.id),
    }))
  );

  const pipRow = asRecordRows(pipRes.rows)[0];
  const managerRow = asRecordRows(managerRes.rows)[0];

  return {
    employee,
    managerName: managerRow ? asString(managerRow.full_name) : null,
    displayRole,
    attendanceRecords,
    attendanceSummary: {
      totalCheckins: attendanceRecords.length,
      completedCheckouts: attendanceRecords.filter(
        (record) => typeof record.checkout_timestamp === "string"
      ).length,
      lastCheckinAt: attendanceRecords[0]?.timestamp ?? null,
    },
    currentScore: employeeScores[0]
      ? {
          period: employeeScores[0].period,
          total: employeeScores[0].total_score,
          rating: employeeScores[0].rating,
        }
      : null,
    scoreTrend: employeeScores.map((s) => ({
      period: s.period,
      total: s.total_score,
      rating: s.rating,
    })),
    kpiCards: employeeKpiCards,
    kpiItems,
    tasks,
    rewards: rewards.filter((r) => r.employee_id === employeeId),
    accountability: accountability.filter((a) => a.employee_id === employeeId),
    activePip: pipRow
      ? {
          id: asNumber(pipRow.id),
          status: asString(pipRow.status),
          start_date: asString(pipRow.start_date),
          end_date: pipRow.end_date ? asString(pipRow.end_date) : null,
          reason: pipRow.reason ? asString(pipRow.reason) : null,
        }
      : null,
    growthPlan: growthPlans.find((g) => g.employee_id === employeeId) ?? null,
    training: training.filter((t) => t.employee_id === employeeId),
  };
}
