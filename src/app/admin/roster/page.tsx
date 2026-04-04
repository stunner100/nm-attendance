import Link from "next/link";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { RosterManager } from "@/components/roster-manager";
import { getEmployeeNames } from "@/lib/db";

export default async function AdminRosterPage() {
  const initialNames = await getEmployeeNames();

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Roster Directory"
        description="Manage names that appear in the check-in form."
        actions={
          <>
            <Link
              href="/admin"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
            <Link
              href="/admin/imports"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Import data
            </Link>
          </>
        }
      />

      <RosterManager initialNames={initialNames} />
      <Link
        className="text-sm font-medium text-primary underline underline-offset-2"
        href="/admin/headcount"
      >
        Manage full employee records
      </Link>
    </div>
  );
}
