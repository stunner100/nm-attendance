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
import { humanizeLabel } from "@/lib/labels";
import {
  Users,
  AlertCircle,
  FileText,
  TrendingUp,
  Award,
  Download,
  Gauge,
  Target,
  ShieldAlert,
  Sprout,
  CheckSquare,
  Flag,
} from "lucide-react";

type AdminPageProps = {
  searchParams: Promise<{ date?: string }>;
};

const EXPORT_LINKS = [
  { label: "Monthly scores", href: "/api/hr/export/monthly-scores" },
  { label: "KPI cards", href: "/api/hr/export/kpi-cards" },
  { label: "Rewards", href: "/api/hr/export/rewards" },
  { label: "Accountability", href: "/api/hr/export/accountability" },
  { label: "Growth plans", href: "/api/hr/export/growth-plans" },
  { label: "Dept roadmap", href: "/api/hr/export/department-roadmap" },
  { label: "Employee performance", href: "/api/hr/export/employee-performance" },
];

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

  const actionMetrics = [
    { label: "Total employees", value: String(summary.headcount.total_active) },
    { label: "Avg performance", value: framework.avg_monthly_score.toFixed(1) },
    { label: "Scoring 90+", value: String(framework.excellent_count) },
    { label: "Scoring 80–89", value: String(framework.strong_count) },
    { label: "Below 70", value: String(framework.below_70_count) },
    { label: "Below 60", value: String(framework.below_60_count) },
    { label: "Active PIPs", value: String(summary.performance.active_pips) },
    { label: "Pending KPI approvals", value: String(framework.pending_kpi_approvals) },
    { label: "Pending score reviews", value: String(framework.pending_score_reviews) },
    { label: "Pending reward approvals", value: String(framework.pending_reward_approvals) },
    { label: "Open accountability", value: String(framework.open_accountability) },
    { label: "Overdue tasks", value: String(framework.overdue_tasks) },
    { label: "Growth reviews due", value: String(framework.growth_reviews_due) },
    { label: "Roadmaps at risk", value: String(framework.roadmaps_at_risk) },
  ];

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="HR performance overview"
        description="What needs attention now — scores, approvals, accountability, and department health."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/company-goals">
                <Flag className="h-4 w-4" />
                Company goals
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/scores">
                <Gauge className="h-4 w-4" />
                Record scores
              </Link>
            </Button>
          </div>
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
                value={String(framework.below_60_count)}
                label="Poor performance (&lt;60)"
              />
            </div>
            {departmentLabels.length > 0 ? (
              <div className="rounded-lg border border-border bg-muted p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Company average ·{" "}
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
          icon={<Target className="h-4 w-4" />}
          label="Pending KPI approvals"
          metric={String(framework.pending_kpi_approvals)}
          subLabel={`${framework.active_kpi_cards} active cards`}
          description="KPIs awaiting HR or management approval"
          theme={STAT_THEMES.amber}
        />
        <WatermelonStatCard
          icon={<CheckSquare className="h-4 w-4" />}
          label="Overdue tasks"
          metric={String(framework.overdue_tasks)}
          subLabel="Requires manager follow-up"
          description="Incomplete tasks past deadline"
          theme={STAT_THEMES.rose}
        />
        <WatermelonStatCard
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Open accountability"
          metric={String(framework.open_accountability)}
          subLabel={`${summary.performance.active_pips} active PIPs`}
          description="Coaching through investigation stages"
          theme={STAT_THEMES.rose}
        />
        <WatermelonStatCard
          icon={<Sprout className="h-4 w-4" />}
          label="Growth reviews due"
          metric={String(framework.growth_reviews_due)}
          subLabel={`${framework.roadmaps_at_risk} roadmaps at risk`}
          description="Growth plans and department roadmaps needing review"
          theme={STAT_THEMES.indigo}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Action summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connected performance health for period {framework.period}
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {actionMetrics.map((item) => (
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

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average score by department</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(framework.headcount_by_department).map(([department, count], index) => (
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

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reward eligibility (80+) by department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(framework.reward_eligible_by_department).map(([dept, count]) => (
              <div key={dept} className="flex justify-between text-sm">
                <span>{dept}</span>
                <span className="tabular-nums font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap health by department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(framework.roadmap_health_by_department).map(([dept, health]) => (
              <div key={dept} className="flex items-center justify-between gap-2 text-sm">
                <span>{dept}</span>
                {health ? (
                  <StatusBadge status={health} />
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
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
              <CardTitle>Key alerts</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Urgent HR and management actions</p>
          </CardHeader>
          <CardContent>
            {summary.performance_alerts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground">
                No urgent performance alerts.
              </div>
            ) : (
              <div className="space-y-2">
                {summary.performance_alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-[background-color] hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{alert.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {humanizeLabel(alert.type)}
                        {alert.due_on ? ` · ${alert.due_on}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={alert.severity} />
                      {alert.href ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={alert.href}>Open</Link>
                        </Button>
                      ) : null}
                    </div>
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
          description="Latest check-ins. Open attendance for full history."
          viewAllHref="/admin/attendance"
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Performance exports</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg border border-border bg-card p-4 transition-[background-color] hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.label}</p>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
