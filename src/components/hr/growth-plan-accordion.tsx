"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HRGrowthPlanWithEmployee } from "@/lib/hr/growth";
import { humanizeLabel } from "@/lib/labels";
import { HR_GROWTH_PLAN_STATUSES } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type GrowthPlanAccordionProps = {
  plans: HRGrowthPlanWithEmployee[];
  updateStatusAction: (formData: FormData) => void | Promise<void>;
};

export function GrowthPlanAccordion({
  plans,
  updateStatusAction,
}: GrowthPlanAccordionProps) {
  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">No growth plans yet.</p>;
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {plans.map((plan) => (
        <AccordionItem
          key={plan.id}
          value={String(plan.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {plan.employee_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {plan.department}
                {plan.current_role ? ` · ${plan.current_role}` : ""}
              </span>
              {plan.possible_next_role ? (
                <span className="text-xs text-muted-foreground">→ {plan.possible_next_role}</span>
              ) : null}
              <StatusBadge status={plan.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="space-y-3">
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                {plan.current_responsibilities ? (
                  <p>
                    <span className="font-semibold text-foreground">Responsibilities:</span>{" "}
                    {plan.current_responsibilities}
                  </p>
                ) : null}
                {plan.required_kpis ? (
                  <p>
                    <span className="font-semibold text-foreground">Required KPIs:</span>{" "}
                    {plan.required_kpis}
                  </p>
                ) : null}
                {plan.skills_to_improve ? (
                  <p>
                    <span className="font-semibold text-foreground">Skills:</span>{" "}
                    {plan.skills_to_improve}
                  </p>
                ) : null}
                {plan.promotion_requirements ? (
                  <p>
                    <span className="font-semibold text-foreground">Promotion requirements:</span>{" "}
                    {plan.promotion_requirements}
                  </p>
                ) : null}
                {plan.training_needed ? (
                  <p>
                    <span className="font-semibold text-foreground">Training:</span>{" "}
                    {plan.training_needed}
                  </p>
                ) : null}
                {plan.review_timeline ? (
                  <p>
                    <span className="font-semibold text-foreground">Review timeline:</span>{" "}
                    {plan.review_timeline}
                  </p>
                ) : null}
              </div>

              <form action={updateStatusAction} className="flex flex-wrap items-end gap-2">
                <input name="planId" type="hidden" value={plan.id} />
                <label className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <select
                    className={selectClass}
                    defaultValue={plan.status}
                    name="status"
                  >
                    {HR_GROWTH_PLAN_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Next review</span>
                  <Input
                    className="h-8 w-36 text-xs"
                    defaultValue={plan.next_review_date ?? ""}
                    name="nextReviewDate"
                    type="date"
                  />
                </label>
                <Button size="sm" type="submit" variant="outline">
                  Save status
                </Button>
              </form>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
