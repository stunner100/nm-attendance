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
import { DeleteRecordForm } from "@/components/hr/delete-record-form";
import type { HRTaskWithEmployee } from "@/lib/hr/tasks";
import { humanizeLabel } from "@/lib/labels";
import { HR_TASK_STATUSES } from "@/lib/types";
import { ListTodo } from "lucide-react";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type TaskListAccordionProps = {
  tasks: HRTaskWithEmployee[];
  updateStatusAction: (formData: FormData) => void | Promise<void>;
  deleteTaskAction: (formData: FormData) => void | Promise<void>;
};

export function TaskListAccordion({
  tasks,
  updateStatusAction,
  deleteTaskAction,
}: TaskListAccordionProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        description="Assign a task above to track employee follow-ups and deliverables."
        icon={ListTodo}
        title="No tasks yet"
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {tasks.map((task) => (
        <AccordionItem
          key={task.id}
          value={String(task.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">{task.title}</span>
              <span className="text-xs text-muted-foreground">{task.employee_name}</span>
              <StatusBadge status={task.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {task.due_date ? `Due ${task.due_date}` : "No due date"}
                {task.card_id ? ` · KPI #${task.card_id}` : ""}
                {task.description ? ` · ${task.description}` : ""}
              </p>

              <form
                action={updateStatusAction}
                className="flex flex-wrap items-center gap-2"
              >
                <input name="taskId" type="hidden" value={task.id} />
                <select
                  className={selectClass}
                  defaultValue={task.status}
                  name="status"
                >
                  {HR_TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {humanizeLabel(status)}
                    </option>
                  ))}
                </select>
                <Button size="sm" type="submit" variant="outline">
                  Update
                </Button>
              </form>
              <DeleteRecordForm
                action={deleteTaskAction}
                confirmMessage={`Delete task "${task.title}"?`}
                recordId={task.id}
                recordIdFieldName="taskId"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
