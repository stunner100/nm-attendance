"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import type { HRRecruitmentRole } from "@/lib/types";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type RecruitmentRolesAccordionProps = {
  roles: HRRecruitmentRole[];
};

export function RecruitmentRolesAccordion({ roles }: RecruitmentRolesAccordionProps) {
  if (roles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open roles. Create one above to start tracking applicants.
      </p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {roles.map((role) => (
        <AccordionItem
          key={role.id}
          value={String(role.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {role.title}
              </span>
              <span className="text-xs text-muted-foreground">{role.department}</span>
              <StatusBadge status={role.hiring_stage} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="font-medium text-foreground">Vacancies</dt>
                <dd>{role.vacancies}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Opened</dt>
                <dd>{role.opened_at}</dd>
              </div>
              {role.closed_at ? (
                <div>
                  <dt className="font-medium text-foreground">Closed</dt>
                  <dd>{role.closed_at}</dd>
                </div>
              ) : null}
            </dl>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
