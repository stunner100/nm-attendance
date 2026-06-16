import Link from "next/link";

import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { StatusBadge } from "@/components/hr/status-badge";
import { AttendanceTable } from "@/components/attendance-table";
import { AnimatedBar } from "@/components/hr/dashboard-motion";
import { LabeledProgressIndicator } from "@/components/ui/labeled-progress-indicator";
import {
  WatermelonStatCard,
  STAT_THEMES,
} from "@/components/watermelon/stats-card";
import { MetricBadge } from "@/components/watermelon/metric-badge";
import { QuotaWidget } from "@/components/watermelon/quota-widget";
import { getAllAttendance } from "@/lib/db";
import { getHRDashboardSummary } from "@/lib/hr-db";
import { Button } from "@/components/ui/button";
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

  const operationsSnapshot = [
    { label: "Active KPI cards", value: String(framework.active_kpi_cards) },
    { label: "Presentations pending", value: String(framework.presentations_pending) },
    { label: "Rewards this month", value: String(framework.rewards_this_month) },
    { label: "Growth reviews due", value: String(framework.growth_reviews_due) },
    { label: "Overdue tasks", value: String(framework.overdue_tasks) },
    { label: "Active PIPs", value: String(summary.performance.active_pips) },
  ];

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Performance framework dashboard"
        description="Night Market staff performance, rewards, accountability, and growth at a glance."
        actions={
          <Button asChild>
            <Link href="/admin/scores">
              <Gauge className="h-4 w-4" />
              Record scores
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader>
            <p className="text-sm text-muted-foreground">Performance period {framework.period}</p>
            <CardTitle className="text-2xl sm:text-3xl">
              Average monthly score{" "}
              <span className="tabular-nums">{framework.avg_monthly_score.toFixed(1)}</span> / 100
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricBadge
                icon={<Users className="h-4 w-4" />}
                iconColor="text-sky-600"
                value={String(framework.scored_employees)}
                label="Scored employees"
              />
              <MetricBadge
                icon={<Award className="h-4 w-4" />}
                iconColor="text-primary"
                value={String(framework.excellent_count)}
                label="Top performers (90+)"
              />
              <MetricBadge
                icon={<AlertCircle className="h-4 w-4" />}
                iconColor="text-rose-600"
                value={String(framework.poor_count)}
                label="Poor performance (under 60)"
              />
            </div>
            {departmentLabels.length > 0 ? (
              <div className="rounded-lg border border-border bg-muted p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Department focus · avg{" "}
                  <span className="tabular-nums">{framework.avg_monthly_score.toFixed(0)}%</span>
                </p>
                <LabeledProgressIndicator
                  labels={departmentLabels}
                  progress={`${Math.min(framework.avg_monthly_score, 100)}%`}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <QuotaWidget
          title="Rating distribution"
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
                ? "bg-primary"
                : band.tone === "blue"
                  ? "bg-sky-500"
                  : band.tone === "amber"
                    ? "bg-amber-500"
                    : band.tone === "orange"
                      ? "bg-orange-500"
                      : "bg-rose-500",
          }))}
          ctaLabel="View scores"
          ctaHref="/admin/scores"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WatermelonStatCard
          icon={<Gauge className="h-4 w-4" />}
          label="Avg monthly score"
          metric={framework.avg_monthly_score.toFixed(1)}
          subLabel={`${framework.scored_employees} scored`}
          description="Weighted: KPI 50%, Tasks 25%, Comms 15%, Teamwork 10%"
          theme={STAT_THEMES.emerald}
        />
        <WatermelonStatCard
          icon={<Award className="h-4 w-4" />}
          label="Bonus eligible (80+)"
          metric={String(framework.bonus_eligible_count)}
          subLabel={`Top 90+: ${framework.excellent_count}`}
          description="Employees scoring 80+ qualify for monthly bonus"
          theme={STAT_THEMES.cyan}
        />
        <WatermelonStatCard
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Open accountability"
          metric={String(framework.open_accountability)}
          subLabel="Coaching to final review"
          description="Progressive ladder from coaching through final review"
          theme={STAT_THEMES.rose}
        />
        <WatermelonStatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Review completion"
          metric={`${summary.performance.review_completion_rate.toFixed(1)}%`}
          subLabel={`${summary.performance.active_pips} active PIPs`}
          description="Scheduled performance reviews completed vs assigned"
          theme={STAT_THEMES.indigo}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Operations snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {operationsSnapshot.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <dt className="text-sm text-muted-foreground">{item.label}</dt>
                  <dd className="tabular-nums text-sm font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Download the sample CSV that matches the data you want to import.</p>
            <p>2. Replace the example rows with your HR data and keep the header columns unchanged.</p>
            <p>3. Open the imports module to run a dry-run first, then commit valid rows.</p>
            <Button asChild>
              <Link href="/admin/imports">
                <FileText className="h-4 w-4" />
                Open imports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average score by department</CardTitle>
            <p className="text-sm text-muted-foreground">Period {framework.period}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(framework.avg_score_by_department).map(([department, avg], index) => (
              <div key={department} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{department}</span>
                  <span className="tabular-nums text-muted-foreground">{avg.toFixed(1)}</span>
                </div>
                <AnimatedBar value={avg} max={100} colorClass="bg-primary" delay={index * 0.06} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headcount by department</CardTitle>
            <p className="text-sm text-muted-foreground">{summary.headcount.total_active} total active</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(summary.headcount.by_department).map(([department, count], index) => (
              <div key={department} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{department}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <AnimatedBar
                  value={count}
                  max={maxDeptCount}
                  colorClass="bg-foreground"
                  delay={index * 0.06}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle>Key alerts & tasks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summary.alerts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground">
                No near-term alerts.
              </div>
            ) : (
              <div className="space-y-2">
                {summary.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-[background-color] hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{alert.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.type.replaceAll("_", " ")}
                        {alert.due_on ? ` · Due ${alert.due_on}` : ""}
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
          description="Latest attendance actions. Open the full attendance page for complete check-in/check-out history."
          viewAllHref="/admin/attendance"
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Sample CSV downloads</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Download the exact CSV structures admins can use before running imports.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {sampleCsvLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg border border-border bg-card p-4 transition-[background-color] hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
