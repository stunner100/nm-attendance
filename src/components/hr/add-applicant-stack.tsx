"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HRRecruitmentRoleOption } from "@/lib/hr/recruitment";
import { humanizeLabel } from "@/lib/labels";
import { HR_RECRUITMENT_STAGES } from "@/lib/types";

type AddApplicantStackProps = {
  roleOptions: HRRecruitmentRoleOption[];
  createApplicantAction: (formData: FormData) => void | Promise<void>;
};

export function AddApplicantStack({
  roleOptions,
  createApplicantAction,
}: AddApplicantStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "roleId",
      label: "Role",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select role" },
        ...roleOptions.map((role) => ({
          value: String(role.id),
          label: `${role.title} (${role.department})`,
        })),
      ],
    },
    {
      id: "fullName",
      label: "Applicant full name",
      type: "text",
      placeholder: "Full name",
      required: true,
    },
    {
      id: "email",
      label: "Email (optional)",
      type: "email",
      placeholder: "name@email.com",
    },
    {
      id: "employmentTrack",
      label: "Employment track",
      type: "select",
      options: [
        { value: "full_time", label: humanizeLabel("full_time") },
        { value: "intern", label: humanizeLabel("intern") },
      ],
    },
    {
      id: "currentStage",
      label: "Current stage",
      type: "select",
      options: HR_RECRUITMENT_STAGES.map((stage) => ({
        value: stage,
        label: humanizeLabel(stage),
      })),
    },
    {
      id: "appliedAt",
      label: "Applied date (optional)",
      type: "date",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    roleId: "",
    fullName: "",
    email: "",
    employmentTrack: "full_time",
    currentStage: "applied",
    appliedAt: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      roleId: String(data.roleId ?? ""),
      fullName: String(data.fullName ?? ""),
      email: String(data.email ?? ""),
      employmentTrack: String(data.employmentTrack ?? "full_time"),
      currentStage: String(data.currentStage ?? "applied"),
      appliedAt: String(data.appliedAt ?? ""),
    };

    for (const [name, value] of Object.entries(fieldMap)) {
      const input = form.elements.namedItem(name) as HTMLInputElement | null;
      if (input) {
        input.value = value;
      }
    }

    form.requestSubmit();
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createApplicantAction} className="hidden" aria-hidden>
        <input name="roleId" type="hidden" />
        <input name="fullName" type="hidden" />
        <input name="email" type="hidden" />
        <input name="employmentTrack" type="hidden" />
        <input name="currentStage" type="hidden" />
        <input name="appliedAt" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Add applicant"
      />
    </div>
  );
}
