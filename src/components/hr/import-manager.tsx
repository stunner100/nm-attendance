"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Upload, FileText, Download, Eye, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const IMPORT_SCOPES = [
  { value: "employees", label: "Employee Records" },
  { value: "recruitment", label: "Recruitment Data" },
  { value: "leave", label: "Leave Records" },
  { value: "payroll", label: "Payroll Data" },
] as const;

type HRImportScope = (typeof IMPORT_SCOPES)[number]["value"];

type HRImportResult = {
  scope: HRImportScope;
  dryRun: boolean;
  rowsTotal: number;
  rowsSuccess: number;
  rowsFailed: number;
  errors: Array<{ row: number; message: string }>;
};

type ImportRun = {
  id: number;
  scope: string;
  dry_run: boolean;
  rows_total: number;
  rows_success: number;
  rows_failed: number;
  created_at: string;
};

type ImportManagerProps = {
  initialRuns: ImportRun[];
};

export function ImportManager({ initialRuns }: ImportManagerProps) {
  const [scope, setScope] = useState<HRImportScope>("employees");
  const [csv, setCsv] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<HRImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<string>("");
  const [runs, setRuns] = useState<ImportRun[]>(initialRuns);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/hr/import/${scope}`, { cache: "no-store" });
          const data = (await response.json().catch(() => ({}))) as {
            template?: string;
            runs?: ImportRun[];
            error?: string;
          };

          if (!response.ok) {
            if (!cancelled) {
              setError(data.error ?? "Failed to load import template.");
            }
            return;
          }

          if (!cancelled) {
            setTemplate(typeof data.template === "string" ? data.template : "");
            setRuns(Array.isArray(data.runs) ? data.runs : []);
            setResult(null);
          }
        } catch {
          if (!cancelled) {
            setError("Failed to load import metadata.");
          }
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file. To use Excel files, save as CSV first.");
      return;
    }

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCsv(text);
      }
    };
    reader.onerror = () => {
      setError("Could not read the file. Please try again.");
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    if (!template) return;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scope}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async (nextDryRun: boolean) => {
    setError(null);
    setResult(null);

    if (!csv.trim()) {
      setError("Upload or paste CSV data before importing.");
      return;
    }

    try {
      const response = await fetch(`/api/hr/import/${scope}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csv,
          dryRun: nextDryRun,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        result?: HRImportResult;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Import request failed.");
        return;
      }

      if (data.result) {
        setResult(data.result);
        if (nextDryRun) {
          setDryRun(false);
        }
      }

      const runsResponse = await fetch(`/api/hr/import/${scope}`, { cache: "no-store" });
      const runsData = (await runsResponse.json().catch(() => ({}))) as {
        runs?: ImportRun[];
      };
      setRuns(Array.isArray(runsData.runs) ? runsData.runs : []);
    } catch {
      setError("Network error while importing data.");
    }
  };

  const scopeLabel = IMPORT_SCOPES.find((s) => s.value === scope)?.label ?? scope;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>Upload a CSV file or paste data to import {scopeLabel.toLowerCase()}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">What are you importing?</span>
              <select
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                onChange={(event) => setScope(event.target.value as HRImportScope)}
                value={scope}
              >
                {IMPORT_SCOPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Mode</span>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <input
                  checked={dryRun}
                  className="size-4"
                  onChange={(event) => setDryRun(event.target.checked)}
                  type="checkbox"
                  id="dry-run-toggle"
                />
                <label className="text-sm" htmlFor="dry-run-toggle">
                  Preview first (don&apos;t save changes)
                </label>
              </div>
            </label>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Upload file</span>
            <div
              className="relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(fakeEvent);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Upload className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  {fileName ? fileName : "Drop your CSV file here, or click to browse"}
                </p>
                <p className="mt-1 text-xs text-slate-500">.csv files only</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or paste data below</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">CSV data</span>
            <Textarea
              className="min-h-40 font-mono text-xs"
              onChange={(event) => {
                setCsv(event.target.value);
                setFileName(null);
              }}
              placeholder="name,department,hire_date&#10;John Smith,CS,2024-01-15"
              value={csv}
            />
          </label>

          {template ? (
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">Template for {scopeLabel}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-mono text-xs">{template}</pre>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={() => void runImport(true)}
              type="button"
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              disabled={isPending || dryRun}
              onClick={() => void runImport(false)}
              type="button"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {result ? (
            <div className="space-y-2 rounded-xl border p-4 text-sm">
              <p className="font-medium">
                {result.dryRun ? "Preview" : "Import"} complete for {scopeLabel.toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                Total: {result.rowsTotal} &bull; Success: {result.rowsSuccess} &bull; Failed:{" "}
                {result.rowsFailed}
              </p>
              {result.errors.length > 0 ? (
                <div className="space-y-1">
                  {result.errors.slice(0, 20).map((entry, index) => (
                    <p key={`${entry.row}-${index}`} className="text-xs text-destructive">
                      Row {entry.row}: {entry.message}
                    </p>
                  ))}
                  {result.errors.length > 20 ? (
                    <p className="text-xs text-muted-foreground">
                      {result.errors.length - 20} more error(s) omitted.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-emerald-700">No validation errors.</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Import History ({runs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imports yet.</p>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {IMPORT_SCOPES.find((s) => s.value === run.scope)?.label ?? run.scope}
                    {" "}
                    <span className="text-xs text-muted-foreground">
                      ({run.dry_run ? "preview" : "imported"})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total {run.rows_total} &bull; Success {run.rows_success} &bull; Failed {run.rows_failed}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(run.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
