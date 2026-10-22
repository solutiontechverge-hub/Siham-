/**
 * Fresha-style late-cancellation policy (time window + prepaid offset).
 * Mirrors frontend `settleCancellationFee.ts` — keep in sync.
 */
import { roundMoney } from "./money.js";
import {
  protectiveFeeNetsPrepaid,
  settleProtectiveFee,
} from "./protectiveFeeSettlement.js";

function toNonNegative(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Late cancellation = remaining time until appointment is less than the
 * professional's minimum notice window. Earlier cancels are free.
 */
export function isLateCancellation({
  appointmentStartMs,
  noticeHours,
  noticeMinutes,
  nowMs,
} = {}) {
  const noticeMs =
    (toNonNegative(noticeHours) * 60 + toNonNegative(noticeMinutes)) * 60 * 1000;
  if (noticeMs <= 0) return true;
  const start = Number(appointmentStartMs);
  if (!Number.isFinite(start)) return true;
  const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  return start - now < noticeMs;
}

export function hoursUntilAppointment(appointmentStartMs, nowMs = Date.now()) {
  const start = Number(appointmentStartMs);
  const now = Number(nowMs);
  if (!Number.isFinite(start) || !Number.isFinite(now)) return null;
  return roundMoney((start - now) / (60 * 60 * 1000));
}

/**
 * @returns {{
 *   isLateCancellation: boolean,
 *   hoursUntilAppointment: number|null,
 *   bookingTotal: number,
 *   feePercent: number,
 *   flatFeeAmount: number,
 *   cancellationFee: number,
 *   rescheduleFee: number,
 *   feeTotal: number,
 *   prepaidPaid: number,
 *   appliedFromPrepaid: number,
 *   amountDueNow: number,
 *   refundAmount: number,
 *   paymentStatus: 'REFUNDED'|'PARTIALLY_REFUNDED'|'PENDING_FEE'|'NO_FEE',
 * }}
 */
export function evaluateCancellationFeePolicy({
  appointmentStartMs,
  noticeHours,
  noticeMinutes,
  nowMs,
  bookingTotal,
  feePercent,
  flatFeeAmount,
  prepaidPaid,
  outstandingRescheduleFee,
} = {}) {
  const late = isLateCancellation({
    appointmentStartMs,
    noticeHours,
    noticeMinutes,
    nowMs,
  });
  const total = Math.max(0, Number(bookingTotal) || 0);
  const percent = late ? Math.max(0, Math.min(100, Number(feePercent) || 0)) : 0;
  const flat = late ? toNonNegative(flatFeeAmount) : 0;
  const fromPercent = roundMoney((total * percent) / 100);
  // Prefer explicit flat when provided; otherwise percentage of booking total.
  const cancellationFee =
    flat > 0 ? roundMoney(flat) : fromPercent;
  const rescheduleFee = roundMoney(toNonNegative(outstandingRescheduleFee));
  const prepaid = roundMoney(Math.max(0, Number(prepaidPaid) || 0));

  const settled = settleProtectiveFee({
    feeTotal: cancellationFee + rescheduleFee,
    prepaidAvailable: prepaid,
    netsPrepaid: protectiveFeeNetsPrepaid("lateCancellation", null),
  });

  const refundAmount = roundMoney(Math.max(0, prepaid - settled.prepaidApplied));

  return {
    isLateCancellation: late,
    hoursUntilAppointment: hoursUntilAppointment(appointmentStartMs, nowMs),
    bookingTotal: roundMoney(total),
    feePercent: percent,
    flatFeeAmount: flat,
    cancellationFee,
    rescheduleFee,
    feeTotal: settled.feeTotal,
    prepaidPaid: prepaid,
    appliedFromPrepaid: settled.prepaidApplied,
    amountDueNow: settled.amountDue,
    refundAmount,
    paymentStatus: deriveCancellationPaymentStatus({
      late,
      cancellationFee: settled.feeTotal,
      prepaidPaid: prepaid,
      refundAmount,
      amountDueNow: settled.amountDue,
    }),
  };
}

/**
 * Net outcome after fee vs prepaid:
 * - free cancel + prepaid → REFUNDED (full prepay returned)
 * - prepaid > fee → PARTIALLY_REFUNDED (fee retained, remainder refunded)
 * - prepaid covers fee exactly → REFUNDED (no cash back; fee settled from prepay)
 * - prepaid < fee → PENDING_FEE (outstanding due)
 */
export function deriveCancellationPaymentStatus({
  late,
  cancellationFee,
  prepaidPaid,
  refundAmount,
  amountDueNow,
} = {}) {
  const fee = roundMoney(Math.max(0, Number(cancellationFee) || 0));
  const prepaid = roundMoney(Math.max(0, Number(prepaidPaid) || 0));
  const refund = roundMoney(Math.max(0, Number(refundAmount) || 0));
  const due = roundMoney(Math.max(0, Number(amountDueNow) || 0));

  if (!late || fee <= 0) {
    if (prepaid <= 0) return "NO_FEE";
    return "REFUNDED";
  }
  if (due > 0) return "PENDING_FEE";
  if (refund > 0 && fee > 0) return "PARTIALLY_REFUNDED";
  if (refund > 0) return "REFUNDED";
  if (prepaid > 0 && fee > 0) return "REFUNDED";
  return "PENDING_FEE";
}
