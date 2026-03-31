import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AttendanceTable } from "@/components/attendance-table";
import { LogoutButton } from "@/components/logout-button";
import { getAllAttendance } from "@/lib/db";

type AdminPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  const params = await searchParams;
  const date = params.date?.trim() || undefined;
  const initialRecords = await getAllAttendance(date);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Review all check-ins and filter by date.
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as {session.user.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className="text-sm font-medium text-primary underline underline-offset-2"
            href="/admin/roster"
          >
            Manage roster
          </Link>
          <Link
            className="text-sm font-medium text-primary underline underline-offset-2"
            href="/admin/qr"
          >
            Open QR page
          </Link>
          <LogoutButton />
        </div>
      </header>

      <AttendanceTable initialRecords={initialRecords} initialDate={date} />
    </main>
  );
}
