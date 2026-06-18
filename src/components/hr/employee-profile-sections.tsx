"use client";

import type { ReactNode } from "react";

import { StatusBadge } from "@/components/hr/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { humanizeLabel } from "@/lib/labels";
import type { EmployeePerformanceProfile } from "@/lib/hr/employee-profile";

type EmployeeProfileSectionsProps = {
  profile: EmployeePerformanceProfile;
};

function SectionTrigger({ title, count }: { title: string; count: number }) {
  return (
    <span className="flex flex-1 items-center gap-2">
      <span className="font-medium text-foreground">{title}</span>
      <Badge
        variant="secondary"
        className="border-[var(--color-rule)] bg-[var(--color-paper-2)] tabular-nums"
      >
        {count}
      </Badge>
    </span>
  );
}

export function EmployeeProfileSections({ profile }: EmployeeProfileSectionsProps) {
  const accountabilityCount =
    profile.accountability.length + (profile.activePip ? 1 : 0);

  const sections: Array<{
    value: string;
    title: string;
    count: number;
    content: ReactNode;
  }> = [];

  if (profile.kpiCards.length > 0) {
    sections.push({
      value: "kpis",
      title: "KPIs",
      count: profile.kpiCards.length,
      content: (
        <div className="space-y-3">
          {profile.kpiCards.map((card) => {
            const items =
              profile.kpiItems.find((i) => i.cardId === card.id)?.items ?? [];
            return (
              <div
                key={card.id}
                className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{card.period}</p>
                  <StatusBadge status={card.status} />
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {items.map((item) => (
                    <li key={item.id}>
                      {item.kpi_text} (weight {item.weight})
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ),
    });
  }

  if (profile.tasks.length > 0) {
    sections.push({
      value: "tasks",
      title: "Tasks",
      count: profile.tasks.length,
      content: (
        <div className="space-y-2">
          {profile.tasks.slice(0, 8).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              <span className="truncate">{task.title}</span>
              <StatusBadge status={task.status} />
            </div>
          ))}
        </div>
      ),
    });
  }

  if (profile.scoreTrend.length > 0) {
    sections.push({
      value: "monthly-scores",
      title: "Monthly scores",
      count: profile.scoreTrend.length,
      content: (
        <div className="space-y-2">
          {profile.scoreTrend.map((s) => (
            <div
              key={s.period}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              <span>{s.period}</span>
              <span className="tabular-nums font-medium">
                {s.total.toFixed(1)} · {humanizeLabel(s.rating)}
              </span>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (profile.rewards.length > 0) {
    sections.push({
      value: "rewards",
      title: "Rewards",
      count: profile.rewards.length,
      content: (
        <div className="space-y-2">
          {profile.rewards.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              {r.reward_type} · {r.awarded_on}
            </div>
          ))}
        </div>
      ),
    });
  }

  if (accountabilityCount > 0) {
    sections.push({
      value: "accountability",
      title: "Accountability / PIPs",
      count: accountabilityCount,
      content: (
        <div className="space-y-2">
          {profile.activePip ? (
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Active PIP</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <StatusBadge status={profile.activePip.status} />
                <span className="text-xs text-muted-foreground">
                  {profile.activePip.start_date}
                  {profile.activePip.end_date ? ` → ${profile.activePip.end_date}` : ""}
                </span>
              </div>
              {profile.activePip.reason ? (
                <p className="mt-1 text-xs text-muted-foreground">{profile.activePip.reason}</p>
              ) : null}
            </div>
          ) : null}
          {profile.accountability.slice(0, 6).map((a) => (
            <div
              key={a.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={a.stage} />
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (profile.growthPlan) {
    sections.push({
      value: "growth-plan",
      title: "Growth plan",
      count: 1,
      content: (
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Next role:</span>{" "}
            {profile.growthPlan.possible_next_role || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Timeline:</span>{" "}
            {profile.growthPlan.review_timeline || "—"}
          </p>
          <StatusBadge status={profile.growthPlan.status} />
        </div>
      ),
    });
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No performance detail sections to show yet.
      </p>
    );
  }

  return (
    <Accordion
      type="multiple"
      className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-card px-4 shadow-none"
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.value}
          value={section.value}
          className="border-[var(--color-rule)]"
        >
          <AccordionTrigger className="py-4 hover:no-underline [&[data-state=open]]:no-underline">
            <SectionTrigger title={section.title} count={section.count} />
          </AccordionTrigger>
          <AccordionContent>{section.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
