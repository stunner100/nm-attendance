import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRReward } from "@/lib/types";
import { HR_REWARD_TIERS } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  normalizeReward,
} from "@/lib/hr/shared";
import type { CreateRewardInput } from "@/lib/hr/types";

export type HRRewardWithEmployee = HRReward & { employee_name: string };

export async function listRewards(options: {
  tier?: string;
  employeeId?: number;
  limit?: number;
} = {}): Promise<HRRewardWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.tier?.trim()) {
    values.push(options.tier.trim());
    conditions.push(`r.tier = $${values.length}`);
  }
  if (Number.isFinite(options.employeeId) && Number(options.employeeId) > 0) {
    values.push(options.employeeId);
    conditions.push(`r.employee_id = $${values.length}`);
  }

  let query = `
    SELECT
      r.id, r.employee_id, r.tier, r.reward_type, r.description, r.awarded_on, r.created_at,
      e.full_name AS employee_name
    FROM hr_rewards r
    INNER JOIN hr_employees e ON e.id = r.employee_id
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY r.awarded_on DESC, r.id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizeReward(row),
    employee_name: asString(row.employee_name),
  }));
}

export async function createReward(input: CreateRewardInput): Promise<HRReward> {
  await ensureDbSchema();
  const pool = getDbPool();
  const tier = ensureEnumValue(input.tier, HR_REWARD_TIERS, "rewardTier");
  const result = await pool.query(
    `
      INSERT INTO hr_rewards (employee_id, tier, reward_type, description, awarded_on)
      VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
      RETURNING id, employee_id, tier, reward_type, description, awarded_on, created_at
    `,
    [
      input.employeeId,
      tier,
      input.rewardType.trim(),
      input.description?.trim() || null,
      ensureDateOnly(input.awardedOn),
    ]
  );
  return normalizeReward(asRecordRows(result.rows)[0]);
}

export async function deleteReward(rewardId: number): Promise<boolean> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`DELETE FROM hr_rewards WHERE id = $1 RETURNING id`, [rewardId]);
  return (result.rowCount ?? 0) > 0;
}
