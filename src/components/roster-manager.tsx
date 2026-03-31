"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { splitRosterNames } from "@/lib/roster";

type RosterManagerProps = {
  initialNames: string[];
};

type RosterResponse = {
  names?: string[];
  addedNames?: string[];
  error?: string;
};

function readErrorMessage(data: RosterResponse, fallback: string): string {
  return data.error ?? fallback;
}

export function RosterManager({ initialNames }: RosterManagerProps) {
  const [names, setNames] = useState(initialNames);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  useEffect(() => {
    setNames(initialNames);
  }, [initialNames]);

  const parsedDraftNames = splitRosterNames(draft);

  const syncRoster = (data: RosterResponse) => {
    setNames(Array.isArray(data.names) ? data.names : []);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const namesToAdd = splitRosterNames(draft);
    if (namesToAdd.length === 0) {
      setError("Paste at least one approved name.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: draft }),
      });

      const data = (await response.json().catch(() => ({}))) as RosterResponse;
      if (!response.ok) {
        setError(readErrorMessage(data, "Unable to add approved names."));
        return;
      }

      syncRoster(data);
      setDraft("");
      const addedCount = data.addedNames?.length ?? 0;
      setStatus(
        addedCount > 0
          ? `${addedCount} name${addedCount === 1 ? "" : "s"} added.`
          : "Roster updated."
      );
    } catch {
      setError("Network error while saving the roster.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (name: string) => {
    if (!window.confirm(`Remove ${name} from the approved roster?`)) {
      return;
    }

    setError(null);
    setStatus(null);
    setDeletingName(name);

    try {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = (await response.json().catch(() => ({}))) as RosterResponse;
      if (!response.ok) {
        setError(readErrorMessage(data, "Unable to remove approved name."));
        return;
      }

      syncRoster(data);
      setStatus(`${name} removed from the roster.`);
    } catch {
      setError("Network error while updating the roster.");
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add approved names</CardTitle>
          <CardDescription>
            Paste one name per line, or separate names with commas or semicolons.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Textarea
              aria-label="Approved names"
              className="min-h-48"
              placeholder="Alice Johnson
Bob Smith
Clara Mensah"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Parsed {parsedDraftNames.length} name
                {parsedDraftNames.length === 1 ? "" : "s"}.
              </p>

              <Button disabled={submitting || parsedDraftNames.length === 0} type="submit">
                {submitting ? "Saving..." : "Add to roster"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Approved names are the only names that can submit check-ins.
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Approved roster</CardTitle>
            <CardDescription>These names are available in the public check-in form.</CardDescription>
          </div>

          <Badge variant="secondary">{names.length}</Badge>
        </CardHeader>
        <CardContent>
          {names.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No approved names yet. Add them on the left before opening check-in to employees.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {names.map((name) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={deletingName === name}
                        onClick={() => void onDelete(name)}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        {deletingName === name ? "Removing..." : "Remove"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Changes apply immediately to the public check-in autocomplete and roster validation.
        </CardFooter>
      </Card>
    </div>
  );
}
