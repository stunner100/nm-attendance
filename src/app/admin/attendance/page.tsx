import Link from "next/link";

import { AttendanceTable } from "@/components/attendance-table";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllAttendance, getApprovedAttendanceCoverageForDate } from "@/lib/db";
import { humanizeLabel } from "@/lib/labels";

type AttendancePageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const params = await searchParams;
  const date = params.date?.trim() || undefined;
  const coverageDate = date || new Date().toISOString().slice(0, 10);
  const [initialRecords, approvedCoverage] = await Promise.all([
    getAllAttendance(date),
    getApprovedAttendanceCoverageForDate(coverageDate),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Full attendance history with check-in, check-out, date filtering, and GPS links."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin">Back to overview</Link>
          </Button>
        }
      />

      <AttendanceTable
        initialRecords={initialRecords}
        initialDate={date}
        basePath="/admin/attendance"
        description="Search complete attendance history (check-in + check-out) by date."
      />

      <Card>
        <CardHeader>
          <CardTitle>Approved Attendance Coverage ({coverageDate})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedCoverage.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved leave or late-arrival coverage for this date.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              {approvedCoverage.map((coverage) => (
                <div
                  className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_auto]"
                  key={coverage.request_id}
                >
                  <div>
                    <p className="font-medium text-foreground">{coverage.employee_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {humanizeLabel(coverage.request_category)} · {coverage.leave_type}
                      {coverage.late_arrival_time
                        ? ` · arriving ${coverage.late_arrival_time.slice(0, 5)}`
                        : ""}
                    </p>
                    {coverage.reason ? (
                      <p className="mt-1 text-xs text-muted-foreground">{coverage.reason}</p>
                    ) : null}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {coverage.has_attendance ? "Attendance recorded" : "Covered absence"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
