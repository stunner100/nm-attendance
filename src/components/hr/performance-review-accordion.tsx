"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import type { HRPerformanceReview } from "@/lib/types";
import { HR_REVIEW_STATUSES } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type PerformanceReviewAccordionProps = {
  reviews: HRPerformanceReview[];
  employeeOptions: HREmployeeOption[];
  updateReviewStatusAction: (formData: FormData) => void | Promise<void>;
};

function employeeName(
  employeeId: number,
  employeeOptions: HREmployeeOption[]
): string {
  return (
    employeeOptions.find((employee) => employee.id === employeeId)?.full_name ??
    `Employee #${employeeId}`
  );
}

export function PerformanceReviewAccordion({
  reviews,
  employeeOptions,
  updateReviewStatusAction,
}: PerformanceReviewAccordionProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Start by scheduling a review for an employee.
      </p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {reviews.map((review) => (
        <AccordionItem
          key={review.id}
          value={String(review.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {review.review_period}
              </span>
              <span className="text-xs text-muted-foreground">
                {employeeName(review.employee_id, employeeOptions)}
              </span>
              <StatusBadge status={review.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="space-y-3 text-xs text-muted-foreground">
              <p>
                Due {review.due_date}
                {review.completed_at ? ` · Completed ${review.completed_at}` : ""}
              </p>
              {review.notes ? <p>{review.notes}</p> : null}
            </div>
            <form
              action={updateReviewStatusAction}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <input name="reviewId" type="hidden" value={review.id} />
              <select
                className={selectClass}
                defaultValue={review.status}
                name="status"
              >
                {HR_REVIEW_STATUSES.map((status) => (
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
