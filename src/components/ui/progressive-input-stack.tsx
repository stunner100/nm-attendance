"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepOption = {
  value: string;
  label: string;
};

export type StepField = {
  id: string;
  label: string;
  type: "date" | "text";
  placeholder?: string;
};

export interface StepData {
  id: string;
  label: string;
  type: "text" | "email" | "date" | "select" | "toggle" | "compound" | "textarea" | "number";
  placeholder?: string;
  required?: boolean;
  options?: StepOption[];
  fields?: StepField[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

interface ProgressiveInputStackProps {
  steps: StepData[];
  initialData?: Record<string, string | boolean>;
  onSubmit?: (data: Record<string, string | boolean>) => void;
  onChange?: (data: Record<string, string | boolean>) => void;
  submitLabel?: string;
  className?: string;
}

const easeTransition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

const inputClass =
  "w-full bg-transparent text-base font-medium text-[var(--color-ink)] outline-none placeholder:text-muted-foreground md:text-sm";

const selectClass =
  "w-full rounded-[var(--radius-input)] border-0 bg-transparent text-base font-medium text-[var(--color-ink)] outline-none md:text-sm";

const textareaClass =
  "w-full min-h-[4.5rem] resize-none bg-transparent text-base font-medium text-[var(--color-ink)] outline-none placeholder:text-muted-foreground md:text-sm";

export const ProgressiveInputStack: React.FC<ProgressiveInputStackProps> = ({
  steps,
  initialData,
  onSubmit,
  onChange,
  submitLabel = "Add employee",
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState<Record<string, string | boolean>>(
    initialData ||
      steps.reduce<Record<string, string | boolean>>((acc, step) => {
        if (step.type === "compound" && step.fields) {
          for (const field of step.fields) {
            acc[field.id] = "";
          }
          return acc;
        }
        return {
          ...acc,
          [step.id]: step.type === "toggle" ? false : "",
        };
      }, {}),
  );

  useEffect(() => {
    onChange?.(formData);
  }, [formData, onChange]);

  const handleNext = () => {
    const step = steps[currentStep];
    if (step?.required) {
      if (step.type === "compound" && step.fields) {
        const missing = step.fields.some(
          (field) => field.type === "text" && !String(formData[field.id] ?? "").trim(),
        );
        if (missing && step.required) return;
      } else if (!String(formData[step.id] ?? "").trim()) {
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onSubmit?.(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const updateField = (id: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const renderStepField = (step: StepData, isTop: boolean) => {
    if (step.type === "compound" && step.fields) {
      return (
        <div className="flex w-full flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
          {step.fields.map((field) => (
            <label key={field.id} className="space-y-1">
              <span className="text-[11px] text-muted-foreground">{field.label}</span>
              <input
                autoFocus={isTop && field.id === step.fields?.[0]?.id}
                type={field.type}
                value={formData[field.id] as string}
                onChange={(e) => updateField(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      );
    }

    if (step.type === "select" && step.options) {
      return (
        <div className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
          <select
            autoFocus={isTop}
            value={formData[step.id] as string}
            onChange={(e) => updateField(step.id, e.target.value)}
            className={selectClass}
          >
            {step.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (step.type === "toggle") {
      return (
        <div className="flex w-full items-center gap-4">
          <span className="min-w-0 flex-1 truncate text-base font-medium text-[var(--color-ink)]">
            {step.label}
          </span>
          <button
            type="button"
            onClick={() => updateField(step.id, !formData[step.id])}
            className={cn(
              "relative flex h-7 w-12 shrink-0 items-center rounded-full border border-[var(--color-rule)] p-1 transition-colors duration-150",
              formData[step.id] ? "bg-[var(--color-ink)]" : "bg-[var(--color-paper-3)]",
            )}
          >
            <motion.div
              animate={{ x: formData[step.id] ? 20 : 0 }}
              transition={easeTransition}
              className="h-5 w-5 rounded-full bg-[var(--color-paper)]"
            />
          </button>
        </div>
      );
    }

    if (step.type === "textarea") {
      return (
        <div className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
          <textarea
            autoFocus={isTop}
            value={formData[step.id] as string}
            onChange={(e) => updateField(step.id, e.target.value)}
            placeholder={step.placeholder}
            rows={step.rows ?? 3}
            className={textareaClass}
          />
        </div>
      );
    }

    if (step.type === "number") {
      return (
        <div className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
          <input
            autoFocus={isTop}
            type="number"
            min={step.min}
            max={step.max}
            step={step.step}
            value={formData[step.id] as string}
            onChange={(e) => updateField(step.id, e.target.value)}
            placeholder={step.placeholder}
            className={inputClass}
          />
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
        <input
          autoFocus={isTop}
          type={step.type === "email" ? "email" : step.type === "date" ? "date" : "text"}
          value={formData[step.id] as string}
          onChange={(e) => updateField(step.id, e.target.value)}
          placeholder={step.placeholder}
          className={inputClass}
        />
      </div>
    );
  };

  return (
    <div className={cn("relative flex w-full max-w-md flex-col gap-6", className)}>
      <div
        className={cn(
          "relative w-full",
          steps[currentStep]?.type === "textarea" || steps[currentStep]?.type === "compound"
            ? "min-h-[120px]"
            : "min-h-[72px]",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {steps.map((step, index) => {
            if (index > currentStep) return null;

            const position = currentStep - index;
            const isTop = index === currentStep;
            const isTallStep = step.type === "textarea" || step.type === "compound";

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  scale: 1 - position * 0.03,
                  y: -position * 10,
                }}
                exit={{ opacity: 0, y: 12 }}
                transition={easeTransition}
                className={cn(
                  "absolute inset-x-0 top-0 flex items-center rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3",
                  isTallStep ? "min-h-[120px]" : "min-h-[72px]",
                  !isTop && "pointer-events-none opacity-60",
                )}
              >
                {renderStepField(step, isTop)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {currentStep > 0 && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBack}
              transition={easeTransition}
              className="flex size-10 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] transition-colors duration-150 hover:bg-[var(--color-paper-2)]"
            >
              <ArrowLeft size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={handleNext}
          className="ml-auto flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-[var(--color-accent-active)]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {currentStep === steps.length - 1 ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={easeTransition}
                className="flex items-center gap-2"
              >
                <Check size={16} />
                {submitLabel}
              </motion.div>
            ) : (
              <motion.div
                key="next"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={easeTransition}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight size={16} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};
