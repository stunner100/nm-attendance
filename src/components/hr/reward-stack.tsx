"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import { HR_REWARD_TIERS } from "@/lib/types";

type RewardStackProps = {
  employeeOptions: HREmployeeOption[];
  createRewardAction: (formData: FormData) => void | Promise<void>;
};

const fieldNames = ["employeeId", "tier", "rewardType", "awardedOn", "description"] as const;

export function RewardStack({
  employeeOptions,
  createRewardAction,
}: RewardStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

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
      id: "tier",
      label: "Reward tier",
      type: "select",
      options: HR_REWARD_TIERS.map((tier) => ({
        value: tier,
        label: humanizeLabel(tier),
      })),
    },
    {
      id: "rewardType",
      label: "Reward type",
      type: "text",
      placeholder: "Bonus, recognition, promotion…",
      required: true,
    },
    {
      id: "awardedOn",
      label: "Awarded on",
      type: "date",
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Description / reason (optional)",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    tier: "monthly",
    rewardType: "",
    awardedOn: "",
    description: "",
  };

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

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createRewardAction} className="hidden" aria-hidden>
        {fieldNames.map((name) => (
          <input key={name} name={name} type="hidden" />
        ))}
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save reward"
      />
    </div>
  );
}
