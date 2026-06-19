"use client";

import { EmptyState } from "@/components/hr/empty-state";
import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import { humanizeLabel } from "@/lib/labels";
import type { HRRecruitmentApplicant, HRRecruitmentRole } from "@/lib/types";
import { HR_RECRUITMENT_STAGES } from "@/lib/types";
import { UserPlus } from "lucide-react";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type RecruitmentApplicantsAccordionProps = {
  applicants: HRRecruitmentApplicant[];
  roles: HRRecruitmentRole[];
  updateApplicantStageAction: (formData: FormData) => void | Promise<void>;
};

function roleTitle(roleId: number, roles: HRRecruitmentRole[]): string {
  return roles.find((role) => role.id === roleId)?.title ?? `Role #${roleId}`;
}

export function RecruitmentApplicantsAccordion({
  applicants,
  roles,
  updateApplicantStageAction,
}: RecruitmentApplicantsAccordionProps) {
  if (applicants.length === 0) {
    return (
      <EmptyState
        description="Add an applicant using the form above to start tracking your hiring pipeline."
        icon={UserPlus}
        title="No applicants yet"
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {applicants.map((applicant) => (
        <AccordionItem
          key={applicant.id}
          value={String(applicant.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {applicant.full_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {roleTitle(applicant.role_id, roles)}
              </span>
              <StatusBadge status={applicant.current_stage} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="mb-3 space-y-1 text-xs text-muted-foreground">
              <p>Applied {applicant.applied_at}</p>
              {applicant.email ? <p>{applicant.email}</p> : null}
              <p>Track: {humanizeLabel(applicant.employment_track)}</p>
            </div>
            <form
              action={updateApplicantStageAction}
              className="flex flex-wrap items-center gap-2"
            >
              <input name="applicantId" type="hidden" value={applicant.id} />
              <select
                className={selectClass}
                defaultValue={applicant.current_stage}
                name="stage"
              >
                {HR_RECRUITMENT_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {humanizeLabel(stage)}
                  </option>
                ))}
              </select>
              <Button size="sm" type="submit" variant="outline">
                Update stage
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
