/**
 * Server-side booking financial aggregates from an event ledger.
 * Pure functions — no DB. Callers pass ledger rows + base price / tax context.
 *
 * Formulas (Fresha-style):
 *   subtotal            = basePrice + Σ ADD_ON
 *   total_tax           = Σ metadata.tax (valid charge rows) + baseTax
 *   cancellation_fee    = Σ CANCELLATION_FEE
 *   total_paid          = Σ PAYMENT + PREPAYMENT (completed)
 *   total_refunded      = Σ REFUND (completed)
 *   prepayment_total    = Σ PREPAYMENT (completed)
 *   net_prepayment_credit = max(0, prepayment_total − min(prepayment_total, total_refunded))
 *   net_total           = subtotal + cancellation_fee − Σ DISCOUNT
 *   outstanding_balance = net_total − total_paid + total_refunded
 *   net_revenue         = total_paid − total_refunded  (cash retained)
 */
import { parseMoney, roundMoney } from "./money.js";

export const LEDGER_TYPES = Object.freeze([
  "PAYMENT",
  "PREPAYMENT",
  "ADD_ON",
  "CANCELLATION_FEE",
  "REFUND",
  "DISCOUNT",
]);

export const LEDGER_STATUSES = Object.freeze(["pending", "completed", "voided", "failed"]);

/** Rows that count toward money aggregates (not pending / failed / voided). */
export function isValidLedgerRow(row) {
  return String(row?.status ?? "").toLowerCase() === "completed";
}

function sumByType(rows, type) {
  let sum = 0;
  for (const row of rows) {
    if (!isValidLedgerRow(row)) continue;
    if (String(row.type).toUpperCase() !== type) continue;
    sum += parseMoney(row.amount);
  }
  return roundMoney(sum);
}

function sumTax(rows) {
  let sum = 0;
  for (const row of rows) {
    if (!isValidLedgerRow(row)) continue;
    const tax = row.metadata?.tax ?? row.metadata?.taxAmount;
    if (tax == null) continue;
    sum += parseMoney(tax);
  }
  return roundMoney(sum);
}

function rowCreatedAtMs(row) {
  const raw = row?.created_at ?? row?.createdAt ?? 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Accidental multi-save: same ADD_ON amount (or same addonId) within 60s → keep first.
 * Legitimate second checkout of the same product minutes later still counts.
 */
export function selectBurstDedupedAddonRows(rows, windowMs = 60_000) {
  const addOns = (Array.isArray(rows) ? rows : [])
    .filter(
      (row) =>
        isValidLedgerRow(row) && String(row.type).toUpperCase() === "ADD_ON",
    )
    .slice()
    .sort((a, b) => rowCreatedAtMs(a) - rowCreatedAtMs(b));

  const kept = [];
  const drop = [];
  for (const row of addOns) {
    const amt = roundMoney(parseMoney(row.amount));
    const t = rowCreatedAtMs(row);
    const addonId = String(row.metadata?.addonId ?? "").trim();
    const isDup = kept.some((prev) => {
      const prevId = String(prev.metadata?.addonId ?? "").trim();
      if (addonId && prevId && addonId === prevId) return true;
      const prevAmt = roundMoney(parseMoney(prev.amount));
      const prevT = rowCreatedAtMs(prev);
      return prevAmt === amt && Math.abs(prevT - t) < windowMs;
    });
    if (isDup) drop.push(row);
    else kept.push(row);
  }
  return { kept, drop };
}

/**
 * @param {Array<{ type: string, amount: number|string, status?: string, metadata?: object }>} rows
 * @param {{ basePrice?: number|string, baseTax?: number|string }} [opts]
 */
export function computeBookingFinancials(rows, opts = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const basePrice = roundMoney(Math.max(0, parseMoney(opts.basePrice)));
  const baseTax = roundMoney(Math.max(0, parseMoney(opts.baseTax)));

  // Burst-dedupe ADD_ON so multi-save storms do not inflate payable.
  const { kept: dedupedAddOns } = selectBurstDedupedAddonRows(list);
  const addOns = roundMoney(
    dedupedAddOns.reduce((sum, row) => sum + parseMoney(row.amount), 0),
  );
  const cancellationFee = sumByType(list, "CANCELLATION_FEE");
  const discounts = sumByType(list, "DISCOUNT");
  const prepaymentTotal = sumByType(list, "PREPAYMENT");
  const paymentTotal = sumByType(list, "PAYMENT");
  const totalPaid = roundMoney(paymentTotal + prepaymentTotal);
  const totalRefunded = sumByType(list, "REFUND");
  // Refunds eat prepaid first; leftover deposit still credits the booking.
  const prepaidRefunded = roundMoney(Math.min(prepaymentTotal, totalRefunded));
  const netPrepaymentCredit = roundMoney(
    Math.max(0, prepaymentTotal - prepaidRefunded),
  );

  const subtotal = roundMoney(basePrice + addOns);
  const totalTax = roundMoney(sumTax(list) + baseTax);
  const netTotal = roundMoney(Math.max(0, subtotal + cancellationFee - discounts));
  const rawOutstanding = roundMoney(netTotal - totalPaid + totalRefunded);
  // Guardrail: outstanding never reports below 0 unless store-credit overpay is flagged.
  const allowStoreCredit = Boolean(opts.allowStoreCredit);
  const outstandingBalance = allowStoreCredit
    ? rawOutstanding
    : roundMoney(Math.max(0, rawOutstanding));
  const netRevenue = roundMoney(Math.max(0, totalPaid - totalRefunded));

  return {
    subtotal,
    total_tax: totalTax,
    cancellation_fee: cancellationFee,
    total_paid: totalPaid,
    total_refunded: totalRefunded,
    prepayment_total: prepaymentTotal,
    payment_total: paymentTotal,
    prepaid_refunded: prepaidRefunded,
    net_prepayment_credit: netPrepaymentCredit,
    net_total: netTotal,
    outstanding_balance: outstandingBalance,
    net_revenue: netRevenue,
    // camelCase mirrors for JS callers that already use camelCase money fields
    totalTax,
    cancellationFee,
    totalPaid,
    totalRefunded,
    prepaymentTotal,
    paymentTotal,
    prepaidRefunded,
    netPrepaymentCredit,
    netTotal,
    outstandingBalance,
    netRevenue,
    addOns,
    discounts,
    basePrice,
  };
}

/**
 * Payment status derived ONLY from aggregates — never hardcode on write paths.
 * Maps to existing finance_transactions / UI vocabulary where possible.
 *
 * @param {ReturnType<typeof computeBookingFinancials>} financials
 * @param {{ hasPendingPrepayment?: boolean, hasFailedPayment?: boolean }} [flags]
 */
export function derivePaymentStatus(financials, flags = {}) {
  const paid = financials.totalPaid ?? financials.total_paid ?? 0;
  const refunded = financials.totalRefunded ?? financials.total_refunded ?? 0;
  const outstanding = financials.outstandingBalance ?? financials.outstanding_balance ?? 0;
  const net = financials.netTotal ?? financials.net_total ?? 0;

  if (flags.hasFailedPayment) return "Failed";
  // Full refund: outstanding may still be > 0 under net − paid + refunded
  // (charge remains; payment was reversed). Detect by refund covering paid.
  if (refunded > 0 && paid > 0 && refunded >= paid) return "Refunded";
  if (net <= 0 && paid <= 0) return "Paid";
  if (outstanding <= 0 && paid > 0) return "Paid";
  if (paid > 0 && outstanding > 0) {
    return flags.hasPendingPrepayment ? "Prepaid" : "Pending";
  }
  if (flags.hasPendingPrepayment) return "Prepayment due";
  if (outstanding > 0) return "Unpaid";
  return "Pending";
}

/**
 * Booking lifecycle hints from money state. Does not invent calendar states
 * (in_progress / confirmed stay schedule-driven); only financial-derived flags.
 *
 * @returns {{ payment_status: string, prepayment_status: string|null, suggested_booking_status: string|null }}
 */
export function deriveStatusesFromFinancials(financials, flags = {}) {
  const paymentStatus = derivePaymentStatus(financials, flags);
  const paid = financials.totalPaid ?? financials.total_paid ?? 0;
  const refunded = financials.totalRefunded ?? financials.total_refunded ?? 0;
  const outstanding = financials.outstandingBalance ?? financials.outstanding_balance ?? 0;
  const prepayOnly =
    paid > 0 &&
    outstanding > 0 &&
    (flags.prepaymentAmount == null || paid <= parseMoney(flags.prepaymentAmount) + 0.001);

  let prepaymentStatus = null;
  if (flags.hasFailedPayment) prepaymentStatus = "failed";
  else if (flags.hasPendingPrepayment && paid <= 0) prepaymentStatus = "pending";
  else if (prepayOnly || (paid > 0 && outstanding > 0)) prepaymentStatus = "paid";
  else if (paymentStatus === "Paid" || paymentStatus === "Prepaid") prepaymentStatus = "paid";

  let suggestedBookingStatus = null;
  if (paymentStatus === "Refunded") suggestedBookingStatus = "cancelled";
  else if (outstanding <= 0 && paid > 0 && paymentStatus === "Paid") {
    suggestedBookingStatus = flags.appointmentCompleted ? "completed" : null;
  }

  return {
    payment_status: paymentStatus,
    prepayment_status: prepaymentStatus,
    suggested_booking_status: suggestedBookingStatus,
  };
}
