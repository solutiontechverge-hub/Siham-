import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";

export type ProtectiveFeePolicyKind = "lateCancellation" | "lateReschedule" | "noShow";

export type CancellationFeeSettlement = {
  bookingTotal: number;
  feePercent: number;
  cancellationFee: number;
  /** Outstanding Rule-B late reschedule fine settled together with the cancel. */
  rescheduleFee: number;
  /** cancellationFee + rescheduleFee. */
  feeTotal: number;
  prepaidPaid: number;
  appliedFromPrepaid: number;
  amountDueNow: number;
  refundAmount: number;
  /** True when cancel is inside the professional's minimum notice window. */
  isLateCancellation: boolean;
};

function toNonNegativeNumber(value: number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Rule A/B decision clock: was the appointment start already reached when the
 * client/pro took the cancel / reschedule / no-show action? Unknown → future (B).
 * Mirrored in backend `finance-sync.service.js`.
 */
export function isAppointmentPassedAt(
  actionAtMs: number | null | undefined,
  startMs: number | null | undefined,
): boolean {
  const action = Number(actionAtMs);
  const start = Number(startMs);
  if (actionAtMs == null || startMs == null) return false;
  if (!Number.isFinite(action) || !Number.isFinite(start)) return false;
  return action >= start;
}

/**
 * Rule A (passed): every fee is deducted from prepaid.
 * Rule B (future): late cancel still nets (booking ends, prepaid minus fee is refunded);
 * late reschedule does NOT — the fine is added to the booking's final total.
 * No-show is inherently after start → always nets.
 */
export function protectiveFeeNetsPrepaid(
  kind: ProtectiveFeePolicyKind,
  appointmentPassed: boolean | null | undefined,
): boolean {
  return kind !== "lateReschedule" || appointmentPassed === true;
}

/** Fee Total → Prepaid applied → Payment remainder (€0 when prepaid covers). */
export function settleProtectiveFee(input: {
  feeTotal: number;
  prepaidAvailable: number;
  netsPrepaid?: boolean;
}): { feeTotal: number; prepaidApplied: number; amountDue: number } {
  const feeTotal = roundMoney(toNonNegativeNumber(input.feeTotal));
  const prepaid = roundMoney(toNonNegativeNumber(input.prepaidAvailable));
  const prepaidApplied =
    input.netsPrepaid === false ? 0 : roundMoney(Math.min(prepaid, feeTotal));
  return {
    feeTotal,
    prepaidApplied,
    amountDue: roundMoney(Math.max(0, feeTotal - prepaidApplied)),
  };
}

/**
 * Late cancellation = remaining time until the appointment is less than the
 * professional's "Minimum Time Before Appointment". Earlier cancels are free.
 */
export function isLateCancellation(input: {
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  nowMs?: number;
}): boolean {
  const noticeMs =
    (toNonNegativeNumber(input.noticeHours) * 60 +
      toNonNegativeNumber(input.noticeMinutes)) *
    60 *
    1000;
  if (noticeMs <= 0) return true;
  const start = Number(input.appointmentStartMs);
  if (!Number.isFinite(start)) return true;
  const now = Number.isFinite(Number(input.nowMs))
    ? Number(input.nowMs)
    : Date.now();
  return start - now < noticeMs;
}

/** Split cancellation fee (+ outstanding LRF) against prepaid balance; refund the rest. */
export function settleCancellationFee(input: {
  bookingTotal: number;
  feePercent: number;
  prepaidPaid: number;
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  nowMs?: number;
  /** Rule-B late reschedule fine not yet invoiced — booking ends, so settle it now. */
  outstandingRescheduleFee?: number;
}): CancellationFeeSettlement {
  const late = isLateCancellation({
    appointmentStartMs: input.appointmentStartMs,
    noticeHours: input.noticeHours,
    noticeMinutes: input.noticeMinutes,
    nowMs: input.nowMs,
  });
  const bookingTotal = Math.max(0, Number(input.bookingTotal) || 0);
  const feePercent = late ? Math.max(0, Number(input.feePercent) || 0) : 0;
  const prepaidPaid = roundMoney(Math.max(0, Number(input.prepaidPaid) || 0));
  const cancellationFee = roundMoney((bookingTotal * feePercent) / 100);
  const rescheduleFee = roundMoney(toNonNegativeNumber(input.outstandingRescheduleFee));
  const settled = settleProtectiveFee({
    feeTotal: cancellationFee + rescheduleFee,
    prepaidAvailable: prepaidPaid,
    netsPrepaid: protectiveFeeNetsPrepaid("lateCancellation", null),
  });

  return {
    bookingTotal,
    feePercent,
    cancellationFee,
    rescheduleFee,
    feeTotal: settled.feeTotal,
    prepaidPaid,
    appliedFromPrepaid: settled.prepaidApplied,
    amountDueNow: settled.amountDue,
    refundAmount: roundMoney(Math.max(0, prepaidPaid - settled.prepaidApplied)),
    isLateCancellation: late,
  };
}
