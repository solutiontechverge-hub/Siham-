export type CancellationFeeSettlement = {
  bookingTotal: number;
  feePercent: number;
  cancellationFee: number;
  prepaidPaid: number;
  appliedFromPrepaid: number;
  amountDueNow: number;
  refundAmount: number;
  /** True when cancel is inside the professional's minimum notice window. */
  isLateCancellation: boolean;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNonNegativeNumber(value: number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
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

/** Split cancellation fee against prepaid balance (adjust fee, refund remainder). */
export function settleCancellationFee(input: {
  bookingTotal: number;
  feePercent: number;
  prepaidPaid: number;
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  nowMs?: number;
}): CancellationFeeSettlement {
  const late = isLateCancellation({
    appointmentStartMs: input.appointmentStartMs,
    noticeHours: input.noticeHours,
    noticeMinutes: input.noticeMinutes,
    nowMs: input.nowMs,
  });
  const bookingTotal = Math.max(0, Number(input.bookingTotal) || 0);
  const feePercent = late ? Math.max(0, Number(input.feePercent) || 0) : 0;
  const prepaidPaid = Math.max(0, Number(input.prepaidPaid) || 0);
  const cancellationFee = roundMoney((bookingTotal * feePercent) / 100);
  const appliedFromPrepaid = roundMoney(Math.min(prepaidPaid, cancellationFee));
  const amountDueNow = roundMoney(Math.max(0, cancellationFee - appliedFromPrepaid));
  const refundAmount = roundMoney(Math.max(0, prepaidPaid - cancellationFee));

  return {
    bookingTotal,
    feePercent,
    cancellationFee,
    prepaidPaid,
    appliedFromPrepaid,
    amountDueNow,
    refundAmount,
    isLateCancellation: late,
  };
}
