"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SCORE_DIMENSIONS,
  SCORE_WEIGHTS,
  computeRating,
  RATING_BANDS,
} from "@/lib/hr/framework-reference";

type EmployeeOption = {
  id: number;
  full_name: string;
};

type ScoreFormProps = {
  employees: EmployeeOption[];
  defaultPeriod: string;
  action: (formData: FormData) => void | Promise<void>;
};

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

const formFieldByKey: Record<(typeof SCORE_DIMENSIONS)[number]["key"], string> = {
  kpi: "kpiScore",
  discipline: "disciplineScore",
  attendance: "attendanceScore",
  hygiene: "hygieneScore",
  extracurricular: "extracurricularScore",
};

export function ScoreForm({ employees, defaultPeriod, action }: ScoreFormProps) {
  const [scores, setScores] = useState({
    kpi: 0,
    discipline: 0,
    attendance: 0,
    hygiene: 0,
    extracurricular: 0,
  });

  const total =
    Math.round(
      ((clamp(scores.kpi) * SCORE_WEIGHTS.kpi +
        clamp(scores.discipline) * SCORE_WEIGHTS.discipline +
        clamp(scores.attendance) * SCORE_WEIGHTS.attendance +
        clamp(scores.hygiene) * SCORE_WEIGHTS.hygiene +
        clamp(scores.extracurricular) * SCORE_WEIGHTS.extracurricular) /
        100) *
        100
    ) / 100;
  const rating = computeRating(total);
  const ratingLabel = RATING_BANDS.find((band) => band.band === rating)?.label ?? rating;

  const setDimension = (key: keyof typeof scores, value: number) => {
    setScores((current) => ({ ...current, [key]: value }));
  };

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        defaultValue=""
        name="employeeId"
        required
      >
        <option disabled value="">
          Select employee
        </option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.full_name}
          </option>
        ))}
      </select>
      <Input defaultValue={defaultPeriod} name="period" placeholder="2026-06" required />

      {SCORE_DIMENSIONS.map((dimension) => {
        const fieldName = formFieldByKey[dimension.key];
        return (
          <label key={dimension.key} className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              {dimension.label} ({dimension.weight}%)
            </span>
            <Input
              max={100}
              min={0}
              name={fieldName}
              onChange={(event) => setDimension(dimension.key, Number(event.target.value))}
              type="number"
              value={scores[dimension.key]}
            />
          </label>
        );
      })}

      <Input className="sm:col-span-2" name="scoredBy" placeholder="Scored by (name)" />
      <Textarea className="sm:col-span-2" name="notes" placeholder="Notes (optional)" />

      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-muted px-4 py-3 sm:col-span-2">
        <div>
          <p className="text-xs text-muted-foreground">Weighted monthly score</p>
          <p className="text-2xl font-medium tabular-nums text-foreground">{total.toFixed(1)} / 100</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="text-lg font-medium text-foreground">{ratingLabel}</p>
        </div>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit">Save Monthly Score</Button>
      </div>
    </form>
  );
}
