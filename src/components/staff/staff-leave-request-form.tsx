"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type StaffLeaveRequestFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  requestTypeOptions: string[];
};

export function StaffLeaveRequestForm({
  action,
  requestTypeOptions,
}: StaffLeaveRequestFormProps) {
  const [requestCategory, setRequestCategory] = useState("leave");
  const isLateArrival = requestCategory === "late_arrival";

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Request type</span>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          name="requestCategory"
          required
          value={requestCategory}
          onChange={(event) => setRequestCategory(event.target.value)}
        >
          <option value="leave">Leave / absence</option>
          <option value="late_arrival">Late arrival</option>
        </select>
      </label>

      {!isLateArrival ? (
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Leave type</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            name="leaveType"
          >
            {requestTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div
        className={
          isLateArrival
            ? "grid gap-3 sm:grid-cols-2"
            : "grid gap-3 sm:grid-cols-2"
        }
      >
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">
            {isLateArrival ? "Date" : "Start date"}
          </span>
          <Input name="startDate" required type="date" />
        </label>
        {!isLateArrival ? (
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">End date</span>
            <Input name="endDate" type="date" />
          </label>
        ) : (
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Expected arrival</span>
            <Input name="lateArrivalTime" required type="time" />
          </label>
        )}
      </div>

      <label className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Reason</span>
        <Textarea name="reason" required placeholder="Briefly explain the request." />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Coverage or handover</span>
        <Textarea
          name="coveragePlan"
          placeholder="Who is covering urgent work, or what has already been handed over?"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Contact number</span>
        <Input name="contactNumber" placeholder="Optional" />
      </label>

      <Button type="submit">Submit for approval</Button>
    </form>
  );
}
