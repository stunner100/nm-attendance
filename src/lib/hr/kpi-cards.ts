import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRKpiCard, HRKpiCardItem, HRKpiCardStatus } from "@/lib/types";
import { HR_KPI_CARD_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  ensureEnumValue,
  normalizeKpiCard,
  normalizeKpiCardItem,
} from "@/lib/hr/shared";
import type { CreateKpiCardInput, CreateKpiCardItemInput } from "@/lib/hr/types";

export type HRKpiCardWithEmployee = HRKpiCard & {
  employee_name: string;
  item_count: number;
};

export async function listKpiCards(options: {
  status?: string;
  period?: string;
  employeeId?: number;
  limit?: number;
} = {}): Promise<HRKpiCardWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`c.status = $${values.length}`);
  }
  if (options.period?.trim()) {
    values.push(options.period.trim());
    conditions.push(`c.period = $${values.length}`);
  }
  if (Number.isFinite(options.employeeId) && Number(options.employeeId) > 0) {
    values.push(options.employeeId);
    conditions.push(`c.employee_id = $${values.length}`);
  }

  let query = `
    SELECT
      c.id, c.employee_id, c.period, c.role_title, c.company_goal, c.status,
      c.created_at, c.updated_at,
      e.full_name AS employee_name,
      (SELECT COUNT(*)::int FROM hr_kpi_card_items i WHERE i.card_id = c.id) AS item_count
    FROM hr_kpi_cards c
    INNER JOIN hr_employees e ON e.id = c.employee_id
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY c.period DESC, c.id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizeKpiCard(row),
    employee_name: asString(row.employee_name),
    item_count: Number(row.item_count) || 0,
  }));
}

export async function listKpiCardItems(cardId: number): Promise<HRKpiCardItem[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT id, card_id, kpi_text, target_measure, weight, created_at
      FROM hr_kpi_card_items
      WHERE card_id = $1
      ORDER BY id ASC
    `,
    [cardId]
  );
  return asRecordRows(result.rows).map(normalizeKpiCardItem);
}

export async function listKpiCardItemsForCards(cardIds: number[]): Promise<HRKpiCardItem[]> {
  if (cardIds.length === 0) {
    return [];
  }
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT id, card_id, kpi_text, target_measure, weight, created_at
      FROM hr_kpi_card_items
      WHERE card_id = ANY($1::int[])
      ORDER BY card_id ASC, id ASC
    `,
    [cardIds]
  );
  return asRecordRows(result.rows).map(normalizeKpiCardItem);
}

export async function createKpiCard(input: CreateKpiCardInput): Promise<HRKpiCard> {
  await ensureDbSchema();
  const pool = getDbPool();
  const status = ensureEnumValue(
    input.status || "draft",
    HR_KPI_CARD_STATUSES,
    "kpiCardStatus"
  );
  const result = await pool.query(
    `
      INSERT INTO hr_kpi_cards (
        employee_id, period, role_title, company_goal, company_goal_id,
        department_goal_id, status, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, employee_id, period, role_title, company_goal, status, created_at, updated_at
    `,
    [
      input.employeeId,
      input.period.trim(),
      input.roleTitle?.trim() || null,
      input.companyGoal?.trim() || null,
      input.companyGoalId ?? null,
      input.departmentGoalId ?? null,
      status,
    ]
  );
  return normalizeKpiCard(asRecordRows(result.rows)[0]);
}

export async function addKpiCardItem(
  input: CreateKpiCardItemInput
): Promise<HRKpiCardItem> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_kpi_card_items (card_id, kpi_text, target_measure, weight)
      VALUES ($1, $2, $3, $4)
      RETURNING id, card_id, kpi_text, target_measure, weight, created_at
    `,
    [
      input.cardId,
      input.kpiText.trim(),
      input.targetMeasure?.trim() || null,
      Number.isFinite(input.weight) ? input.weight : 0,
    ]
  );
  return normalizeKpiCardItem(asRecordRows(result.rows)[0]);
}

export async function updateKpiCardStatus(
  cardId: number,
  status: HRKpiCardStatus
): Promise<HRKpiCard | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_kpi_cards
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, employee_id, period, role_title, company_goal, status, created_at, updated_at
    `,
    [cardId, status]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeKpiCard(asRecordRows(result.rows)[0]);
}

export async function deleteKpiCard(cardId: number): Promise<boolean> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`DELETE FROM hr_kpi_cards WHERE id = $1 RETURNING id`, [cardId]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteKpiCardItem(itemId: number): Promise<boolean> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `DELETE FROM hr_kpi_card_items WHERE id = $1 RETURNING id`,
    [itemId]
  );
  return (result.rowCount ?? 0) > 0;
}
