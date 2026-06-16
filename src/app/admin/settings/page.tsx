import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { requireAdminPage } from "@/lib/admin-auth";
import { CHECKIN_TIMEZONE } from "@/lib/attendance-punctuality";
import { currentPeriod, formatPeriodLabel } from "@/lib/hr/framework-reference";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  await requireAdminPage("/admin/settings");
  const period = currentPeriod();

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Settings"
        description="Operational defaults for Night Market HR. Advanced configuration will expand here."
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <span className="text-muted-foreground">Performance period</span>
            <span className="font-medium">{formatPeriodLabel(period)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <span className="text-muted-foreground">On-time check-in cutoff</span>
            <span className="font-medium">8:30 AM ({CHECKIN_TIMEZONE})</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Location labels</span>
            <span className="font-medium">BigDataCloud + OpenStreetMap</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
