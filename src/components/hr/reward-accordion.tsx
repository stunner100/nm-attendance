"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import type { HRRewardWithEmployee } from "@/lib/hr/rewards";
import { humanizeLabel } from "@/lib/labels";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type RewardAccordionProps = {
  rewards: HRRewardWithEmployee[];
};

export function RewardAccordion({ rewards }: RewardAccordionProps) {
  if (rewards.length === 0) {
    return <p className="text-sm text-muted-foreground">No rewards recorded yet.</p>;
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {rewards.map((reward) => (
        <AccordionItem
          key={reward.id}
          value={String(reward.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {reward.employee_name}
              </span>
              <span className="text-xs text-muted-foreground">{reward.reward_type}</span>
              <span className="text-xs text-muted-foreground">Awarded {reward.awarded_on}</span>
              <StatusBadge status={reward.tier} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Tier:</span>{" "}
                {humanizeLabel(reward.tier)}
              </p>
              {reward.description ? (
                <p>
                  <span className="font-semibold text-foreground">Description:</span>{" "}
                  {reward.description}
                </p>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
