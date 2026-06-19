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
import type {
  HRDisciplinaryCase,
  HRFollowupAction,
  HRPolicyViolation,
} from "@/lib/types";
import { HR_DISCIPLINARY_STATUSES } from "@/lib/types";
import { ClipboardList, Gavel, ShieldAlert } from "lucide-react";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type DisciplinaryCasesAccordionProps = {
  cases: HRDisciplinaryCase[];
  updateCaseStatusAction: (formData: FormData) => void | Promise<void>;
};

export function DisciplinaryCasesAccordion({
  cases,
  updateCaseStatusAction,
}: DisciplinaryCasesAccordionProps) {
  if (cases.length === 0) {
    return (
      <EmptyState
        description="Open a disciplinary case using the form above when action is required."
        icon={Gavel}
        title="No disciplinary cases yet"
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {cases.map((caseItem) => (
        <AccordionItem
          key={caseItem.id}
          value={String(caseItem.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {caseItem.summary}
              </span>
              <span className="text-xs text-muted-foreground">{caseItem.category}</span>
              <StatusBadge status={caseItem.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <p className="mb-3 text-xs text-muted-foreground">
              Opened {caseItem.opened_at}
              {caseItem.due_date ? ` · Due ${caseItem.due_date}` : ""}
            </p>
            <form action={updateCaseStatusAction} className="flex flex-wrap items-center gap-2">
              <input name="caseId" type="hidden" value={caseItem.id} />
              <select
                className={selectClass}
                defaultValue={caseItem.status}
                name="status"
              >
                {HR_DISCIPLINARY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <Button size="sm" type="submit" variant="outline">
                Save status
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

type PolicyViolationsAccordionProps = {
  violations: HRPolicyViolation[];
};

export function PolicyViolationsAccordion({ violations }: PolicyViolationsAccordionProps) {
  if (violations.length === 0) {
    return (
      <EmptyState
        description="Log a policy violation using the form above to keep a compliance record."
        icon={ShieldAlert}
        title="No policy violations yet"
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {violations.map((violation) => (
        <AccordionItem
          key={violation.id}
          value={String(violation.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {violation.category}
              </span>
              <span className="text-xs text-muted-foreground">{violation.occurred_on}</span>
              <StatusBadge status={violation.severity} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <p className="text-xs text-muted-foreground">
              Severity {humanizeLabel(violation.severity)}
              {violation.notes ? ` · ${violation.notes}` : " · No notes recorded"}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

type FollowupActionsAccordionProps = {
  actions: HRFollowupAction[];
  updateFollowupStatusAction: (formData: FormData) => void | Promise<void>;
};

export function FollowupActionsAccordion({
  actions,
  updateFollowupStatusAction,
}: FollowupActionsAccordionProps) {
  if (actions.length === 0) {
    return (
      <EmptyState
        description="Add a follow-up action using the form above to track next steps."
        icon={ClipboardList}
        title="No follow-up actions yet"
      />
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
                {action.action_type}
              </span>
              <span className="text-xs text-muted-foreground">
                Due {action.due_date ?? "n/a"}
              </span>
              <StatusBadge status={action.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            {action.notes ? (
              <p className="mb-3 text-xs text-muted-foreground">{action.notes}</p>
            ) : null}
            <form action={updateFollowupStatusAction} className="flex flex-wrap items-center gap-2">
              <input name="actionId" type="hidden" value={action.id} />
              <select
                className={selectClass}
                defaultValue={action.status}
                name="status"
              >
                <option value="pending">{humanizeLabel("pending")}</option>
                <option value="in_progress">{humanizeLabel("in_progress")}</option>
                <option value="done">{humanizeLabel("done")}</option>
              </select>
              <Button size="sm" type="submit" variant="outline">
                Save status
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
