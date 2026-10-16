/** Convert numeric values and legacy formatted currency strings to a number. */
export function parseMoney(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;

  let cleaned = String(value).replace(/[^0-9,.-]/g, "");
  if (!cleaned || cleaned === "-") return fallback;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  if (hasComma && hasDot) {
    // Last separator is the decimal; the other is thousands.
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    cleaned = /,\d{1,2}$/.test(cleaned)
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "");
  }

  const parsed = Number(cleaned);
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

/** Counts/qty that must stay JSON numbers (never digit strings). */
export const COUNT_JSON_KEYS = new Set([
  "quantity",
  "count",
  "bookings",
  "vatRate",
]);

/**
 * Read compatibility for legacy JSON snapshots. New persistence already writes
 * numbers; this converts old formatted money / quantity strings before API
 * responses. Also used at write boundaries so string digits never land in JSONB.
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
  if (typeof value === "string" && COUNT_JSON_KEYS.has(parentKey)) {
    const parsed = parseMoney(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}
