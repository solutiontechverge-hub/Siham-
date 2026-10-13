/** Shared invoice payment-term / reminder settings helpers. */

import { roundMoney } from "../utils/money.js";

export const DEFAULT_INVOICE_SETTINGS = {
  logoDataUrl: null,
  defaultInvoiceType: "individual",
  products: [],
  uniqueItems: [],
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

const numericCatalogItem = (item) => {
  if (!item || typeof item !== "object") return item;
  const next = { ...item };
  for (const key of ["price", "unitPrice", "originalPrice", "discountAmount"]) {
    if (next[key] == null || next[key] === "") continue;
    next[key] = roundMoney(next[key]);
  }
  return next;
};

/** Keep first occurrence of each catalog id; drop entries without an id. */
export const uniqueById = (items) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const id = item?.id == null ? "" : String(item.id).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
};

const numericCatalog = (items, fallback) =>
  Array.isArray(items)
    ? uniqueById(items).map(numericCatalogItem)
    : fallback;

/** Penalty value keys that must stay non-empty once payment terms are configured. */
export const PENALTY_VALUE_KEYS = [
  "originalPenaltyValue",
  "firstReissuePenaltyValue",
  "secondReissuePenaltyValue",
];

export const PENALTY_UNIT_KEYS = [
  "originalPenaltyUnit",
  "firstReissuePenaltyUnit",
  "secondReissuePenaltyUnit",
];

/** True when value is a non-blank finite number (0 allowed; blank/NaN not). */
export const isConfiguredPenaltyValue = (value) => {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return false;
  return Number.isFinite(Number(raw));
};

/** Normalize unit to `%` or `fixed` (percentage aliases → `%`). */
export const normalizePenaltyUnit = (unit) => {
  const u = String(unit ?? "")
    .trim()
    .toLowerCase();
  if (!u) return null;
  if (u.includes("%") || u.includes("percent")) return "%";
  if (u.includes("fixed") || u === "eur" || u === "€" || u === "amount") {
    return "fixed";
  }
  return null;
};

/**
 * Reject blank/non-numeric penalty values or unknown units.
 * Returns an error message, or null when valid.
 */
export const paymentTermPenaltiesInvalid = (paymentTerms) => {
  if (!paymentTerms || typeof paymentTerms !== "object") return null;
  for (const key of PENALTY_VALUE_KEYS) {
    if (!(key in paymentTerms)) continue;
    if (!isConfiguredPenaltyValue(paymentTerms[key])) {
      return "Penalty value is required and cannot be blank.";
    }
  }
  for (const key of PENALTY_UNIT_KEYS) {
    if (!(key in paymentTerms)) continue;
    if (!normalizePenaltyUnit(paymentTerms[key])) {
      return "Penalty type must be Percentage (%) or Fixed amount.";
    }
  }
  return null;
};

const healPaymentTermsPenalties = (terms) => {
  const next = { ...terms };
  for (const key of PENALTY_VALUE_KEYS) {
    if (!isConfiguredPenaltyValue(next[key])) {
      next[key] = DEFAULT_INVOICE_SETTINGS.paymentTerms[key];
    }
  }
  for (const key of PENALTY_UNIT_KEYS) {
    next[key] =
      normalizePenaltyUnit(next[key]) ??
      DEFAULT_INVOICE_SETTINGS.paymentTerms[key];
  }
  return next;
};

export const mergeInvoiceSettings = (raw) => {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_INVOICE_SETTINGS };
  return {
    ...DEFAULT_INVOICE_SETTINGS,
    ...raw,
    paymentTerms: healPaymentTermsPenalties({
      ...DEFAULT_INVOICE_SETTINGS.paymentTerms,
      ...(raw.paymentTerms ?? {}),
    }),
    reminders: {
      ...DEFAULT_INVOICE_SETTINGS.reminders,
      ...(raw.reminders ?? {}),
    },
    products: numericCatalog(raw.products, DEFAULT_INVOICE_SETTINGS.products),
    uniqueItems: numericCatalog(raw.uniqueItems, DEFAULT_INVOICE_SETTINGS.uniqueItems),
    services: numericCatalog(raw.services, DEFAULT_INVOICE_SETTINGS.services),
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
 * Issued invoices keep paymentTerms from issuedSnapshot; live settings only
 * fill gaps for legacy rows that never snapshotted.
 */
export const resolveDocumentPaymentTerms = (document, livePaymentTerms) =>
  document?.issuedSnapshot?.invoiceSettings?.paymentTerms ?? livePaymentTerms;

/**
 * Issued invoices keep reminders from issuedSnapshot; live settings only for
 * legacy rows that never snapshotted reminders.
 */
export const resolveDocumentReminders = (document, liveReminders) =>
  document?.issuedSnapshot?.invoiceSettings?.reminders ?? liveReminders;

/**
 * Frozen due date for scheduling: prefer payment_deadline column, else
 * document.dueDate. Never recompute from live payment terms.
 */
export const resolveStoredDueDate = (paymentDeadline, documentDueDate) => {
  for (const candidate of [paymentDeadline, documentDueDate]) {
    if (candidate == null || candidate === "") continue;
    const iso = toIsoDateOnly(candidate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  }
  return null;
};

/**
 * Absolute reminder fire date = storedDueDate − lead duration.
 * Trigger is fixed once due date is stored; it does not drift with "today"
 * or live payment-term edits.
 */
export const reminderTriggerDate = (storedDueDate, value, unit) => {
  const due = resolveStoredDueDate(storedDueDate);
  const days = durationToDays(value, unit);
  if (!due || days == null || days < 0) return null;
  return addDaysIso(due, -days);
};

/** True when today matches the fixed trigger date for a reminder slot. */
export const isReminderTriggerDay = (
  storedDueDate,
  value,
  unit,
  today = new Date(),
) => {
  const trigger = reminderTriggerDate(storedDueDate, value, unit);
  if (!trigger) return false;
  return trigger === toIsoDateOnly(today);
};

/**
 * Next overdue action from reissueLevel + paymentTerms triggers.
 * level>=2 → close (final reissue already sent); else Automatic|Manual for next stage.
 */
export const resolveOverdueReissueAction = (reissueLevel, paymentTerms) => {
  const level = Number(reissueLevel) || 0;
  if (level >= 2) return "close";
  const prefix = level >= 1 ? "second" : "first";
  const trigger = paymentTerms?.[`${prefix}ReissueTrigger`];
  return isAutomaticTrigger(trigger) ? "automatic" : "manual";
};

/**
 * Compute penalty amount from settings value/unit against a base amount.
 * `%` → percent of base; otherwise treated as fixed EUR.
 * Blank/null/NaN values → 0 (never NaN fees).
 */
export const computePenaltyAmount = (baseAmount, penaltyValue, penaltyUnit) => {
  const base = roundMoney(baseAmount);
  if (!isConfiguredPenaltyValue(penaltyValue)) return 0;
  const value = Number(String(penaltyValue).trim().replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return 0;
  const unit = normalizePenaltyUnit(penaltyUnit);
  if (unit === "%") return roundMoney(base * (value / 100));
  return roundMoney(value);
};
