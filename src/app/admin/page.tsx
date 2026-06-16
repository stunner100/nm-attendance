import {
  Award,
  CheckSquare,
  Gauge,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";

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
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Below 60"
          value={String(framework.below_60_count)}
          delta={trends.below_60_delta}
          invertTrend
          href="/admin/scores"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <OverviewActionTile
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
          label="Active PIPs"
          count={performance.active_pips}
          href="/admin/accountability"
        />
        <OverviewActionTile
          icon={<Target className="h-5 w-5 text-amber-600" />}
          label="Pending KPI approvals"
          count={framework.pending_kpi_approvals}
          href="/admin/kpi-cards"
        />
        <OverviewActionTile
          icon={<Gauge className="h-5 w-5 text-sky-600" />}
          label="Pending reviews"
          count={framework.pending_score_reviews}
          href="/admin/scores"
        />
        <OverviewActionTile
          icon={<Award className="h-5 w-5 text-violet-600" />}
          label="Reward approvals"
          count={framework.pending_reward_approvals}
          href="/admin/rewards"
        />
        <OverviewActionTile
          icon={<Users className="h-5 w-5 text-orange-600" />}
          label="Open accountability"
          count={framework.open_accountability}
          href="/admin/accountability"
        />
        <OverviewActionTile
          icon={<CheckSquare className="h-5 w-5 text-rose-600" />}
          label="Overdue tasks"
          count={framework.overdue_tasks}
          href="/admin/tasks"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DeptScoreChart scores={framework.avg_score_by_department} />
        <RoadmapHealthList healthByDepartment={framework.roadmap_health_by_department} />
        <EmployeesAtRiskList employees={bundle.at_risk_employees} />
      </section>

      <section id="alerts" className="grid gap-4 xl:grid-cols-2">
        <KeyAlertsPanel alerts={summary.performance_alerts} />
        <RecentActivityFeed items={bundle.recent_activity} />
      </section>
    </div>
  );
}
