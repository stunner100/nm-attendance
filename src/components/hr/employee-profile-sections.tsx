"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { AttendanceRecordSummary } from "@/components/hr/attendance-record-summary";
import { StatusBadge } from "@/components/hr/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import type { EmployeePerformanceProfile } from "@/lib/hr/employee-profile";
import { humanizeLabel } from "@/lib/labels";

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

function EmptySectionMessage({
  message,
  actionHref,
  actionLabel,
}: {
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>{message}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="text-link inline-flex items-center gap-1 font-medium"
        >
          {actionLabel}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
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
    defaultOpen?: boolean;
  }> = [
    {
      value: "attendance",
      title: "Attendance",
      count: profile.attendanceRecords.length,
      defaultOpen: true,
      content:
        profile.attendanceRecords.length > 0 ? (
          <div className="space-y-2">
            {profile.attendanceRecords.map((record) => (
              <AttendanceRecordSummary key={record.id} record={record} variant="card" />
            ))}
            <Link
              href="/admin/attendance"
              className="text-link inline-flex items-center gap-1 text-sm font-medium"
            >
              View all attendance
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <EmptySectionMessage message="No attendance records yet for this employee." />
        ),
    },
    {
      value: "kpis",
      title: "KPIs",
      count: profile.kpiCards.length,
      defaultOpen: true,
      content:
        profile.kpiCards.length > 0 ? (
          <div className="space-y-3">
            {profile.kpiCards.map((card) => {
              const items =
                profile.kpiItems.find((entry) => entry.cardId === card.id)?.items ?? [];
              return (
                <div
                  key={card.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{card.period}</p>
                      {card.role_title ? (
                        <p className="text-xs text-muted-foreground">{card.role_title}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={card.status} />
                  </div>
                  {items.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {items.map((item) => (
                        <li key={item.id}>
                          {item.kpi_text} (weight {item.weight})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No KPI items on this card.</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptySectionMessage
            message="No KPI cards assigned to this employee yet."
            actionHref="/admin/kpi-cards"
            actionLabel="Create KPI card"
          />
        ),
    },
    {
      value: "tasks",
      title: "Tasks",
      count: profile.tasks.length,
      defaultOpen: true,
      content:
        profile.tasks.length > 0 ? (
          <div className="space-y-2">
            {profile.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{task.title}</p>
                  {task.due_date ? (
                    <p className="text-xs text-muted-foreground">Due {task.due_date}</p>
                  ) : null}
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptySectionMessage
            message="No tasks assigned to this employee yet."
            actionHref="/admin/tasks"
            actionLabel="Assign task"
          />
        ),
    },
  ];

  if (profile.scoreTrend.length > 0) {
    sections.push({
      value: "monthly-scores",
      title: "Monthly scores",
      count: profile.scoreTrend.length,
      content: (
        <div className="space-y-2">
          {profile.scoreTrend.map((score) => (
            <div
              key={score.period}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              <span>{score.period}</span>
              <span className="tabular-nums font-medium">
                {score.total.toFixed(1)} · {humanizeLabel(score.rating)}
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
          {profile.rewards.slice(0, 6).map((reward) => (
            <div
              key={reward.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              {reward.reward_type} · {reward.awarded_on}
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
          {profile.accountability.slice(0, 6).map((action) => (
            <div
              key={action.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={action.stage} />
                <StatusBadge status={action.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{action.reason}</p>
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

  if (profile.training.length > 0) {
    sections.push({
      value: "training",
      title: "Training",
      count: profile.training.length,
      content: (
        <div className="space-y-2">
          {profile.training.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            >
              <span className="truncate">Module #{assignment.module_id}</span>
              <StatusBadge status={assignment.status} />
            </div>
          ))}
        </div>
      ),
    });
  }

  const defaultOpenSections = sections
    .filter((section) => section.defaultOpen)
    .map((section) => section.value);

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpenSections}
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
