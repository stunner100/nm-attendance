"use client";

import { useCallback, useRef, useState } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import {
  SCORE_DIMENSIONS,
  SCORE_WEIGHTS,
  computeRating,
  RATING_BANDS,
} from "@/lib/hr/framework-reference";

type ScoreStackProps = {
  employeeOptions: HREmployeeOption[];
  defaultPeriod: string;
  saveScoreAction: (formData: FormData) => void | Promise<void>;
};

const fieldNames = [
  "employeeId",
  "period",
  "kpiScore",
  "disciplineScore",
  "attendanceScore",
  "hygieneScore",
  "extracurricularScore",
  "scoredBy",
  "notes",
] as const;

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function ScoreStack({
  employeeOptions,
  defaultPeriod,
  saveScoreAction,
}: ScoreStackProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState({
    kpi: 0,
    discipline: 0,
    attendance: 0,
    hygiene: 0,
    extracurricular: 0,
  });

  const steps: StepData[] = [
    {
      id: "employeeId",
      label: "Employee",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select employee" },
        ...employeeOptions.map((employee) => ({
          value: String(employee.id),
          label: employee.full_name,
        })),
      ],
    },
    {
      id: "period",
      label: "Period (YYYY-MM)",
      type: "text",
      placeholder: "2026-06",
      required: true,
    },
    ...SCORE_DIMENSIONS.map(
      (dimension): StepData => ({
        id:
          dimension.key === "kpi"
            ? "kpiScore"
            : dimension.key === "discipline"
              ? "disciplineScore"
              : dimension.key === "attendance"
                ? "attendanceScore"
                : dimension.key === "hygiene"
                  ? "hygieneScore"
                  : "extracurricularScore",
        label: `${dimension.label} (${dimension.weight}%)`,
        type: "number",
        min: 0,
        max: 100,
        placeholder: "0–100",
      })
    ),
    {
      id: "scoredBy",
      label: "Scored by",
      type: "text",
      placeholder: "Your name (optional)",
    },
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Notes (optional)",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    period: defaultPeriod,
    kpiScore: "0",
    disciplineScore: "0",
    attendanceScore: "0",
    hygieneScore: "0",
    extracurricularScore: "0",
    scoredBy: "",
    notes: "",
  };

  const total =
    Math.round(
      ((clamp(preview.kpi) * SCORE_WEIGHTS.kpi +
        clamp(preview.discipline) * SCORE_WEIGHTS.discipline +
        clamp(preview.attendance) * SCORE_WEIGHTS.attendance +
        clamp(preview.hygiene) * SCORE_WEIGHTS.hygiene +
        clamp(preview.extracurricular) * SCORE_WEIGHTS.extracurricular) /
        100) *
        100
    ) / 100;
  const rating = computeRating(total);
  const ratingLabel = RATING_BANDS.find((band) => band.band === rating)?.label ?? rating;

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    for (const name of fieldNames) {
      const input = form.elements.namedItem(name) as HTMLInputElement | null;
      if (input) {
        input.value = String(data[name] ?? "");
      }
    }

    form.requestSubmit();
  };

  const handleStepChange = useCallback((data: Record<string, string | boolean>) => {
    setPreview({
      kpi: Number(data.kpiScore ?? 0),
      discipline: Number(data.disciplineScore ?? 0),
      attendance: Number(data.attendanceScore ?? 0),
      hygiene: Number(data.hygieneScore ?? 0),
      extracurricular: Number(data.extracurricularScore ?? 0),
    });
  }, []);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={saveScoreAction} className="hidden" aria-hidden>
        {fieldNames.map((name) => (
          <input key={name} name={name} type="hidden" />
        ))}
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        onChange={handleStepChange}
        submitLabel="Save monthly score"
      />

      <div className="flex max-w-md items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Weighted monthly score</p>
          <p className="text-2xl font-medium tabular-nums text-foreground">
            {total.toFixed(1)} / 100
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="text-lg font-medium text-foreground">{ratingLabel}</p>
        </div>
      </div>
    </div>
  );
}
