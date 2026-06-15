import { NextResponse } from "next/server";
import mammoth from "mammoth";

import { requireAdminApi } from "@/lib/admin-auth";
import { listImportRuns } from "@/lib/hr/import-runs";
import {
  ensureImportScope,
  getImportTemplate,
  runHrCsvImport,
  type HRImportScope,
} from "@/lib/hr-imports";

type RouteContext = {
  params: Promise<{ scope: string }>;
};

type ImportPayload = {
  csv?: unknown;
  dryRun?: unknown;
};

function normalizeImportedText(text: string): string {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.includes(",")) {
        return line;
      }

      if (line.includes("\t")) {
        return line.replace(/\t+/g, ",");
      }

      return line.replace(/\s{2,}/g, ",");
    });

  return lines.join("\n");
}

async function readCsvFromRequest(request: Request): Promise<{
  csv: string;
  dryRun: boolean;
}> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const dryRun =
      formData.get("dryRun") === "true" || formData.get("dryRun") === "1";
    const csvField = formData.get("csv");
    if (typeof csvField === "string" && csvField.trim()) {
      return { csv: csvField, dryRun };
    }

    const fileField = formData.get("file");
    if (fileField instanceof File) {
      const filename = fileField.name.toLowerCase();

      if (filename.endsWith(".docx")) {
        const fileBuffer = Buffer.from(await fileField.arrayBuffer());
        const extracted = await mammoth.extractRawText({ buffer: fileBuffer });
        const normalized = normalizeImportedText(extracted.value);

        if (!normalized.trim()) {
          throw new Error("Could not extract usable rows from the DOCX file.");
        }

        return { csv: normalized, dryRun };
      }

      if (filename.endsWith(".csv") || filename.endsWith(".txt") || filename.endsWith(".md")) {
        return { csv: normalizeImportedText(await fileField.text()), dryRun };
      }

      throw new Error("Unsupported file format. Upload a CSV, DOCX, TXT, or MD file.");
    }

    throw new Error("Provide csv text or a file field in multipart payload.");
  }

  let payload: ImportPayload;
  try {
    payload = (await request.json()) as ImportPayload;
  } catch {
    throw new Error("Invalid JSON payload.");
  }

  const csv = typeof payload.csv === "string" ? payload.csv : "";
  if (!csv.trim()) {
    throw new Error("csv is required.");
  }

  const dryRun =
    payload.dryRun === true ||
    payload.dryRun === "true" ||
    payload.dryRun === 1 ||
    payload.dryRun === "1";

  return { csv, dryRun };
}

function parseScope(value: string): HRImportScope {
  try {
    return ensureImportScope(value);
  } catch {
    throw new Error(
      `Unsupported import scope: ${value}. Use employees, recruitment, leave, or payroll.`
    );
  }
}

function buildSampleFilename(scope: HRImportScope): string {
  return `nm-hr-${scope}-sample.csv`;
}

export async function GET(request: Request, context: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let scope: HRImportScope;
  try {
    const params = await context.params;
    scope = parseScope(params.scope);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid scope." },
      { status: 400 }
    );
  }

  try {
    const template = getImportTemplate(scope);
    const url = new URL(request.url);
    const shouldDownload = url.searchParams.get("download") === "1";

    if (shouldDownload) {
      return new NextResponse(template, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${buildSampleFilename(scope)}"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    }

    const runs = await listImportRuns(100);
    return NextResponse.json({
      scope,
      template,
      runs: runs.filter((run) => run.scope === scope),
    });
  } catch (error) {
    console.error("Failed to load import metadata", error);
    return NextResponse.json(
      { error: "Failed to load import metadata." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  let scope: HRImportScope;
  try {
    const params = await context.params;
    scope = parseScope(params.scope);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid scope." },
      { status: 400 }
    );
  }

  let body: { csv: string; dryRun: boolean };
  try {
    body = await readCsvFromRequest(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid import payload." },
      { status: 400 }
    );
  }

  try {
    const result = await runHrCsvImport({
      scope,
      csv: body.csv,
      dryRun: body.dryRun,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Failed to run HR import", error);
    return NextResponse.json(
      { error: "Failed to run HR import." },
      { status: 500 }
    );
  }
}
