import { DeptScoreChart } from "@/components/hr/overview/dept-score-chart";
import { NeedsAttentionSection } from "@/components/hr/overview/needs-attention-section";
import { PerformanceSnapshotSection } from "@/components/hr/overview/performance-snapshot-section";
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

  const actionItems = [
    {
      label: "Active PIPs",
      count: performance.active_pips,
      href: "/admin/accountability",
    },
    {
      label: "Pending KPI approvals",
      count: framework.pending_kpi_approvals,
      href: "/admin/kpi-cards",
    },
    {
      label: "Pending reviews",
      count: framework.pending_score_reviews,
      href: "/admin/scores",
    },
    {
      label: "Reward approvals",
      count: framework.pending_reward_approvals,
      href: "/admin/rewards",
    },
    {
      label: "Open accountability",
      count: framework.open_accountability,
      href: "/admin/accountability",
    },
    {
      label: "Overdue tasks",
      count: framework.overdue_tasks,
      href: "/admin/tasks",
    },
  ];

  return (
    <div className="space-y-6">
      <NeedsAttentionSection
        actionItems={actionItems}
        alerts={summary.performance_alerts}
        atRiskEmployees={bundle.at_risk_employees}
      />

      <PerformanceSnapshotSection headcount={headcount} framework={framework} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <DeptScoreChart scores={framework.avg_score_by_department} />
        <RoadmapHealthList healthByDepartment={framework.roadmap_health_by_department} />
      </section>

      <section id="activity" className="scroll-mt-28">
        <RecentActivityFeed items={bundle.recent_activity} />
      </section>
    </div>
  );
}
