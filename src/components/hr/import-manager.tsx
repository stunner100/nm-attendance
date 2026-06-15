"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Download, Eye, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

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

function detectScopeFromHeaders(csv: string): HRImportScope | null {
  const firstLine = csv.split("\n")[0]?.toLowerCase() || "";
  if (firstLine.includes("employee_code") && firstLine.includes("department") && firstLine.includes("contract_type")) {
    return "employees";
  }
  if (firstLine.includes("role_title") || firstLine.includes("applicant_name")) {
    return "recruitment";
  }
  if (firstLine.includes("leave_type") || firstLine.includes("annual_days") || firstLine.includes("start_date")) {
    return "leave";
  }
  if (firstLine.includes("cycle_month") || firstLine.includes("anomaly_type")) {
    return "payroll";
  }
  return null;
}

export function ImportManager({ initialRuns }: ImportManagerProps) {
  const [scope, setScope] = useState<HRImportScope>("employees");
  const [csv, setCsv] = useState("");
  const [previewResult, setPreviewResult] = useState<HRImportResult | null>(null);
  const [importResult, setImportResult] = useState<HRImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<string>("");
  const [runs, setRuns] = useState<ImportRun[]>(initialRuns);
  const [isRunning, setIsRunning] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
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
          setPreviewResult(null);
          setImportResult(null);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load import metadata.");
        }
      }
    };

    void loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [scope]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (
      !lowerName.endsWith(".csv") &&
      !lowerName.endsWith(".docx") &&
      !lowerName.endsWith(".txt") &&
      !lowerName.endsWith(".md")
    ) {
      setError("Please upload a .csv or .docx file (also supports .txt and .md).");
      return;
    }

    setFileName(file.name);
    setError(null);
    setPreviewResult(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCsv(text);
        const detected = detectScopeFromHeaders(text);
        if (detected && detected !== scope) {
          setScope(detected);
        }
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

  const runAction = async (dryRun: boolean) => {
    setError(null);

    if (!csv.trim()) {
      setError("Upload or paste CSV data first.");
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch(`/api/hr/import/${scope}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv, dryRun }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        result?: HRImportResult;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }

      if (data.result) {
        if (dryRun) {
          setPreviewResult(data.result);
        } else {
          setImportResult(data.result);
          setPreviewResult(null);
        }
      }

      const runsResponse = await fetch(`/api/hr/import/${scope}`, { cache: "no-store" });
      const runsData = (await runsResponse.json().catch(() => ({}))) as {
        runs?: ImportRun[];
      };
      setRuns(Array.isArray(runsData.runs) ? runsData.runs : []);
    } catch {
      setError("Network error while importing data.");
    } finally {
      setIsRunning(false);
    }
  };

  const scopeLabel = IMPORT_SCOPES.find((s) => s.value === scope)?.label ?? scope;
  const hasErrors = previewResult !== null && previewResult.rowsFailed > 0;

  const viewDataLink = (() => {
    switch (scope) {
      case "employees":
        return "/admin/headcount";
      case "recruitment":
        return "/admin/recruitment";
      case "leave":
        return "/admin/payroll-leave";
      case "payroll":
        return "/admin/payroll-leave";
      default:
        return "/admin";
    }
  })();

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Upload a CSV or DOCX file, or paste data to import {scopeLabel.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">What are you importing?</span>
              <select
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                onChange={(event) => {
                  setScope(event.target.value as HRImportScope);
                  setPreviewResult(null);
                  setImportResult(null);
                }}
                value={scope}
              >
                {IMPORT_SCOPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                accept=".csv,.docx,.txt,.md"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Upload className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                    {fileName ? fileName : "Drop your CSV or DOCX file here, or click to browse"}
                </p>
                <p className="mt-1 text-xs text-slate-500">.csv, .docx, .txt, .md</p>
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
                setPreviewResult(null);
                setImportResult(null);
                const detected = detectScopeFromHeaders(event.target.value);
                if (detected && detected !== scope) {
                  setScope(detected);
                }
              }}
              placeholder="employee_code,full_name,department,contract_type&#10;EMP-001,Jane Smith,Tech,full_time"
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
              disabled={isRunning || !csv.trim()}
              onClick={() => void runAction(true)}
              type="button"
              variant="outline"
            >
              {isRunning && importResult === null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
            <Button
              disabled={isRunning || !csv.trim() || (previewResult === null && importResult === null)}
              onClick={() => void runAction(false)}
              type="button"
            >
              {isRunning && importResult === null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {importResult !== null
                ? "Import Again"
                : previewResult === null
                  ? "Preview first"
                  : hasErrors
                    ? "Fix errors first"
                    : "Import"}
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {previewResult ? (
            <div className="space-y-3 rounded-xl border p-4 text-sm">
              <p className="font-medium">
                Preview complete &mdash; {previewResult.rowsSuccess} of {previewResult.rowsTotal} rows are valid
              </p>
              <p className="text-xs text-muted-foreground">
                Success: {previewResult.rowsSuccess} &bull; Failed: {previewResult.rowsFailed}
              </p>
              {previewResult.errors.length > 0 ? (
                <div className="space-y-1">
                  {previewResult.errors.slice(0, 20).map((entry, index) => (
                    <p key={`${entry.row}-${index}`} className="text-xs text-destructive">
                      Row {entry.row}: {entry.message}
                    </p>
                  ))}
                  {previewResult.errors.length > 20 ? (
                    <p className="text-xs text-muted-foreground">
                      {previewResult.errors.length - 20} more error(s) omitted.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-emerald-700">No validation errors. Ready to import.</p>
              )}
            </div>
          ) : null}

          {importResult ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold text-emerald-900">
                  Import complete &mdash; {importResult.rowsSuccess} rows imported
                </p>
              </div>
              {importResult.rowsFailed > 0 && (
                <p className="text-xs text-emerald-700">
                  {importResult.rowsFailed} row(s) skipped due to errors.
                </p>
              )}
              <a
                href={viewDataLink}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                View imported data
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
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
