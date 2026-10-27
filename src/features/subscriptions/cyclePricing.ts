// Billing cycles and their pay-ahead discount, as the API prices them. Used
// for previews while an admin edits a plan; the API decides what is charged.
export const CYCLES = [
  { code: 'MONTHLY', label: 'Monthly', months: 1, discount: 0 },
  { code: 'QUARTERLY', label: 'Quarterly', months: 3, discount: 5 },
  { code: 'SIX_MONTH', label: 'Half-yearly', months: 6, discount: 10 },
  { code: 'YEARLY', label: 'Yearly', months: 12, discount: 15 },
] as const;

/** monthly × months, less the discount, to the paisa (same as the API). */
export function cyclePrice(monthly: number, months: number, discount: number) {
  return Math.round((Math.round(monthly * 100) * months * (100 - discount)) / 100) / 100;
}

/** What admins call the plans (API codes stay BASIC / GROWTH / ENTERPRISE). */
export const PLAN_LABEL: Record<string, string> = {
  TRIAL: 'Trial',
  BASIC: 'Silver',
  GROWTH: 'Gold',
  ENTERPRISE: 'Platinum',
};

export const CYCLE_LABEL: Record<string, string> = Object.fromEntries(CYCLES.map((c) => [c.code, c.label]));
