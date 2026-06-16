import {
  CircleAlert,
  ClipboardList,
  Clock3,
  Gift,
  Shield,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
  UsersRound,
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
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <OverviewKpiCard
          label="Total Employees"
          value={String(headcount.total_active)}
          delta={trends.total_employees_delta}
          icon={<UsersRound className="h-6 w-6" strokeWidth={2.2} />}
          tone="emerald"
          href="/admin/headcount"
        />
        <OverviewKpiCard
          label="Avg Monthly Score"
          value={framework.avg_monthly_score.toFixed(1)}
          delta={Number(trends.avg_score_delta.toFixed(1))}
          icon={<TrendingUp className="h-6 w-6" strokeWidth={2.2} />}
          tone="blue"
          trendContext="from last month"
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Scoring 90+"
          value={String(framework.excellent_count)}
          delta={trends.excellent_delta}
          icon={<Star className="h-6 w-6 fill-current" strokeWidth={1.8} />}
          tone="green"
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Scoring 80–89"
          value={String(framework.strong_count)}
          delta={trends.strong_delta}
          icon={<ThumbsUp className="h-6 w-6" strokeWidth={2.1} />}
          tone="blue"
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Below 70"
          value={String(framework.below_70_count)}
          delta={trends.below_70_delta}
          invertTrend
          icon={<CircleAlert className="h-6 w-6" strokeWidth={2.1} />}
          tone="amber"
          trendContext="from last month"
          href="/admin/scores"
        />
        <OverviewKpiCard
          label="Below 60"
          value={String(framework.below_60_count)}
          delta={trends.below_60_delta}
          invertTrend
          icon={<CircleAlert className="h-6 w-6" strokeWidth={2.1} />}
          tone="rose"
          trendContext="from last month"
          href="/admin/scores"
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <OverviewActionTile
          icon={<ClipboardList className="h-6 w-6 text-purple-600" />}
          label="Active PIPs"
          count={performance.active_pips}
          href="/admin/accountability"
          iconClassName="bg-purple-50"
        />
        <OverviewActionTile
          icon={<Clock3 className="h-6 w-6 text-amber-600" />}
          label="Pending KPI Approvals"
          count={framework.pending_kpi_approvals}
          href="/admin/kpi-cards"
          iconClassName="bg-amber-50"
        />
        <OverviewActionTile
          icon={<Users className="h-6 w-6 text-blue-600" />}
          label="Pending Reviews"
          count={framework.pending_score_reviews}
          href="/admin/scores"
          iconClassName="bg-blue-50"
        />
        <OverviewActionTile
          icon={<Gift className="h-6 w-6 text-violet-600" />}
          label="Reward Approvals"
          count={framework.pending_reward_approvals}
          href="/admin/rewards"
          iconClassName="bg-violet-50"
        />
        <OverviewActionTile
          icon={<Shield className="h-6 w-6 text-rose-600" />}
          label="Open Accountability"
          count={framework.open_accountability}
          href="/admin/accountability"
          iconClassName="bg-rose-50"
        />
        <OverviewActionTile
          icon={<Clock3 className="h-6 w-6 text-orange-600" />}
          label="Overdue Tasks"
          count={framework.overdue_tasks}
          href="/admin/tasks"
          iconClassName="bg-orange-50"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.05fr_0.85fr_1.15fr]">
        <DeptScoreChart scores={framework.avg_score_by_department} />
        <RoadmapHealthList healthByDepartment={framework.roadmap_health_by_department} />
        <EmployeesAtRiskList employees={bundle.at_risk_employees} />
      </section>

      <section id="alerts" className="grid gap-3 xl:grid-cols-[1.08fr_1fr]">
        <KeyAlertsPanel alerts={summary.performance_alerts} />
        <RecentActivityFeed items={bundle.recent_activity} />
      </section>
    </div>
  );
}
