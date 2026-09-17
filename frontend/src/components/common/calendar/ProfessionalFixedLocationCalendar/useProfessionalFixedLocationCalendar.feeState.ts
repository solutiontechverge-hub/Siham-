import * as React from "react";
import type { ManualEntryDiscount } from "../../../sections/finance/manualEntry.data";
import {
  buildBookingPriceSummaryLines,
  computeBookingPrice,
} from "../bookingTotal";

export type UseProfessionalFixedLocationCalendarFeeStateArgs = {
  subtotalPrice: number;
  kilometerAllowanceAmount: number;
  servicesTotal: number;
  guestsTotal: number;
  productsTotal: number;
  uniqueItemsTotal: number;
};

/** Owns drawer fee/discount/payment state + price fan-out (ponytail: setters bag for apply spreads). */
export function useProfessionalFixedLocationCalendarFeeState({
  subtotalPrice,
  kilometerAllowanceAmount,
  servicesTotal,
  guestsTotal,
  productsTotal,
  uniqueItemsTotal,
}: UseProfessionalFixedLocationCalendarFeeStateArgs) {
  const [showPrepayment, setShowPrepayment] = React.useState(false);
  const [prepaymentPercent, setPrepaymentPercent] = React.useState("");
  const [bookingTotalDiscount, setBookingTotalDiscount] =
    React.useState<ManualEntryDiscount | null>(null);
  const [bookingDiscountModalOpen, setBookingDiscountModalOpen] =
    React.useState(false);
  const [showLateCancellation, setShowLateCancellation] = React.useState(false);
  const [lateCancellationFeePercent, setLateCancellationFeePercent] =
    React.useState("");
  const [lateCancellationFeePercentCeiling, setLateCancellationFeePercentCeiling] =
    React.useState("");
  const [showLateRescheduling, setShowLateRescheduling] = React.useState(false);
  const [lateRescheduleFeePercent, setLateRescheduleFeePercent] =
    React.useState("");
  const [lateRescheduleFeePercentCeiling, setLateRescheduleFeePercentCeiling] =
    React.useState("");
  const [showNoShowFee, setShowNoShowFee] = React.useState(false);
  const [noShowFeePercent, setNoShowFeePercent] = React.useState("");
  const [noShowFeePercentCeiling, setNoShowFeePercentCeiling] =
    React.useState("");
  const [cancellationFeeAt, setCancellationFeeAt] = React.useState<
    string | undefined
  >(undefined);
  const [exceededCancellationWindow, setExceededCancellationWindow] =
    React.useState<boolean | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = React.useState<
    "online" | "offline"
  >("online");

  const bookingPrice = React.useMemo(
    () =>
      computeBookingPrice({
        lineSubtotal: subtotalPrice,
        extrasAmount: kilometerAllowanceAmount,
        discount: bookingTotalDiscount,
        showLateCancellation,
        lateCancellationFeePercent,
        showLateRescheduling,
        lateRescheduleFeePercent,
        showNoShowFee,
        noShowFeePercent,
        showPrepayment,
        prepaymentPercent,
        prepaymentPaid: false,
        prepaymentOffline: paymentMethod === "offline",
      }),
    [
      bookingTotalDiscount,
      kilometerAllowanceAmount,
      lateCancellationFeePercent,
      lateRescheduleFeePercent,
      noShowFeePercent,
      paymentMethod,
      prepaymentPercent,
      showLateCancellation,
      showLateRescheduling,
      showNoShowFee,
      showPrepayment,
      subtotalPrice,
    ],
  );
  const bookingDiscountAmount = bookingPrice.discountAmount;
  const lateCancellationFeeAmount = bookingPrice.lateCancellationFeeAmount;
  const lateRescheduleFeeAmount = bookingPrice.lateRescheduleFeeAmount;
  const noShowFeeAmount = bookingPrice.noShowFeeAmount;
  const prepaymentAmount = bookingPrice.prepaymentAmount;
  const remainingAfterPrepayment = bookingPrice.remainingAfterPrepayment;
  /** Amount due in the drawer (discount + fees + prepaid applied). */
  const totalPrice = bookingPrice.payableTotal;
  /** Persisted booking value (discount + fees, before prepaid deduction). */
  const bookingTotalForSave = bookingPrice.bookingTotal;
  const priceSummaryLines = React.useMemo(
    () =>
      buildBookingPriceSummaryLines({
        servicesTotal,
        guestsTotal,
        productsTotal,
        uniqueItemsTotal,
        extrasAmount: kilometerAllowanceAmount,
        discountAmount: bookingDiscountAmount,
        lateCancellationFeeAmount,
        lateRescheduleFeeAmount,
        noShowFeeAmount,
      }),
    [
      bookingDiscountAmount,
      guestsTotal,
      kilometerAllowanceAmount,
      lateCancellationFeeAmount,
      lateRescheduleFeeAmount,
      noShowFeeAmount,
      productsTotal,
      servicesTotal,
      uniqueItemsTotal,
    ],
  );

  /** Spreads into openBookingDrawer / openExistingBooking apply bags. */
  const feeDrawerApply = {
    setBookingTotalDiscount,
    setBookingDiscountModalOpen,
    setShowLateCancellation,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setShowLateRescheduling,
    setLateRescheduleFeePercent,
    setLateRescheduleFeePercentCeiling,
    setShowNoShowFee,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setCancellationFeeAt,
    setExceededCancellationWindow,
    setShowPrepayment,
    setPrepaymentPercent,
    setPaymentMethod,
  };

  return {
    showPrepayment,
    setShowPrepayment,
    prepaymentPercent,
    setPrepaymentPercent,
    bookingTotalDiscount,
    setBookingTotalDiscount,
    bookingDiscountModalOpen,
    setBookingDiscountModalOpen,
    showLateCancellation,
    setShowLateCancellation,
    lateCancellationFeePercent,
    setLateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    setLateCancellationFeePercentCeiling,
    showLateRescheduling,
    setShowLateRescheduling,
    lateRescheduleFeePercent,
    setLateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    setLateRescheduleFeePercentCeiling,
    showNoShowFee,
    setShowNoShowFee,
    noShowFeePercent,
    setNoShowFeePercent,
    noShowFeePercentCeiling,
    setNoShowFeePercentCeiling,
    cancellationFeeAt,
    setCancellationFeeAt,
    exceededCancellationWindow,
    setExceededCancellationWindow,
    paymentMethod,
    setPaymentMethod,
    bookingPrice,
    bookingDiscountAmount,
    lateCancellationFeeAmount,
    lateRescheduleFeeAmount,
    noShowFeeAmount,
    prepaymentAmount,
    remainingAfterPrepayment,
    totalPrice,
    bookingTotalForSave,
    priceSummaryLines,
    feeDrawerApply,
  };
}
