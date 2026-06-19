"use client";

import { EmptyState } from "@/components/hr/empty-state";
import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { DeleteRecordForm } from "@/components/hr/delete-record-form";
import type { HRRewardWithEmployee } from "@/lib/hr/rewards";
import { humanizeLabel } from "@/lib/labels";
import { Award } from "lucide-react";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type RewardAccordionProps = {
  rewards: HRRewardWithEmployee[];
  deleteRewardAction: (formData: FormData) => void | Promise<void>;
};

export function RewardAccordion({ rewards, deleteRewardAction }: RewardAccordionProps) {
  if (rewards.length === 0) {
    return (
      <EmptyState
        description="Record a reward above when an employee earns recognition."
        icon={Award}
        title="No rewards recorded yet"
      />
    );
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
            <div className="mt-3">
              <DeleteRecordForm
                action={deleteRewardAction}
                confirmMessage={`Delete reward "${reward.reward_type}" for ${reward.employee_name}?`}
                recordId={reward.id}
                recordIdFieldName="rewardId"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
