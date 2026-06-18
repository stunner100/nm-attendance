import Link from "next/link";

import { AttendanceTable } from "@/components/attendance-table";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { Button } from "@/components/ui/button";
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
    </div>
  );
}
