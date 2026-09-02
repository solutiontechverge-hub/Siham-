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
  noShowFeeAmount?: number;
  prepaidApplied?: number;
  showPrepayment?: boolean;
  prepaymentPaid?: boolean;
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
  noShowFeeAmount = 0,
  showPrepayment = false,
  prepaymentPaid = false,
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
      noShowFeeAmount={noShowFeeAmount}
      prepaidPercent={showPrepayment ? prepaymentPercent : 0}
      prepaidAmount={showPrepayment ? prepaymentAmount : 0}
      remainingAmount={showPrepayment ? remainingAmount : undefined}
      prepaymentPaid={prepaymentPaid}
    />
  );
}
