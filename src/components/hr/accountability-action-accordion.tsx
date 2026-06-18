"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import type { HRAccountabilityActionWithEmployee } from "@/lib/hr/accountability";
import { humanizeLabel } from "@/lib/labels";
import { HR_ACCOUNTABILITY_STATUSES } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type AccountabilityActionAccordionProps = {
  actions: HRAccountabilityActionWithEmployee[];
  updateStatusAction: (formData: FormData) => void | Promise<void>;
};

export function AccountabilityActionAccordion({
  actions,
  updateStatusAction,
}: AccountabilityActionAccordionProps) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No accountability actions recorded.</p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {actions.map((action) => (
        <AccordionItem
          key={action.id}
          value={String(action.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {action.employee_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {humanizeLabel(action.stage)}
              </span>
              <span className="text-xs text-muted-foreground">Issued {action.issued_on}</span>
              <StatusBadge status={action.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="space-y-3">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Reason:</span> {action.reason}
                </p>
                {action.notes ? (
                  <p>
                    <span className="font-semibold text-foreground">Notes:</span> {action.notes}
                  </p>
                ) : null}
              </div>

              <form action={updateStatusAction} className="flex flex-wrap items-end gap-2">
                <input name="actionId" type="hidden" value={action.id} />
                <label className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <select
                    className={selectClass}
                    defaultValue={action.status}
                    name="status"
                  >
                    {HR_ACCOUNTABILITY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
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
