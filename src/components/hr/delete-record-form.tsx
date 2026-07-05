"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type DeleteRecordFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  recordId: number;
  recordIdFieldName?: string;
  label?: string;
  confirmMessage: string;
  extraFields?: ReactNode;
};

export function DeleteRecordForm({
  action,
  recordId,
  recordIdFieldName = "recordId",
  label = "Delete",
  confirmMessage,
  extraFields,
}: DeleteRecordFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name={recordIdFieldName} value={recordId} />
      {extraFields}
      <Button type="submit" size="sm" variant="destructive">
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </Button>
    </form>
  );
}
