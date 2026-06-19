import { OverviewActionTile } from "@/components/hr/overview/action-tile";
import { DeptScoreChart } from "@/components/hr/overview/dept-score-chart";
import { EmployeesAtRiskList } from "@/components/hr/overview/employees-at-risk-list";
import { KeyAlertsPanel } from "@/components/hr/overview/key-alerts-panel";
import { OverviewKpiCard } from "@/components/hr/overview/kpi-card";
import { RecentActivityFeed } from "@/components/hr/overview/recent-activity-feed";
import { RoadmapHealthList } from "@/components/hr/overview/roadmap-health-list";
import { getOverviewBundle } from "@/lib/hr/overview";
import { normalizePeriod } from "@/lib/hr/framework-reference";

type AdminPageProps = {
  searchParams: Promise<{ period?: string; date?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const period = normalizePeriod(params.period);
  const bundle = await getOverviewBundle(period);
  const { summary } = bundle;
  const { framework, headcount, performance } = summary;
  const trends = framework.trends;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <OverviewKpiCard
          label="Total employees"
          value={String(headcount.total_active)}
          delta={trends.total_employees_delta}
          href="/admin/headcount"
        />
        <OverviewKpiCard
          label="Avg monthly score"
          value={framework.avg_monthly_score.toFixed(1)}
          delta={Number(trends.avg_score_delta.toFixed(1))}
          trendContext="from last month"
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Scoring 90+"
          value={String(framework.excellent_count)}
          delta={trends.excellent_delta}
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Scoring 80–89"
          value={String(framework.strong_count)}
          delta={trends.strong_delta}
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Below 70"
          value={String(framework.below_70_count)}
          delta={trends.below_70_delta}
          invertTrend
          trendContext="from last month"
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Below 60"
          value={String(framework.below_60_count)}
          delta={trends.below_60_delta}
          invertTrend
          trendContext="from last month"
          href="/admin/scores"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <OverviewActionTile
          label="Active PIPs"
          count={performance.active_pips}
          href="/admin/accountability"
        />
        <OverviewActionTile
          label="Pending KPI approvals"
          count={framework.pending_kpi_approvals}
          href="/admin/kpi-cards"
        />
        <OverviewActionTile
          label="Pending reviews"
          count={framework.pending_score_reviews}
          href="/admin/scores"
        />
        <OverviewActionTile
          label="Reward approvals"
          count={framework.pending_reward_approvals}
          href="/admin/rewards"
        />
        <OverviewActionTile
          label="Open accountability"
          count={framework.open_accountability}
          href="/admin/accountability"
        />
        <OverviewActionTile
          label="Overdue tasks"
          count={framework.overdue_tasks}
          href="/admin/tasks"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <DeptScoreChart scores={framework.avg_score_by_department} />
        <RoadmapHealthList healthByDepartment={framework.roadmap_health_by_department} />
        <EmployeesAtRiskList employees={bundle.at_risk_employees} />
      </section>

      <section
        id="alerts"
        className="scroll-mt-28 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]"
      >
        <KeyAlertsPanel alerts={summary.performance_alerts} />
        <RecentActivityFeed items={bundle.recent_activity} />
      </section>
    </div>
  );
}
