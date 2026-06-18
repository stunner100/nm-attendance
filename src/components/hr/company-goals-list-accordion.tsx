"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import type { HRCompanyGoal } from "@/lib/types";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type CompanyGoalsListAccordionProps = {
  goals: HRCompanyGoal[];
  approveGoalAction: (formData: FormData) => void | Promise<void>;
};

export function CompanyGoalsListAccordion({
  goals,
  approveGoalAction,
}: CompanyGoalsListAccordionProps) {
  if (goals.length === 0) {
    return <p className="text-sm text-muted-foreground">No company goals yet.</p>;
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
              <span className="text-sm font-medium text-[var(--color-ink)]">{goal.title}</span>
              <span className="text-xs text-muted-foreground">
                {goal.period} · {goal.owner || "No owner"}
              </span>
              <StatusBadge status={goal.priority} />
              <StatusBadge status={goal.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            {goal.description ? (
              <p className="mb-3 text-sm text-muted-foreground">{goal.description}</p>
            ) : (
              <p className="mb-3 text-xs text-muted-foreground">No description provided.</p>
            )}
            {goal.status === "draft" ? (
              <form action={approveGoalAction}>
                <input type="hidden" name="goalId" value={goal.id} />
                <Button type="submit" size="sm" variant="outline">
                  Approve & activate
                </Button>
              </form>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
