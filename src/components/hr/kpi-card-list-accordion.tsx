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
import { Input } from "@/components/ui/input";
import type { HRKpiCardWithEmployee } from "@/lib/hr/kpi-cards";
import { humanizeLabel } from "@/lib/labels";
import type { HRKpiCardItem } from "@/lib/types";
import { HR_KPI_CARD_STATUSES } from "@/lib/types";
import { Target } from "lucide-react";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type KpiCardListAccordionProps = {
  cards: HRKpiCardWithEmployee[];
  itemsByCard: Record<number, HRKpiCardItem[]>;
  updateCardStatusAction: (formData: FormData) => void | Promise<void>;
  addItemAction: (formData: FormData) => void | Promise<void>;
  deleteCardAction: (formData: FormData) => void | Promise<void>;
  deleteItemAction: (formData: FormData) => void | Promise<void>;
};

export function KpiCardListAccordion({
  cards,
  itemsByCard,
  updateCardStatusAction,
  addItemAction,
  deleteCardAction,
  deleteItemAction,
}: KpiCardListAccordionProps) {
  if (cards.length === 0) {
    return (
      <EmptyState
        description="Create a KPI card above to define employee goals for the period."
        icon={Target}
        title="No KPI cards yet"
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {cards.map((card) => {
        const items = itemsByCard[card.id] ?? [];

        return (
          <AccordionItem
            key={card.id}
            value={String(card.id)}
            className="border-[var(--color-rule)] px-3 last:border-b-0"
          >
            <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
              <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {card.employee_name}
                </span>
                <span className="text-xs text-muted-foreground">{card.period}</span>
                <StatusBadge status={card.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent transition={accordionEase} className="pb-4 pt-1">
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground">
                  <p>{card.role_title || "Role not set"}</p>
                  {card.company_goal ? <p>Goal: {card.company_goal}</p> : null}
                </div>

                <form
                  action={updateCardStatusAction}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input name="cardId" type="hidden" value={card.id} />
                  <select
                    className={selectClass}
                    defaultValue={card.status}
                    name="status"
                  >
                    {HR_KPI_CARD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline">
                    Save status
                  </Button>
                </form>

                <div className="space-y-1.5">
                  {items.length === 0 ? (
                    <EmptyState
                      className="p-4"
                      description="Add KPIs using the form below."
                      icon={Target}
                      title="No KPIs on this card yet"
                    />
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.kpi_text}</p>
                          {item.target_measure ? (
                            <p className="text-xs text-muted-foreground">
                              Target: {item.target_measure}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {item.weight}%
                          </span>
                          <DeleteRecordForm
                            action={deleteItemAction}
                            confirmMessage={`Delete KPI "${item.kpi_text}"?`}
                            label="Remove"
                            recordId={item.id}
                            recordIdFieldName="itemId"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  action={addItemAction}
                  className="grid gap-2 sm:grid-cols-[2fr_1.4fr_0.6fr_auto]"
                >
                  <input name="cardId" type="hidden" value={card.id} />
                  <Input
                    className="h-8 text-xs"
                    name="kpiText"
                    placeholder="SMART KPI"
                    required
                  />
                  <Input
                    className="h-8 text-xs"
                    name="targetMeasure"
                    placeholder="Target / measure"
                  />
                  <Input
                    className="h-8 text-xs"
                    name="weight"
                    placeholder="Weight %"
                    step="1"
                    type="number"
                  />
                  <Button size="sm" type="submit" variant="outline">
                    Add KPI
                  </Button>
                </form>

                <DeleteRecordForm
                  action={deleteCardAction}
                  confirmMessage={`Delete KPI card for ${card.employee_name} (${card.period})? All KPIs on this card will be removed.`}
                  recordId={card.id}
                  recordIdFieldName="cardId"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
