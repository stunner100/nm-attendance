import { revalidatePath } from "next/cache";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { RewardAccordion } from "@/components/hr/reward-accordion";
import { RewardStack } from "@/components/hr/reward-stack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { redirectWithFormError, readFormError } from "@/lib/hr/form-actions";
import {
  createReward,
  listHREmployeeOptions,
  listRewards,
  REWARD_TIERS,
} from "@/lib/hr-db";
import { HR_REWARD_TIERS } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

type PageProps = {
  searchParams: Promise<{ tier?: string; error?: string }>;
};

async function createRewardAction(formData: FormData): Promise<void> {
  "use server";
  await requireAdminPage("/admin/rewards");

  const employeeId = Number(formData.get("employeeId") ?? "");
  const tier = String(formData.get("tier") ?? "").trim();
  const rewardType = String(formData.get("rewardType") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const awardedOn = String(formData.get("awardedOn") ?? "").trim();

  if (!Number.isFinite(employeeId) || !rewardType) {
    redirectWithFormError("/admin/rewards", "Employee and reward type are required.");
  }
  if (!HR_REWARD_TIERS.includes(tier as (typeof HR_REWARD_TIERS)[number])) {
    redirectWithFormError("/admin/rewards", "Select a valid reward tier.");
  }

  await createReward({
    employeeId,
    tier: tier as (typeof HR_REWARD_TIERS)[number],
    rewardType,
    description: description || null,
    awardedOn: awardedOn || null,
  });

  revalidatePath("/admin/rewards");
  revalidatePath("/admin");
}

export default async function RewardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tierFilter = params.tier?.trim() || "";

  const [rewards, employees] = await Promise.all([
    listRewards({ tier: tierFilter }),
    listHREmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        description="Weekly, monthly, quarterly, and long-term rewards. Employees scoring 80+ are bonus eligible; 90+ qualify for higher recognition."
      />

      <AdminFormAlert message={readFormError(params)} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Tier</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={tierFilter}
                name="tier"
              >
                <option value="">All tiers</option>
                {HR_REWARD_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {humanizeLabel(tier)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit">Apply Filters</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record Reward</CardTitle>
        </CardHeader>
        <CardContent>
          <RewardStack employeeOptions={employees} createRewardAction={createRewardAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rewards ({rewards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <RewardAccordion rewards={rewards} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Structure</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {REWARD_TIERS.map((tier) => (
            <div key={tier.tier} className="rounded-lg border p-3">
              <p className="text-sm font-medium text-foreground">{tier.label}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {tier.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--color-ink-muted)]">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
