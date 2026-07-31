import {
  calculateManualEntryDiscountAmount,
  type ManualEntryDiscount,
} from "../../sections/finance/manualEntry.data";

export type BookingPriceInput = {
  lineSubtotal: number;
  discount?: ManualEntryDiscount | null;
  /** Extra add-ons already resolved to money (e.g. kilometer allowance). */
  extrasAmount?: number;
  showLateCancellation?: boolean;
  lateCancellationFeePercent?: number | string;
  showLateRescheduling?: boolean;
  lateRescheduleFeePercent?: number | string;
  showPrepayment?: boolean;
  prepaymentPercent?: number | string;
  /** When true, prepaid amount is deducted from the payable total. */
  prepaymentPaid?: boolean;
};

export type BookingPriceBreakdown = {
  lineSubtotal: number;
  extrasAmount: number;
  discountAmount: number;
  afterDiscount: number;
  lateCancellationFeeAmount: number;
  lateRescheduleFeeAmount: number;
  feesTotal: number;
  /** Booking value after discount + fees (persisted as total_price). */
  bookingTotal: number;
  prepaymentAmount: number;
  /** Amount deducted from payable because prepayment is paid / applied. */
  prepaidApplied: number;
  /** Amount still owed — shown as Total Price in the drawer. */
  payableTotal: number;
  remainingAfterPrepayment: number;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parsePercent(value: number | string | undefined): number {
  const pct = Number(value);
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return pct;
}

function percentOf(base: number, percent: number | string | undefined): number {
  const pct = parsePercent(percent);
  if (pct <= 0 || base <= 0) return 0;
  return roundMoney((base * pct) / 100);
}

/**
 * Single source of truth for New Booking / drawer pricing:
 * line items → discount → late/cancel fees → optional prepaid deduction.
 */
export function computeBookingPrice(
  input: BookingPriceInput,
): BookingPriceBreakdown {
  const lineSubtotal = Math.max(0, Number(input.lineSubtotal) || 0);
  const extrasAmount = Math.max(0, Number(input.extrasAmount) || 0);
  const baseBeforeDiscount = roundMoney(lineSubtotal + extrasAmount);

  const discountAmount = roundMoney(
    calculateManualEntryDiscountAmount(
      baseBeforeDiscount,
      input.discount ?? null,
    ),
  );
  const afterDiscount = roundMoney(
    Math.max(0, baseBeforeDiscount - discountAmount),
  );

  const lateCancellationFeeAmount = input.showLateCancellation
    ? percentOf(afterDiscount, input.lateCancellationFeePercent)
    : 0;
  const lateRescheduleFeeAmount = input.showLateRescheduling
    ? percentOf(afterDiscount, input.lateRescheduleFeePercent)
    : 0;
  const feesTotal = roundMoney(
    lateCancellationFeeAmount + lateRescheduleFeeAmount,
  );

  const bookingTotal = roundMoney(afterDiscount + feesTotal);

  const prepaymentAmount = input.showPrepayment
    ? percentOf(afterDiscount, input.prepaymentPercent)
    : 0;
  const prepaidApplied =
    input.prepaymentPaid && prepaymentAmount > 0 ? prepaymentAmount : 0;

  const payableTotal = roundMoney(Math.max(0, bookingTotal - prepaidApplied));
  const remainingAfterPrepayment = roundMoney(
    Math.max(0, bookingTotal - prepaymentAmount),
  );

  return {
    lineSubtotal: roundMoney(lineSubtotal),
    extrasAmount,
    discountAmount,
    afterDiscount,
    lateCancellationFeeAmount,
    lateRescheduleFeeAmount,
    feesTotal,
    bookingTotal,
    prepaymentAmount,
    prepaidApplied,
    payableTotal,
    remainingAfterPrepayment,
  };
}

export function isBookingPrepaymentPaid(status?: string | null): boolean {
  const value = String(status ?? "").toLowerCase();
  return value === "paid" || value === "confirmed";
}
