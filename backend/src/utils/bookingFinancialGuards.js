/**
 * Production guardrails for ledger writes (Fresha-style money integrity).
 * Pure functions — callers clamp before INSERT and stamp audit metadata.
 */
import { parseMoney, roundMoney } from "./money.js";

/** Max cash that can still be refunded without going over total paid. */
export function maxRefundableAmount(financials = {}) {
  const paid = roundMoney(
    Math.max(0, parseMoney(financials.total_paid ?? financials.totalPaid)),
  );
  const refunded = roundMoney(
    Math.max(0, parseMoney(financials.total_refunded ?? financials.totalRefunded)),
  );
  return roundMoney(Math.max(0, paid - refunded));
}

/**
 * Max payment/prepayment that can be applied without driving outstanding below 0.
 * Store-credit overpay is opt-in via allowStoreCredit.
 */
export function maxPayableAmount(financials = {}, { allowStoreCredit = false } = {}) {
  if (allowStoreCredit) return Number.POSITIVE_INFINITY;
  const outstanding = roundMoney(
    parseMoney(
      financials.outstanding_balance ?? financials.outstandingBalance ?? 0,
    ),
  );
  return roundMoney(Math.max(0, outstanding));
}

/**
 * Floor outstanding at 0 unless store credit is explicitly allowed.
 */
export function guardOutstandingBalance(outstanding, { allowStoreCredit = false } = {}) {
  const value = roundMoney(parseMoney(outstanding));
  if (allowStoreCredit) return value;
  return roundMoney(Math.max(0, value));
}

export function clampRefundAmount(requested, financials) {
  const want = roundMoney(Math.max(0, parseMoney(requested)));
  const cap = maxRefundableAmount(financials);
  const amount = roundMoney(Math.min(want, cap));
  return {
    amount,
    capped: amount < want - 0.001,
    maxRefundable: cap,
    requested: want,
  };
}

export function clampPaymentAmount(requested, financials, opts = {}) {
  const want = roundMoney(Math.max(0, parseMoney(requested)));
  const allowStoreCredit = Boolean(opts.allowStoreCredit || opts.storeCredit);
  const cap = maxPayableAmount(financials, { allowStoreCredit });
  if (!Number.isFinite(cap)) {
    return { amount: want, capped: false, maxPayable: null, requested: want, storeCredit: true };
  }
  const amount = roundMoney(Math.min(want, cap));
  return {
    amount,
    capped: amount < want - 0.001,
    maxPayable: cap,
    requested: want,
    storeCredit: false,
  };
}

/**
 * Stamp audit fields onto ledger metadata (immutable after insert).
 * @param {object} [metadata]
 * @param {{ performedByUserId?: string|null, actor?: string|null, idempotencyKey?: string|null }} [audit]
 */
export function withFinancialAuditMetadata(metadata = {}, audit = {}) {
  const next = { ...(metadata && typeof metadata === "object" ? metadata : {}) };
  const userId =
    audit.performedByUserId ??
    audit.userId ??
    next.performed_by_user_id ??
    null;
  if (userId) next.performed_by_user_id = String(userId);
  if (audit.actor && !next.actor) next.actor = String(audit.actor);
  if (audit.idempotencyKey) next.idempotency_key = String(audit.idempotencyKey);
  if (!next.performed_at) next.performed_at = new Date().toISOString();
  return next;
}
