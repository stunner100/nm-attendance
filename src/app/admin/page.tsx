import Link from "next/link";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { AttendanceTable } from "@/components/attendance-table";
import { AnimatedBar, FadeIn } from "@/components/hr/dashboard-motion";
import { LabeledProgressIndicator } from "@/components/ui/labeled-progress-indicator";
import {
  WatermelonStatCard,
  STAT_THEMES,
} from "@/components/watermelon/stats-card";
import { MetricBadge } from "@/components/watermelon/metric-badge";
import { QuotaWidget } from "@/components/watermelon/quota-widget";
import { getAllAttendance } from "@/lib/db";
import { getHRDashboardSummary } from "@/lib/hr-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RATING_BANDS } from "@/lib/hr/framework-reference";
import {
  Users,
  AlertCircle,
  FileText,
  TrendingUp,
  Award,
  Download,
  Gauge,
  Target,
  Presentation,
  ShieldAlert,
  Sprout,
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
  const framework = summary.framework;
  const departmentLabels = Object.keys(framework.avg_score_by_department);
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
        title="Performance Framework Dashboard"
        description="Night Market staff performance, rewards, accountability, and growth at a glance."
        actions={
          <Link
            href="/admin/scores"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_24px_rgba(15,23,42,0.18)] transition-colors hover:bg-neutral-800"
          >
            <Gauge className="h-4 w-4" />
            Record scores
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="col-span-1 lg:col-span-2">
          <Card className="h-full">
          <CardHeader className="pb-3">
            <p className="text-sm font-semibold text-neutral-500">Performance period {framework.period}</p>
            <CardTitle className="text-2xl font-semibold sm:text-3xl">
              Average monthly score {framework.avg_monthly_score.toFixed(1)} / 100
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricBadge
                icon={<Users className="h-4 w-4" />}
                iconColor="text-sky-400"
                value={String(framework.scored_employees)}
                label="Scored employees"
              />
              <MetricBadge
                icon={<Award className="h-4 w-4" />}
                iconColor="text-emerald-400"
                value={String(framework.excellent_count)}
                label="Top performers (90+)"
              />
              <MetricBadge
                icon={<AlertCircle className="h-4 w-4" />}
                iconColor="text-rose-400"
                value={String(framework.poor_count)}
                label="Poor performance (<60)"
              />
            </div>
            {departmentLabels.length > 0 ? (
              <div className="rounded-[22px] bg-neutral-100 p-4 shadow-[inset_0_1px_3px_rgba(15,23,42,0.04)]">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Live department focus &middot; avg {framework.avg_monthly_score.toFixed(0)}%
                </p>
                <LabeledProgressIndicator
                  labels={departmentLabels}
                  progress={`${Math.min(framework.avg_monthly_score, 100)}%`}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
        </FadeIn>

        <FadeIn delay={0.15} className="col-span-1">
          <QuotaWidget
            title="Rating Distribution"
            subtitle={`Period ${framework.period}`}
            used={framework.scored_employees}
            total={framework.scored_employees || 1}
            usedLabel={`${framework.scored_employees} scored`}
            remainingLabel={`Avg: ${framework.avg_monthly_score.toFixed(1)}`}
            segments={RATING_BANDS.map((band) => ({
              label: band.label,
              value: framework.rating_distribution[band.band] ?? 0,
              colorClass:
                band.tone === "emerald"
                  ? "bg-emerald-500"
                  : band.tone === "blue"
                    ? "bg-blue-500"
                    : band.tone === "amber"
                      ? "bg-amber-500"
                      : band.tone === "orange"
                        ? "bg-orange-500"
                        : "bg-rose-500",
            }))}
            ctaLabel="View scores"
            ctaHref="/admin/scores"
          />
        </FadeIn>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FadeIn delay={0}>
          <WatermelonStatCard
            icon={<Gauge className="h-4 w-4" />}
            label="Avg Monthly Score"
            metric={framework.avg_monthly_score.toFixed(1)}
            subLabel={`${framework.scored_employees} scored`}
            description="Weighted: KPI 50%, Tasks 25%, Comms 15%, Teamwork 10%"
            theme={STAT_THEMES.emerald}
          />
        </FadeIn>
        <FadeIn delay={0.06}>
          <WatermelonStatCard
            icon={<Award className="h-4 w-4" />}
            label="Bonus Eligible (80+)"
            metric={String(framework.bonus_eligible_count)}
            subLabel={`Top 90+: ${framework.excellent_count}`}
            description="Employees scoring 80+ qualify for monthly bonus; 90+ for higher recognition"
            theme={STAT_THEMES.cyan}
          />
        </FadeIn>
        <FadeIn delay={0.12}>
          <WatermelonStatCard
            icon={<Target className="h-4 w-4" />}
            label="Active KPI Cards"
            metric={String(framework.active_kpi_cards)}
            subLabel={`${framework.overdue_tasks} overdue tasks`}
            description="SMART, role-specific KPIs documented per employee and reviewed weekly"
            theme={STAT_THEMES.indigo}
          />
        </FadeIn>
        <FadeIn delay={0.18}>
          <WatermelonStatCard
            icon={<Presentation className="h-4 w-4" />}
            label="Presentations Pending"
            metric={String(framework.presentations_pending)}
            subLabel={`Period ${framework.period}`}
            description="Monthly associate and HOD presentations for ownership and accountability"
            theme={STAT_THEMES.amber}
          />
        </FadeIn>
        <FadeIn delay={0.24}>
          <WatermelonStatCard
            icon={<Award className="h-4 w-4" />}
            label="Rewards This Month"
            metric={String(framework.rewards_this_month)}
            subLabel="Weekly to long-term"
            description="Public recognition, bonuses, promotions, and development support"
            theme={STAT_THEMES.purple}
          />
        </FadeIn>
        <FadeIn delay={0.3}>
          <WatermelonStatCard
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Open Accountability"
            metric={String(framework.open_accountability)}
            subLabel="Coaching to final review"
            description="Progressive ladder: coaching, verbal/written warning, PIP, final review"
            theme={STAT_THEMES.rose}
          />
        </FadeIn>
        <FadeIn delay={0.36}>
          <WatermelonStatCard
            icon={<Sprout className="h-4 w-4" />}
            label="Growth Reviews Due"
            metric={String(framework.growth_reviews_due)}
            subLabel="Next 30 days"
            description="6-12 month growth plans with next-role mapping and review dates"
            theme={STAT_THEMES.emerald}
          />
        </FadeIn>
        <FadeIn delay={0.42}>
          <WatermelonStatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Review Completion"
            metric={`${summary.performance.review_completion_rate.toFixed(1)}%`}
            subLabel={`${summary.performance.active_pips} active PIPs`}
            description="Scheduled performance reviews completed vs. total assigned"
            theme={STAT_THEMES.cyan}
          />
        </FadeIn>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.5}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Average Score by Department</CardTitle>
              <p className="text-sm font-medium text-neutral-500">Period {framework.period}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(framework.avg_score_by_department).map(([department, avg], index) => (
                <div key={department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-neutral-700">{department}</span>
                    <span className="font-medium text-neutral-500">{avg.toFixed(1)}</span>
                  </div>
                  <AnimatedBar
                    value={avg}
                    max={100}
                    colorClass="bg-neutral-950"
                    delay={0.5 + index * 0.06}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.6}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Headcount by Department</CardTitle>
              <p className="text-sm font-medium text-neutral-500">{summary.headcount.total_active} total active</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(summary.headcount.by_department).map(([department, count], index) => (
                <div key={department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-neutral-700">{department}</span>
                    <span className="font-medium text-neutral-500">{count}</span>
                  </div>
                  <AnimatedBar
                    value={count}
                    max={maxDeptCount}
                    colorClass="bg-neutral-950"
                    delay={0.6 + index * 0.06}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <FadeIn delay={0.6}>
          <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg font-semibold">Key Alerts & Tasks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summary.alerts.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm font-medium text-neutral-500">
                No near-term alerts.
              </div>
            ) : (
              <div className="space-y-2">
                {summary.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-neutral-200/70 bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-950">{alert.label}</p>
                      <p className="text-xs font-medium text-neutral-500">
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
        </FadeIn>

        <FadeIn delay={0.7}>
          <AttendanceTable
          initialRecords={initialRecords}
          initialDate={date}
          maxRows={8}
          title="Recent attendance"
          description="Latest attendance actions. Open the full attendance page for complete check-in/check-out history."
          viewAllHref="/admin/attendance"
        />
        </FadeIn>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <FadeIn delay={0.8}>
          <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-neutral-500" />
              <CardTitle className="text-lg font-semibold">Sample CSV Downloads</CardTitle>
            </div>
            <p className="text-sm font-medium text-neutral-500">
              Download the exact CSV structures admins can use before running imports.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {sampleCsvLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-[22px] border border-neutral-200/70 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">{item.label}</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">{item.description}</p>
                  </div>
                  <Download className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
        </FadeIn>

        <FadeIn delay={0.9}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Import Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm font-medium text-neutral-600">
            <p>1. Download the sample CSV that matches the data you want to import.</p>
            <p>2. Replace the example rows with your HR data and keep the header columns unchanged.</p>
            <p>3. Open the imports module to run a dry-run first, then commit valid rows.</p>
            <Link
              href="/admin/imports"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:bg-neutral-800"
            >
              <FileText className="h-4 w-4" />
              Open imports
            </Link>
          </CardContent>
        </Card>
        </FadeIn>
      </section>
    </div>
  );
}
