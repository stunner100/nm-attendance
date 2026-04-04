import Link from "next/link";

import { AttendanceTable } from "@/components/attendance-table";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { getAllAttendance } from "@/lib/db";

type AttendancePageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const params = await searchParams;
  const date = params.date?.trim() || undefined;
  const initialRecords = await getAllAttendance(date);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Attendance Log"
        description="Full attendance history with date filtering and GPS links."
        actions={
          <Link
            href="/admin"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Back to overview
          </Link>
        }
      />

      <AttendanceTable
        initialRecords={initialRecords}
        initialDate={date}
        basePath="/admin/attendance"
        description="Search the full check-in history by date."
      />
    </div>
  );
}
