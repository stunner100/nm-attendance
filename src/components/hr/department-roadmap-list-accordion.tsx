"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import { DeleteRecordForm } from "@/components/hr/delete-record-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { humanizeLabel } from "@/lib/labels";
import type { HRDepartmentGoal } from "@/lib/types";
import { HR_ROADMAP_HEALTH } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type DepartmentRoadmapListAccordionProps = {
  goals: HRDepartmentGoal[];
  updateRoadmapAction: (formData: FormData) => void | Promise<void>;
  deleteGoalAction: (formData: FormData) => void | Promise<void>;
};

export function DepartmentRoadmapListAccordion({
  goals,
  updateRoadmapAction,
  deleteGoalAction,
}: DepartmentRoadmapListAccordionProps) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No department goals for this period.</p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {goals.map((goal) => (
        <AccordionItem
          key={goal.id}
          value={String(goal.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {goal.department}: {goal.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {goal.company_goal_title
                  ? `Linked to ${goal.company_goal_title}`
                  : "No linked company goal"}
              </span>
              <StatusBadge status={goal.roadmap_health} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <form action={updateRoadmapAction} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="goalId" value={goal.id} />
              <select
                name="roadmapHealth"
                defaultValue={goal.roadmap_health}
                className={selectClass}
              >
                {HR_ROADMAP_HEALTH.map((health) => (
                  <option key={health} value={health}>
                    {humanizeLabel(health)}
                  </option>
                ))}
              </select>
              <Input
                name="statusReason"
                defaultValue={goal.status_reason ?? ""}
                placeholder="Status reason"
                className="h-8 text-xs"
              />
              <Textarea
                name="keyBlockers"
                defaultValue={goal.key_blockers ?? ""}
                placeholder="Key blockers"
                rows={2}
                className="text-xs md:col-span-2"
              />
              <Textarea
                name="nextPriorities"
                defaultValue={goal.next_priorities ?? ""}
                placeholder="Next priorities"
                rows={2}
                className="text-xs md:col-span-2"
              />
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" variant="outline">
                  Update roadmap health
                </Button>
              </div>
            </form>
            <div className="mt-2">
              <DeleteRecordForm
                action={deleteGoalAction}
                confirmMessage={`Delete department goal "${goal.title}"? This cannot be undone.`}
                recordId={goal.id}
                recordIdFieldName="goalId"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
