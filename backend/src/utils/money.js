/** Convert numeric values and legacy formatted currency strings to a number. */
export function parseMoney(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function roundMoney(value) {
  return Math.round((parseMoney(value) + Number.EPSILON) * 100) / 100;
}

export const MONEY_JSON_KEYS = new Set([
  "price",
  "amount",
  "totalPrice",
  "unitPrice",
  "pricePerUnit",
  "discountAmount",
  "refundAmount",
  "prepaymentAmount",
  "paidAmount",
  "penaltyAmount",
  "grossAmount",
  "netAmount",
  "stripeFee",
  "mollureFee",
  "originalPrice",
  "paymentAmount",
  "feeAmount",
  "subtotal",
  "total",
]);

/**
 * Read compatibility for legacy JSON snapshots. New persistence already writes
 * numbers; this converts old formatted money strings before API responses.
 */
export function normalizeMoneyJson(value, parentKey = "") {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMoneyJson(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        normalizeMoneyJson(child, key),
      ]),
    );
  }
  if (typeof value === "string" && MONEY_JSON_KEYS.has(parentKey)) {
    const parsed = parseMoney(value, Number.NaN);
    return Number.isFinite(parsed) ? roundMoney(parsed) : value;
  }
  return value;
}
