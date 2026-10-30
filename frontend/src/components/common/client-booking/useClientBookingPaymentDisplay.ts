"use client";

import * as React from "react";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import type { CalendarBookingDetails } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { resolveKilometerAllowanceAmount } from "../calendar/bookingEventDetails";
import { summarizeClientBookingPrice } from "../calendar/bookingTotal";
import {
  hasAfterTreatmentCheckoutSignal,
  resolveAfterTreatmentPayerRows,
} from "../calendar/resolveAfterTreatmentPayerRows";
import { parseSplitBillState } from "../calendar/salesSplitBill";
import { isProtectiveFeeEntryLabel } from "../finance-documents/protectiveFeeInvoice";
import { buildClientBookingPaymentSummary } from "./buildClientBookingPaymentSummary";
import {
  checkoutPaymentMethodApiValue,
  type CheckoutPaymentMethodId,
} from "./checkoutPaymentOptions";
import { filterVisiblePaymentSummarySections } from "./clientBookingDetails.helpers";
import type { BookingEditSuggestedProduct } from "./bookingEditRequest";
import type { ClientBookingDraft } from "./types";

export function useClientBookingPaymentDisplay(input: {
  locationMode: string;
  bookingNotesMeta?: CalendarBookingDetails | null;
  activeBooking: {
    prepaymentPercent?: number | null;
    paid?: boolean | null;
    requiresPrepayment?: boolean | null;
  } | null;
  prepaymentPercent: number;
  isCancelled: boolean;
  prepaymentState: "paid" | "required" | "none";
  isEbrIncoming: boolean;
  editRequestIsPending: boolean;
  editRequestIsSuggested: boolean;
  suggestedProducts?: BookingEditSuggestedProduct[] | null;
  displayDraft: ClientBookingDraft | null;
  draft: ClientBookingDraft | null;
  isOfflinePay: boolean;
  isPrepaymentPaid: boolean;
  isCompleted: boolean;
  isPaymentDue: boolean;
  paymentOverdue?: boolean;
  invoiceDueDateLabel?: string | null;
  requiresPrepayment: boolean;
  bookingStatus: ClientBookingStatus;
  requesterName: string;
  selectedPaymentMethod: CheckoutPaymentMethodId;
  shopDisplayName: string;
  /** Charged LCF/LRF/NS rows from finance — drives Fee Summary under Prepayment. */
  paidProtectiveFees?: ReadonlyArray<{
    entryLabel?: string | null;
    amount: number;
    dateLabel?: string;
    methodLabel?: string;
    status?: string;
    transactionId?: string;
    settled?: boolean;
  }>;
  financeRows?: readonly TransactionRow[];
  bookingId?: string | null;
  bookingRef?: string | null;
}) {
  const kilometerAllowanceAmount = React.useMemo(
    () =>
      resolveKilometerAllowanceAmount(
        input.bookingNotesMeta?.kilometerAllowance,
      ),
    [input.bookingNotesMeta?.kilometerAllowance],
  );
  /** Desired-location bookings: show when a kilometer allowance amount is set. */
  const showKilometerAllowance =
    input.locationMode === "desired" && kilometerAllowanceAmount > 0;
  /** Prepayment breakdown when the professional has a % set. */
  const effectivePrepayPercent =
    Number(input.activeBooking?.prepaymentPercent ?? input.prepaymentPercent) ||
    0;
  const paymentCardPrepaymentState =
    effectivePrepayPercent > 0 && !input.isCancelled
      ? input.prepaymentState
      : ("none" as const);

  const paymentProducts = React.useMemo(() => {
    if (input.isEbrIncoming || input.editRequestIsPending) {
      return input.suggestedProducts ?? [];
    }
    return (
      (input.displayDraft?.products ?? input.draft?.products)?.map(
        (product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          originalPrice: product.originalPrice,
          discountType: product.discountType,
          discountAmount: product.discountAmount,
          guestId: product.guestId ?? null,
        }),
      ) ?? []
    );
  }, [
    input.displayDraft?.products,
    input.draft?.products,
    input.editRequestIsPending,
    input.isEbrIncoming,
    input.suggestedProducts,
  ]);

  const detailsPrice = React.useMemo(
    () =>
      summarizeClientBookingPrice({
        services: input.displayDraft?.services ?? input.draft?.services,
        people: input.displayDraft?.people ?? input.draft?.people,
        products: paymentProducts,
        extrasAmount: showKilometerAllowance ? kilometerAllowanceAmount : 0,
        discount: input.bookingNotesMeta?.totalDiscount ?? null,
        showLateCancellation:
          Boolean(input.bookingNotesMeta?.showLateCancellation) &&
          !input.isCancelled,
        lateCancellationFeePercent:
          input.bookingNotesMeta?.lateCancellationFeePercent,
        showLateRescheduling: Boolean(
          input.bookingNotesMeta?.showLateRescheduling,
        ),
        lateRescheduleFeePercent:
          input.bookingNotesMeta?.lateRescheduleFeePercent,
        showNoShowFee: Boolean(input.bookingNotesMeta?.showNoShowFee),
        noShowFeePercent: input.bookingNotesMeta?.noShowFeePercent,
        showPrepayment:
          paymentCardPrepaymentState !== "none" && effectivePrepayPercent > 0,
        prepaymentPercent: effectivePrepayPercent,
        prepaymentPaid: paymentCardPrepaymentState === "paid",
        prepaymentOffline: input.isOfflinePay,
      }),
    [
      input.bookingNotesMeta?.lateCancellationFeePercent,
      input.bookingNotesMeta?.lateRescheduleFeePercent,
      input.bookingNotesMeta?.noShowFeePercent,
      input.bookingNotesMeta?.showLateCancellation,
      input.bookingNotesMeta?.showLateRescheduling,
      input.bookingNotesMeta?.showNoShowFee,
      input.bookingNotesMeta?.totalDiscount,
      input.isCancelled,
      input.displayDraft?.people,
      input.displayDraft?.services,
      input.draft?.people,
      input.draft?.services,
      effectivePrepayPercent,
      input.isOfflinePay,
      kilometerAllowanceAmount,
      paymentCardPrepaymentState,
      paymentProducts,
      showKilometerAllowance,
    ],
  );
  const displayTotal = detailsPrice.breakdown.bookingTotal;
  const displayPrepaidAmount = detailsPrice.breakdown.prepaymentAmount;

  const splitBill = React.useMemo(
    () => parseSplitBillState(input.bookingNotesMeta?.splitBill),
    [input.bookingNotesMeta?.splitBill],
  );

  const financeHasAfterTreatmentTx = React.useMemo(() => {
    const rows = input.financeRows ?? [];
    return rows.some((row) => {
      if (isProtectiveFeeEntryLabel(row.entryLabel)) return false;
      const label = String(row.entryLabel ?? "").toLowerCase();
      // Require pro-checkout AT label — bare phase=full is also created by autocomplete.
      return (
        label.includes("after treatment") || label.includes("after-treatment")
      );
    });
  }, [input.financeRows]);

  const hasAfterTreatmentCheckout = React.useMemo(
    () =>
      hasAfterTreatmentCheckoutSignal({
        splitBill,
        waitingForPayment: Boolean(input.bookingNotesMeta?.waitingForPayment),
        financeHasAfterTreatmentTx,
      }),
    [
      financeHasAfterTreatmentTx,
      input.bookingNotesMeta?.waitingForPayment,
      splitBill,
    ],
  );

  const afterTreatmentPayers = React.useMemo(() => {
    const remaining = Math.max(
      0,
      round2(displayTotal - (displayPrepaidAmount || 0)),
    );
    return resolveAfterTreatmentPayerRows({
      splitBill,
      bookingPaymentMethod:
        input.bookingNotesMeta?.paymentMethod ??
        checkoutPaymentMethodApiValue(input.selectedPaymentMethod),
      bookingPaid: input.activeBooking?.paid === true,
      paymentDue: input.isPaymentDue,
      paymentOverdue: Boolean(input.paymentOverdue),
      invoiceDueDateLabel: input.invoiceDueDateLabel ?? null,
      financeRows: input.financeRows,
      bookingId: input.bookingId,
      bookingCode: input.bookingRef,
      fallbackMainAmount: remaining,
      enabled: hasAfterTreatmentCheckout,
    });
  }, [
    displayPrepaidAmount,
    displayTotal,
    hasAfterTreatmentCheckout,
    input.activeBooking?.paid,
    input.bookingId,
    input.bookingNotesMeta?.paymentMethod,
    input.bookingRef,
    input.financeRows,
    input.invoiceDueDateLabel,
    input.isPaymentDue,
    input.paymentOverdue,
    input.selectedPaymentMethod,
    splitBill,
  ]);

  const paymentSummarySections = React.useMemo(
    () =>
      buildClientBookingPaymentSummary({
        draft: input.displayDraft ?? input.draft,
        requesterName: input.requesterName,
        prepaid: input.isPrepaymentPaid,
        paid: input.activeBooking?.paid === true,
        requiresPrepayment: Boolean(
          input.activeBooking?.requiresPrepayment ?? input.requiresPrepayment,
        ),
        prepaymentPercent:
          input.activeBooking?.prepaymentPercent ?? input.prepaymentPercent,
        paymentDue: input.isPaymentDue,
        paymentOverdue: Boolean(input.paymentOverdue),
        invoiceDueDateLabel: input.invoiceDueDateLabel ?? null,
        hasEditPrepayment: input.editRequestIsSuggested,
        paymentDateIso: input.draft?.selectedDateISO,
        paymentTime: input.draft?.selectedTime,
        paymentMethod:
          input.bookingNotesMeta?.paymentMethod ??
          checkoutPaymentMethodApiValue(input.selectedPaymentMethod),
        prepaidAmountOverride: displayPrepaidAmount,
        showUnpaidPrepayment: input.isOfflinePay,
        shopName: input.shopDisplayName,
        paidProtectiveFees: input.paidProtectiveFees,
        afterTreatmentPayers,
      }),
    [
      afterTreatmentPayers,
      input.activeBooking?.paid,
      input.activeBooking?.prepaymentPercent,
      input.activeBooking?.requiresPrepayment,
      input.bookingNotesMeta?.paymentMethod,
      input.displayDraft,
      input.draft,
      input.editRequestIsSuggested,
      input.isOfflinePay,
      input.invoiceDueDateLabel,
      input.isPaymentDue,
      input.isPrepaymentPaid,
      input.paidProtectiveFees,
      input.paymentOverdue,
      input.prepaymentPercent,
      input.requesterName,
      input.requiresPrepayment,
      input.selectedPaymentMethod,
      input.shopDisplayName,
      displayPrepaidAmount,
    ],
  );

  /** After prepayment: show Payment Summary (invoice/receipt). Also on completed / payment due. */
  const visiblePaymentSummarySections = React.useMemo(
    () =>
      filterVisiblePaymentSummarySections(paymentSummarySections, {
        isPrepaymentPaid: input.isPrepaymentPaid,
        isOfflinePay: input.isOfflinePay,
        isCompleted: input.isCompleted,
        isPaymentDue: input.isPaymentDue,
        // Cancelled + No Show: keep Prepayment + Fee Summary only.
        isCancelled:
          input.isCancelled || input.bookingStatus === "no_show",
        hasAfterTreatmentCheckout,
      }),
    [
      hasAfterTreatmentCheckout,
      input.bookingStatus,
      input.isCancelled,
      input.isCompleted,
      input.isOfflinePay,
      input.isPaymentDue,
      input.isPrepaymentPaid,
      paymentSummarySections,
    ],
  );

  const showPaymentSummary =
    visiblePaymentSummarySections.length > 0 &&
    (input.isCancelled ||
      input.bookingStatus === "no_show" ||
      input.isPrepaymentPaid ||
      input.activeBooking?.paid === true ||
      Boolean(input.paidProtectiveFees?.length) ||
      (input.isOfflinePay &&
        input.requiresPrepayment &&
        input.bookingStatus !== "draft"));

  // Source of truth for header icon/Delete — finance Pending overrides stale notes.paid.
  const hasUnpaidAfterTreatment = afterTreatmentPayers.some(
    (row) => row.amount > 0 && row.statusLabel !== "Paid",
  );

  return {
    kilometerAllowanceAmount,
    showKilometerAllowance,
    effectivePrepayPercent,
    paymentCardPrepaymentState,
    paymentProducts,
    detailsPrice,
    displayTotal,
    displayPrepaidAmount,
    paymentSummarySections,
    visiblePaymentSummarySections,
    showPaymentSummary,
    afterTreatmentPayers,
    hasAfterTreatmentCheckout,
    hasUnpaidAfterTreatment,
  };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
