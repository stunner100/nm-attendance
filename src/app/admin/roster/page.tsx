import Link from "next/link";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { RosterManager } from "@/components/roster-manager";
import { Button } from "@/components/ui/button";
import { getEmployeeNames } from "@/lib/db";

export default async function AdminRosterPage() {
  const initialNames = await getEmployeeNames();

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Manage names that appear in the check-in form."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin">Back to overview</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/imports">Import data</Link>
            </Button>
          </>
        }
      />

      <RosterManager initialNames={initialNames} />
      <Link className="text-link text-sm font-medium underline-offset-2 hover:underline" href="/admin/headcount">
        Manage full employee records
      </Link>
    </div>
  );
}
