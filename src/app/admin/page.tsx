import Link from "next/link";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { KpiCard } from "@/components/hr/kpi-card";
import { StatusBadge } from "@/components/hr/status-badge";
import { AttendanceTable } from "@/components/attendance-table";
import { getAllAttendance } from "@/lib/db";
import { getHRDashboardSummary } from "@/lib/hr-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  AlertCircle,
  FileText,
  TrendingUp,
  Clock,
  Award,
  UserMinus,
  Download,
} from "lucide-react";

type AdminPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const date = params.date?.trim() || undefined;
  const [initialRecords, summary] = await Promise.all([
    getAllAttendance(date),
    getHRDashboardSummary(),
  ]);

  const maxDeptCount = Math.max(...Object.values(summary.headcount.by_department), 1);
  const sampleCsvLinks = [
    {
      label: "Employees sample",
      href: "/api/hr/import/employees?download=1",
      description: "Employee master import template",
    },
    {
      label: "Recruitment sample",
      href: "/api/hr/import/recruitment?download=1",
      description: "Roles and applicant pipeline template",
    },
    {
      label: "Leave sample",
      href: "/api/hr/import/leave?download=1",
      description: "Leave balances and requests template",
    },
    {
      label: "Payroll sample",
      href: "/api/hr/import/payroll?download=1",
      description: "Payroll cycle and anomaly template",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="HR Admin Dashboard"
        description="Operational overview across recruitment, people operations, compliance, payroll, performance, and training."
        actions={
          <Link
            href="/admin/roster"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Users className="h-4 w-4" />
            Open roster
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="col-span-1 overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg lg:col-span-2">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-slate-400">Today&apos;s Overview</p>
            <CardTitle className="text-2xl font-semibold text-white sm:text-3xl">
              HR, attendance, and operational risk
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-400" />
                <p className="text-sm text-slate-300">Open roles</p>
              </div>
              <p className="mt-2 text-3xl font-bold">{summary.recruitment.open_roles}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <p className="text-sm text-slate-300">Pending actions</p>
              </div>
              <p className="mt-2 text-3xl font-bold">{summary.compliance.pending_followups}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <p className="text-sm text-slate-300">Attendance</p>
              </div>
              <p className="mt-2 text-3xl font-bold">{initialRecords.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Headcount by Department</CardTitle>
            <p className="text-sm text-slate-500">{summary.headcount.total_active} total active</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(summary.headcount.by_department).map(([department, count]) => (
              <div key={department} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{department}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${(count / maxDeptCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open Roles"
          value={`${summary.recruitment.open_roles}`}
          hint={`Avg ${summary.recruitment.avg_days_open.toFixed(1)} days open`}
          icon={Briefcase}
          color="emerald"
        />
        <KpiCard
          label="Active Staff"
          value={`${summary.headcount.total_active}`}
          hint={`New this quarter: ${summary.headcount.new_hires_quarter}`}
          icon={Users}
          color="blue"
        />
        <KpiCard
          label="Pending HR Actions"
          value={`${summary.compliance.pending_followups}`}
          hint={`Contract renewals due: ${summary.compliance.contract_renewals_due}`}
          icon={AlertCircle}
          color="amber"
        />
        <KpiCard
          label="Payroll Issues"
          value={`${summary.payroll_leave.anomalies_open}`}
          hint={`Leave approvals pending: ${summary.payroll_leave.leave_pending_approval}`}
          icon={FileText}
          color="red"
        />
        <KpiCard
          label="Review Completion"
          value={`${summary.performance.review_completion_rate.toFixed(1)}%`}
          hint={`Active PIPs: ${summary.performance.active_pips}`}
          icon={TrendingUp}
          color="purple"
        />
        <KpiCard
          label="Offer Acceptance"
          value={`${summary.recruitment.offer_acceptance_rate.toFixed(1)}%`}
          hint={`Time-to-hire: ${summary.recruitment.time_to_hire_days.toFixed(1)} days`}
          icon={Award}
          color="cyan"
        />
        <KpiCard
          label="Onboarding Completion"
          value={`${summary.training.onboarding_completion_rate.toFixed(1)}%`}
          hint={`CS curriculum: ${summary.training.cs_curriculum_completion_rate.toFixed(1)}%`}
          icon={Users}
          color="indigo"
        />
        <KpiCard
          label="Attrition (Quarter)"
          value={`${summary.headcount.attrition_rate.toFixed(1)}%`}
          hint={`Voluntary: ${summary.headcount.exits_voluntary} • Involuntary: ${summary.headcount.exits_involuntary}`}
          icon={UserMinus}
          color="rose"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg font-semibold">Key Alerts & Tasks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summary.alerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No near-term alerts.
              </div>
            ) : (
              <div className="space-y-2">
                {summary.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{alert.label}</p>
                      <p className="text-xs text-slate-500">
                        {alert.type.replaceAll("_", " ")}
                        {alert.due_on ? ` • Due ${alert.due_on}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={alert.severity} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AttendanceTable
          initialRecords={initialRecords}
          initialDate={date}
          maxRows={8}
          title="Recent attendance"
          description="Latest check-ins. Open the full attendance page for the complete log."
          viewAllHref="/admin/attendance"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg font-semibold">Sample CSV Downloads</CardTitle>
            </div>
            <p className="text-sm text-slate-500">
              Download the exact CSV structures admins can use before running imports.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {sampleCsvLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                  </div>
                  <Download className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                </div>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Import Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>1. Download the sample CSV that matches the data you want to import.</p>
            <p>2. Replace the example rows with your HR data and keep the header columns unchanged.</p>
            <p>3. Open the imports module to run a dry-run first, then commit valid rows.</p>
            <Link
              href="/admin/imports"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <FileText className="h-4 w-4" />
              Open imports
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
