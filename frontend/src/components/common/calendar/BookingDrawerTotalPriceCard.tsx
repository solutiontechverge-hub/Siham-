"use client";

import BookingPriceBreakdown from "../booking-finance/BookingPriceBreakdown";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";

type BookingDrawerTotalPriceCardProps = {
  payableTotal: number;
  actualAmount: number;
  lineDiscountAmount?: number;
  bookingDiscountAmount?: number;
  bookingTotalDiscount?: ManualEntryDiscount | null;
  lateCancellationFeeAmount?: number;
  lateRescheduleFeeAmount?: number;
  prepaidApplied?: number;
  showPrepayment?: boolean;
  prepaymentPercent?: number;
  prepaymentAmount?: number;
  remainingAmount?: number;
};

export default function BookingDrawerTotalPriceCard({
  payableTotal,
  actualAmount,
  lineDiscountAmount = 0,
  bookingDiscountAmount = 0,
  bookingTotalDiscount = null,
  lateCancellationFeeAmount = 0,
  lateRescheduleFeeAmount = 0,
  showPrepayment = false,
  prepaymentPercent = 0,
  prepaymentAmount = 0,
  remainingAmount,
}: BookingDrawerTotalPriceCardProps) {
  return (
    <BookingPriceBreakdown
      totalPrice={payableTotal}
      originalPrice={actualAmount}
      lineDiscountAmount={lineDiscountAmount}
      bookingDiscountAmount={bookingDiscountAmount}
      bookingTotalDiscount={bookingTotalDiscount}
      lateCancellationFeeAmount={lateCancellationFeeAmount}
      lateRescheduleFeeAmount={lateRescheduleFeeAmount}
      prepaidPercent={showPrepayment ? prepaymentPercent : 0}
      prepaidAmount={showPrepayment ? prepaymentAmount : 0}
      remainingAmount={showPrepayment ? remainingAmount : undefined}
    />
  );
}
