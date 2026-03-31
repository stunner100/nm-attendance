import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { RosterManager } from "@/components/roster-manager";
import { getEmployeeNames } from "@/lib/db";

export default async function AdminRosterPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin/roster");
  }

  const initialNames = await getEmployeeNames();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approved Roster</h1>
          <p className="text-sm text-muted-foreground">
            Manage the names allowed to submit attendance.
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as {session.user.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className="text-sm font-medium text-primary underline underline-offset-2"
            href="/admin"
          >
            Back to dashboard
          </Link>
          <LogoutButton />
        </div>
      </header>

      <RosterManager initialNames={initialNames} />
    </main>
  );
}
