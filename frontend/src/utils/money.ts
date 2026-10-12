/** Convert numeric values and legacy formatted currency strings to a number. */
export function parseMoney(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function roundMoney(value: unknown): number {
  return Math.round((parseMoney(value) + Number.EPSILON) * 100) / 100;
}
