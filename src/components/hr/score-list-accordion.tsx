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
import { SCORE_DIMENSIONS } from "@/lib/hr/framework-reference";
import type { HRMonthlyScoreWithEmployee } from "@/lib/hr/scores";
import { BarChart3 } from "lucide-react";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type ScoreListAccordionProps = {
  scores: HRMonthlyScoreWithEmployee[];
  deleteScoreAction: (formData: FormData) => void | Promise<void>;
};

const scoreValueByKey: Record<
  (typeof SCORE_DIMENSIONS)[number]["key"],
  (score: HRMonthlyScoreWithEmployee) => number
> = {
  kpi: (score) => score.kpi_score,
  discipline: (score) => score.discipline_score,
  attendance: (score) => score.attendance_score,
  hygiene: (score) => score.hygiene_score,
  extracurricular: (score) => score.extracurricular_score,
};

export function ScoreListAccordion({ scores, deleteScoreAction }: ScoreListAccordionProps) {
  if (scores.length === 0) {
    return (
      <EmptyState
        description="Log a monthly score above to start tracking performance ratings."
        icon={BarChart3}
        title="No monthly scores recorded yet"
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {scores.map((score) => (
        <AccordionItem
          key={score.id}
          value={String(score.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {score.employee_name}
              </span>
              <span className="text-xs text-muted-foreground">{score.period}</span>
              <span className="text-xs text-muted-foreground">{score.department}</span>
              <span className="text-lg font-medium tabular-nums text-foreground">
                {score.total_score.toFixed(1)}
              </span>
              <StatusBadge status={score.rating} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              {SCORE_DIMENSIONS.map((dimension) => (
                <p key={dimension.key}>
                  <span className="font-semibold text-foreground">{dimension.label}:</span>{" "}
                  {scoreValueByKey[dimension.key](score)} / {dimension.weight} pts
                </p>
              ))}
              {score.scored_by ? (
                <p className="sm:col-span-2">
                  <span className="font-semibold text-foreground">Scored by:</span>{" "}
                  {score.scored_by}
                </p>
              ) : null}
              {score.notes ? (
                <p className="sm:col-span-2">
                  <span className="font-semibold text-foreground">Notes:</span> {score.notes}
                </p>
              ) : null}
            </div>
            <div className="mt-3">
              <DeleteRecordForm
                action={deleteScoreAction}
                confirmMessage={`Delete ${score.employee_name}'s score for ${score.period}?`}
                recordId={score.id}
                recordIdFieldName="scoreId"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
