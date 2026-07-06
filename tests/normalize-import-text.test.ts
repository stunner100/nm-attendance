import assert from "node:assert/strict";
import test from "node:test";

import { parseCsv } from "../src/lib/csv";
import { normalizeImportedText } from "../src/lib/normalize-import-text";

test("splits a merged header and data row on one line", () => {
  const input =
    "employee_code,full_name,department,contract_type EMP-001,Jane Smith,Tech,full_time";
  const normalized = normalizeImportedText(input);
  const parsed = parseCsv(normalized);

  assert.equal(parsed.rows.length, 1);
  assert.deepEqual(parsed.rows[0], {
    employee_code: "EMP-001",
    full_name: "Jane Smith",
    department: "Tech",
    contract_type: "full_time",
  });
});

test("keeps already valid multiline csv unchanged", () => {
  const input =
    "employee_code,full_name,department,contract_type\nEMP-001,Jane Smith,Tech,full_time";
  assert.equal(normalizeImportedText(input), input);
});
