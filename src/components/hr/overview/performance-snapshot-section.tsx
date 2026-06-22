"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { OverviewKpiCard } from "@/components/hr/overview/kpi-card";
import type { HRDashboardSummary } from "@/lib/types";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type PerformanceSnapshotSectionProps = {
  headcount: HRDashboardSummary["headcount"];
  framework: HRDashboardSummary["framework"];
};

export function PerformanceSnapshotSection({
  headcount,
  framework,
}: PerformanceSnapshotSectionProps) {
  const trends = framework.trends;
  const scoreBandTotal =
    framework.excellent_count +
    framework.strong_count +
    framework.acceptable_count +
    framework.below_expectation_count +
    framework.below_70_count +
    framework.below_60_count;

  return (
    <section
      aria-labelledby="performance-snapshot-heading"
      className="rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-paper-2)]"
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2">
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
      </div>

      <Accordion type="single" collapsible className="border-t border-[var(--color-rule)] px-4">
        <AccordionItem value="score-bands" className="border-b-0">
          <AccordionTrigger
            className="py-3 text-sm font-medium text-[var(--color-ink)] hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]"
            showArrow
          >
            <span id="performance-snapshot-heading" className="flex flex-col items-start gap-0.5">
              <span>Performance snapshot</span>
              <span className="text-xs font-normal text-[var(--color-ink-muted)]">
                {scoreBandTotal} scored employees across 6 bands
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                label="Scoring 70–79"
                value={String(framework.acceptable_count)}
                delta={0}
                href="/admin/scores"
              />
              <OverviewKpiCard
                label="Scoring 60–69"
                value={String(framework.below_expectation_count)}
                delta={0}
                invertTrend
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
