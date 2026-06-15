"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SCORE_WEIGHTS, computeRating, RATING_BANDS } from "@/lib/hr/framework-reference";

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

export function ScoreForm({ employees, defaultPeriod, action }: ScoreFormProps) {
  const [kpi, setKpi] = useState(0);
  const [task, setTask] = useState(0);
  const [comms, setComms] = useState(0);
  const [teamwork, setTeamwork] = useState(0);

  const total =
    Math.round(
      ((clamp(kpi) * SCORE_WEIGHTS.kpi +
        clamp(task) * SCORE_WEIGHTS.task +
        clamp(comms) * SCORE_WEIGHTS.comms +
        clamp(teamwork) * SCORE_WEIGHTS.teamwork) /
        100) *
        100
    ) / 100;
  const rating = computeRating(total);
  const ratingLabel = RATING_BANDS.find((band) => band.band === rating)?.label ?? rating;

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

      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted-foreground">
          KPI performance ({SCORE_WEIGHTS.kpi}%)
        </span>
        <Input
          max={100}
          min={0}
          name="kpiScore"
          onChange={(event) => setKpi(Number(event.target.value))}
          type="number"
          value={kpi}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted-foreground">
          Task completion ({SCORE_WEIGHTS.task}%)
        </span>
        <Input
          max={100}
          min={0}
          name="taskScore"
          onChange={(event) => setTask(Number(event.target.value))}
          type="number"
          value={task}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted-foreground">
          Communication & reporting ({SCORE_WEIGHTS.comms}%)
        </span>
        <Input
          max={100}
          min={0}
          name="commsScore"
          onChange={(event) => setComms(Number(event.target.value))}
          type="number"
          value={comms}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted-foreground">
          Teamwork, ownership & discipline ({SCORE_WEIGHTS.teamwork}%)
        </span>
        <Input
          max={100}
          min={0}
          name="teamworkScore"
          onChange={(event) => setTeamwork(Number(event.target.value))}
          type="number"
          value={teamwork}
        />
      </label>

      <Input className="sm:col-span-2" name="scoredBy" placeholder="Scored by (name)" />
      <Textarea className="sm:col-span-2" name="notes" placeholder="Notes (optional)" />

      <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-3 sm:col-span-2">
        <div>
          <p className="text-xs text-muted-foreground">Weighted monthly score</p>
          <p className="text-2xl font-bold text-slate-900">{total.toFixed(1)} / 100</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="text-lg font-semibold text-slate-900">{ratingLabel}</p>
        </div>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit">Save Monthly Score</Button>
      </div>
    </form>
  );
}
