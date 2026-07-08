import { ensureDbSchema, getDbPool } from "@/lib/db";
import { CHECKIN_TIMEZONE } from "@/lib/attendance-punctuality";
import { asNumber, asRecordRows, asString } from "@/lib/hr/shared";

export type AttendanceSummary = {
  periodDays: number;
  totalCheckins: number;
  completedCheckouts: number;
  openCheckins: number;
  onTimeCheckins: number;
  lateCheckins: number;
  byDepartment: Array<{
    department: string;
    checkins: number;
    onTime: number;
    late: number;
  }>;
  href: string;
};

export async function getAttendanceSummary(
  days = 30
): Promise<AttendanceSummary> {
  const periodDays = Math.max(1, Math.min(days, 90));
  await ensureDbSchema();
  const pool = getDbPool();

  const [totalsRes, departmentRes] = await Promise.all([
    pool.query(
      `
        SELECT
          COUNT(*)::int AS total_checkins,
          COUNT(*) FILTER (WHERE checkout_timestamp IS NOT NULL)::int AS completed_checkouts,
          COUNT(*) FILTER (WHERE checkout_timestamp IS NULL)::int AS open_checkins,
          COUNT(*) FILTER (
            WHERE EXTRACT(
              HOUR FROM (timestamp::timestamptz AT TIME ZONE $2)
            ) * 60 + EXTRACT(
              MINUTE FROM (timestamp::timestamptz AT TIME ZONE $2)
            ) <= 510
          )::int AS on_time_checkins,
          COUNT(*) FILTER (
            WHERE EXTRACT(
              HOUR FROM (timestamp::timestamptz AT TIME ZONE $2)
            ) * 60 + EXTRACT(
              MINUTE FROM (timestamp::timestamptz AT TIME ZONE $2)
            ) > 510
          )::int AS late_checkins
        FROM attendance
        WHERE timestamp >= NOW() - ($1::int || ' days')::interval
      `,
      [periodDays, CHECKIN_TIMEZONE]
    ),
    pool.query(
      `
        SELECT
          COALESCE(e.department, 'Unassigned') AS department,
          COUNT(*)::int AS checkins,
          COUNT(*) FILTER (
            WHERE EXTRACT(
              HOUR FROM (a.timestamp::timestamptz AT TIME ZONE $2)
            ) * 60 + EXTRACT(
              MINUTE FROM (a.timestamp::timestamptz AT TIME ZONE $2)
            ) <= 510
          )::int AS on_time,
          COUNT(*) FILTER (
            WHERE EXTRACT(
              HOUR FROM (a.timestamp::timestamptz AT TIME ZONE $2)
            ) * 60 + EXTRACT(
              MINUTE FROM (a.timestamp::timestamptz AT TIME ZONE $2)
            ) > 510
          )::int AS late
        FROM attendance a
        LEFT JOIN hr_employees e
          ON LOWER(btrim(e.full_name)) = LOWER(btrim(a.name))
        WHERE a.timestamp >= NOW() - ($1::int || ' days')::interval
        GROUP BY COALESCE(e.department, 'Unassigned')
        ORDER BY checkins DESC, department ASC
        LIMIT 12
      `,
      [periodDays, CHECKIN_TIMEZONE]
    ),
  ]);

  const totals = asRecordRows(totalsRes.rows)[0] ?? {};

  return {
    periodDays,
    totalCheckins: asNumber(totals.total_checkins),
    completedCheckouts: asNumber(totals.completed_checkouts),
    openCheckins: asNumber(totals.open_checkins),
    onTimeCheckins: asNumber(totals.on_time_checkins),
    lateCheckins: asNumber(totals.late_checkins),
    byDepartment: asRecordRows(departmentRes.rows).map((row) => ({
      department: asString(row.department),
      checkins: asNumber(row.checkins),
      onTime: asNumber(row.on_time),
      late: asNumber(row.late),
    })),
    href: "/admin/attendance",
  };
}
