import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { ImportManager } from "@/components/hr/import-manager";
import { listImportRuns } from "@/lib/hr-db";

export default async function ImportsPage() {
  const runs = await listImportRuns(200);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Data Imports"
        description="Validate and commit HR data imports from CSV or DOCX for employees, recruitment, leave, and payroll."
      />

      <ImportManager initialRuns={runs} />
    </div>
  );
}
