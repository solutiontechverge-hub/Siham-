/** Shared invoice payment-term / reminder settings helpers. */

export const DEFAULT_INVOICE_SETTINGS = {
  logoDataUrl: null,
  defaultInvoiceType: "individual",
  products: [],
  services: [],
  paymentTerms: {
    originalDueValue: "2",
    originalDueUnit: "Weeks",
    originalPenaltyValue: "10",
    originalPenaltyUnit: "%",
    firstReissueTrigger: "Automatic",
    firstReissueDueValue: "2",
    firstReissueDueUnit: "Weeks",
    firstReissuePenaltyValue: "20",
    firstReissuePenaltyUnit: "%",
    secondReissueTrigger: "Automatic",
    secondReissueDueValue: "2",
    secondReissueDueUnit: "Weeks",
    secondReissuePenaltyValue: "20",
    secondReissuePenaltyUnit: "%",
  },
  reminders: {
    reminder1Value: "1",
    reminder1Unit: "Weeks",
    reminder2Value: "3",
    reminder2Unit: "Days",
  },
};

export const mergeInvoiceSettings = (raw) => {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_INVOICE_SETTINGS };
  return {
    ...DEFAULT_INVOICE_SETTINGS,
    ...raw,
    paymentTerms: {
      ...DEFAULT_INVOICE_SETTINGS.paymentTerms,
      ...(raw.paymentTerms ?? {}),
    },
    reminders: {
      ...DEFAULT_INVOICE_SETTINGS.reminders,
      ...(raw.reminders ?? {}),
    },
    products: Array.isArray(raw.products) ? raw.products : DEFAULT_INVOICE_SETTINGS.products,
    services: Array.isArray(raw.services) ? raw.services : DEFAULT_INVOICE_SETTINGS.services,
  };
};

/**
 * Convert a settings duration (value + unit) into whole days.
 * Supports Days / Weeks / Months (case-insensitive).
 */
export const durationToDays = (value, unit) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  const u = String(unit ?? "")
    .trim()
    .toLowerCase();
  if (u.startsWith("day")) return Math.round(n);
  if (u.startsWith("week")) return Math.round(n * 7);
  if (u.startsWith("month")) return Math.round(n * 30);
  // Unknown unit — treat numeric value as days when unit empty
  if (!u) return Math.round(n);
  return null;
};

export const addDaysIso = (isoDate, days) => {
  const base = new Date(`${String(isoDate).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return String(isoDate).slice(0, 10);
  base.setUTCDate(base.getUTCDate() + Number(days || 0));
  return base.toISOString().slice(0, 10);
};

export const toIsoDateOnly = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    // Prefer local calendar date for Date objects from JS `new Date()`
    const ly = value.getFullYear();
    const lm = String(value.getMonth() + 1).padStart(2, "0");
    const ld = String(value.getDate()).padStart(2, "0");
    return `${ly}-${lm}-${ld}`;
  }
  const wallClock = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return wallClock ? wallClock[1] : String(value).slice(0, 10);
};

/** Calendar-day difference: dueDate - today (positive = due in future). */
export const daysUntilDate = (dueDate, today = new Date()) => {
  const dueIso = toIsoDateOnly(dueDate);
  const todayIso = toIsoDateOnly(today);
  const dueMs = Date.parse(`${dueIso}T00:00:00Z`);
  const todayMs = Date.parse(`${todayIso}T00:00:00Z`);
  if (Number.isNaN(dueMs) || Number.isNaN(todayMs)) return null;
  return Math.round((dueMs - todayMs) / 86_400_000);
};

export const isAutomaticTrigger = (trigger) => {
  const t = String(trigger ?? "")
    .trim()
    .toLowerCase();
  return t === "automatic" || t === "auto";
};

/**
 * Compute penalty amount from settings value/unit against a base amount.
 * `%` → percent of base; otherwise treated as fixed EUR.
 */
export const computePenaltyAmount = (baseAmount, penaltyValue, penaltyUnit) => {
  const base = Number(baseAmount) || 0;
  const value = Number(penaltyValue);
  if (!Number.isFinite(value) || value <= 0) return 0;
  const unit = String(penaltyUnit ?? "")
    .trim()
    .toLowerCase();
  if (unit.includes("%") || unit === "percent" || unit === "percentage") {
    return Math.round(base * (value / 100) * 100) / 100;
  }
  return Math.round(value * 100) / 100;
};
