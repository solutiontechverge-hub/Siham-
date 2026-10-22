"use client";

import * as React from "react";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";

import {
  Box,
  Chip,
  Stack,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import AppTextField from "../../AppTextField";

import EditRequestIncomingNote from "../../client-booking/EditRequestIncomingNote";

import BookingRequestResponseActions from "../BookingRequestResponseActions";

import InlineTimedSnackbar from "../../InlineTimedSnackbar";

import {
  professionalShouldAck,
} from "../bookingAcknowledgment";

import BookingRequestAcceptedPanel from "../BookingRequestAcceptedPanel";

import BookingDrawerTotalPriceCard from "../BookingDrawerTotalPriceCard";

import { isOfflinePaymentMethod } from "../../client-booking/checkoutPaymentOptions";

import { useBookingFinance } from "../../booking-finance/useBookingFinance";
import { bookingFinanceBadgeLabel } from "../../booking-finance/mapBookingFinance";
import { extractBookingId } from "../calendar.utils";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotalsBag = Pick<
  Vm,
  | "actionFeedback"
  | "beginExistingBookingEdit"
  | "bookingDiscountAmount"
  | "bookingInternalNote"
  | "bookingPrice"
  | "bookingTotalDiscount"
  | "bookingTotalForSave"
  | "canMutateDrawerContents"
  | "drawerPriceDisplay"
  | "handleBookingActionSelect"
  | "incomingClientNote"
  | "incomingErNote"
  | "isDrawerPrepaymentPaid"
  | "isViewingBooking"
  | "kilometerAllowanceAmount"
  | "lateCancellationFeeAmount"
  | "lateRescheduleFeeAmount"
  | "lineDiscountAmount"
  | "m"
  | "noShowFeeAmount"
  | "onlinePrepayBlocksAccept"
  | "prepaymentAmount"
  | "prepaymentPercent"
  | "priceSummaryLines"
  | "remainingAfterPrepayment"
  | "responseActionsDismissed"
  | "setActionFeedback"
  | "setBookingInternalNote"
  | "setIncomingConfirmAction"
  | "showIncomingErActions"
  | "showIncomingRequestActions"
  | "showIncomingSuggestChange"
  | "showInternalNote"
  | "showPrepayment"
  | "totalPrice"
  | "viewingBookingEvent"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotalsProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotalsBag;
};

/** Incoming notes, internal note, totals card */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotals({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotalsProps) {
  const {
    actionFeedback,
    beginExistingBookingEdit,
    bookingDiscountAmount,
    bookingInternalNote,
    bookingPrice,
    bookingTotalDiscount,
    bookingTotalForSave,
    canMutateDrawerContents,
    drawerPriceDisplay,
    handleBookingActionSelect,
    incomingClientNote,
    incomingErNote,
    isDrawerPrepaymentPaid,
    isViewingBooking,
    kilometerAllowanceAmount,
    lateCancellationFeeAmount,
    lateRescheduleFeeAmount,
    lineDiscountAmount,
    m,
    noShowFeeAmount,
    onlinePrepayBlocksAccept,
    prepaymentAmount,
    prepaymentPercent,
    priceSummaryLines,
    remainingAfterPrepayment,
    responseActionsDismissed,
    setActionFeedback,
    setBookingInternalNote,
    setIncomingConfirmAction,
    showIncomingErActions,
    showIncomingRequestActions,
    showIncomingSuggestChange,
    showInternalNote,
    showPrepayment,
    totalPrice,
    viewingBookingEvent,
  } = bag;

  const viewingFinanceBookingId = React.useMemo(() => {
    if (!isViewingBooking || !viewingBookingEvent) return "";
    return (
      viewingBookingEvent.bookingCode ||
      extractBookingId(viewingBookingEvent.id) ||
      ""
    );
  }, [isViewingBooking, viewingBookingEvent]);
  const { finance: liveFinance } = useBookingFinance(viewingFinanceBookingId, {
    skip: !viewingFinanceBookingId,
  });

  const effectivePrepayPercent =
    Number(prepaymentPercent) ||
    Number(viewingBookingEvent?.details?.prepaymentPercent) ||
    0;
  const showPrepayBreakdown =
    (showPrepayment ||
      isDrawerPrepaymentPaid ||
      Boolean(viewingBookingEvent?.details?.showPrepayment)) &&
    effectivePrepayPercent > 0;
  // When drawer showPrepayment lagged, feeState amount is 0 — derive from % × afterDiscount.
  const displayPrepaidAmount =
    prepaymentAmount > 0
      ? prepaymentAmount
      : showPrepayBreakdown
        ? Math.round(
            ((bookingPrice.afterDiscount * effectivePrepayPercent) / 100 +
              Number.EPSILON) *
              100,
          ) / 100
        : 0;
  // Client cancel settles LCF via prepaid/Stripe — do not re-add it into Total Price.
  const isCancelledBooking = viewingBookingEvent?.status === "Cancelled";
  const rawCancellationFee =
    liveFinance?.cancellationFee ||
    bookingPrice.lateCancellationFeeAmount ||
    0;
  const displayCancellationFee = isCancelledBooking ? 0 : rawCancellationFee;

  // Prefer feeState remaining when it already applied prepay rules (incl. offline = full total).
  const offlinePrepay = isOfflinePaymentMethod(
    viewingBookingEvent?.details?.paymentMethod,
  );
  const displayRemaining = showPrepayBreakdown
    ? prepaymentAmount > 0
      ? remainingAfterPrepayment
      : offlinePrepay
        ? bookingTotalForSave
        : Math.round(
            (Math.max(0, bookingTotalForSave - displayPrepaidAmount) +
              Number.EPSILON) *
              100,
          ) / 100
    : undefined;

  return (
    <>
            {incomingClientNote &&
            incomingClientNote !== (incomingErNote ?? "") ? (
              <EditRequestIncomingNote
                note={incomingClientNote}
                from="client"
              />
            ) : null}

            {showIncomingErActions && incomingErNote ? (
              <EditRequestIncomingNote
                note={incomingErNote}
                from="client"
              />
            ) : null}

            {showIncomingRequestActions || showIncomingErActions
            ? (
              <>
                {!responseActionsDismissed ? (
                  <BookingRequestResponseActions
                    onAccept={() =>
                      setIncomingConfirmAction("accept")
                    }
                    onSuggestChange={() =>
                      setIncomingConfirmAction("suggest")
                    }
                    onReject={() =>
                      setIncomingConfirmAction("reject")
                    }
                    showAccept={
                      showIncomingErActions ||
                      !onlinePrepayBlocksAccept
                    }
                    showSuggestChange={showIncomingSuggestChange}
                  />
                ) : null}
                <InlineTimedSnackbar
                  open={Boolean(actionFeedback)}
                  message={actionFeedback?.message}
                  severity={actionFeedback?.severity}
                  onClose={() => setActionFeedback(null)}
                />
              </>
            ) : actionFeedback ? (
              <InlineTimedSnackbar
                open
                message={actionFeedback.message}
                severity={actionFeedback.severity}
                onClose={() => setActionFeedback(null)}
              />
            ) : null}

            {showInternalNote ? (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  sx={{ mb: 0.75 }}
                >
                  <StickyNote2OutlinedIcon
                    sx={{ fontSize: 16, color: m.teal }}
                  />
                  <BodyText
                    sx={{
                      ...mollureLabelSx(m.navy),
                    }}
                  >
                    Internal Note
                  </BodyText>
                </Stack>
                <AppTextField
                  label="Internal Note"
                  placeholder="Enter description"
                  value={bookingInternalNote}
                  disabled={!canMutateDrawerContents}
                  onChange={(e) => {
                    beginExistingBookingEdit();
                    setBookingInternalNote(e.target.value);
                  }}
                  multiline
                  minRows={4}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#fff",
                      borderRadius: "10px",
                    },
                  }}
                />
                <Box
                  sx={{
                    mt: 1.5,
                    borderTop: `1px solid ${alpha(m.navy, 0.1)}`,
                  }}
                />
              </Box>
            ) : null}

            {isViewingBooking &&
            professionalShouldAck(
              viewingBookingEvent?.details,
            ) ? (
              <BookingRequestAcceptedPanel
                totalPrice={drawerPriceDisplay.displayTotal}
                originalPrice={drawerPriceDisplay.originalPrice}
                prepaymentPercent={
                  showPrepayBreakdown ? effectivePrepayPercent : undefined
                }
                prepaymentAmount={displayPrepaidAmount}
                remainingAmount={
                  displayRemaining ?? remainingAfterPrepayment
                }
                lines={priceSummaryLines}
                discountAmount={bookingDiscountAmount}
                onOk={() =>
                  void handleBookingActionSelect("ok")
                }
              />
            ) : (
              <Stack spacing={1}>
                {liveFinance ? (
                  <Chip
                    size="small"
                    label={bookingFinanceBadgeLabel(liveFinance.badge)}
                    sx={{
                      alignSelf: "flex-start",
                      fontWeight: 800,
                      ...(liveFinance.badge === "PAID" ||
                      liveFinance.badge === "PREPAID"
                        ? {
                            bgcolor: m.statusGreenBg,
                            color: m.statusGreenFg,
                          }
                        : liveFinance.badge === "UNPAID"
                          ? {
                              bgcolor: m.statusRedBg,
                              color: m.statusRedFg,
                            }
                          : liveFinance.badge === "PARTIALLY_PAID" ||
                              liveFinance.badge === "PENDING_FEE"
                            ? {
                                bgcolor: m.statusOrangeBg,
                                color: m.statusOrangeFg,
                              }
                            : {
                                bgcolor: alpha(m.navy, 0.08),
                                color: alpha(m.navy, 0.78),
                              }),
                    }}
                  />
                ) : null}
                <BookingDrawerTotalPriceCard
                  payableTotal={
                    // Client pay total = services + LRF (LCF excluded after cancel).
                    Math.max(
                      0,
                      (liveFinance
                        ? Math.max(
                            liveFinance.netTotal,
                            bookingTotalForSave,
                            drawerPriceDisplay.displayTotal,
                          )
                        : showPrepayBreakdown
                          ? bookingTotalForSave
                          : drawerPriceDisplay.displayTotal) -
                        (isCancelledBooking ? rawCancellationFee : 0),
                    )
                  }
                  actualAmount={
                    liveFinance?.basePrice ||
                    drawerPriceDisplay.originalPrice ||
                    Math.max(
                      0,
                      bookingTotalForSave -
                        (bookingPrice.lateRescheduleFeeAmount || 0) -
                        rawCancellationFee -
                        (bookingPrice.noShowFeeAmount || 0),
                    )
                  }
                  lineDiscountAmount={lineDiscountAmount}
                  bookingDiscountAmount={bookingDiscountAmount}
                  bookingTotalDiscount={bookingTotalDiscount}
                  lateCancellationFeeAmount={displayCancellationFee}
                  lateRescheduleFeeAmount={
                    bookingPrice.lateRescheduleFeeAmount
                  }
                  noShowFeeAmount={bookingPrice.noShowFeeAmount}
                  prepaidApplied={
                    liveFinance
                      ? liveFinance.prepaymentTotal
                      : isDrawerPrepaymentPaid
                        ? displayPrepaidAmount
                        : 0
                  }
                  showPrepayment={
                    liveFinance
                      ? liveFinance.prepaymentTotal > 0
                      : showPrepayBreakdown
                  }
                  prepaymentPaid={
                    liveFinance
                      ? liveFinance.prepaymentTotal > 0
                      : isDrawerPrepaymentPaid
                  }
                  prepaymentPercent={effectivePrepayPercent}
                  prepaymentAmount={
                    liveFinance
                      ? liveFinance.prepaymentTotal
                      : displayPrepaidAmount
                  }
                  // Ledger balance is always an extra "Amount Due" row (not Remaining %).
                  remainingAmount={
                    liveFinance ? undefined : displayRemaining
                  }
                  prepaidAction={
                    // Professionals never pay here — only clients see "Pay Now".
                    (liveFinance
                      ? liveFinance.prepaymentTotal > 0
                      : isDrawerPrepaymentPaid) ? (
                      <BodyText
                        sx={{
                          fontWeight: 800,
                          fontSize: 12,
                          color: m.teal,
                        }}
                      >
                        Paid
                      </BodyText>
                    ) : undefined
                  }
                  extraRows={
                    liveFinance
                      ? [
                          ...liveFinance.addOnLines,
                          ...(liveFinance.totalPaid > 0
                            ? [
                                {
                                  id: "total-paid",
                                  label: "Total Paid",
                                  amount: liveFinance.totalPaid,
                                  tone: "paid" as const,
                                },
                              ]
                            : []),
                          ...(liveFinance.totalRefunded > 0
                            ? [
                                {
                                  id: "total-refunded",
                                  label: "Total Refunded",
                                  amount: -liveFinance.totalRefunded,
                                  tone: "refund" as const,
                                },
                              ]
                            : []),
                          // Always surface balance (Remaining row may hide when no prepay %).
                          {
                            id: "amount-due",
                            label: "Amount Due",
                            amount: Math.max(
                              0,
                              Math.max(
                                liveFinance.netTotal,
                                bookingTotalForSave,
                                drawerPriceDisplay.displayTotal,
                              ) -
                                (isCancelledBooking ? rawCancellationFee : 0) -
                                liveFinance.totalPaid,
                            ),
                            tone:
                              Math.max(
                                liveFinance.netTotal,
                                bookingTotalForSave,
                                drawerPriceDisplay.displayTotal,
                              ) -
                                (isCancelledBooking ? rawCancellationFee : 0) -
                                liveFinance.totalPaid >
                              0
                                ? ("due" as const)
                                : ("paid" as const),
                          },
                          ...(kilometerAllowanceAmount > 0 &&
                          !liveFinance.breakdownRows.some(
                            (r) => r.id === "kilometer-allowance",
                          )
                            ? [
                                {
                                  id: "kilometer-allowance",
                                  label: "Kilometer Allowance",
                                  amount: kilometerAllowanceAmount,
                                },
                              ]
                            : []),
                        ]
                      : kilometerAllowanceAmount > 0
                        ? [
                            {
                              id: "kilometer-allowance",
                              label: "Kilometer Allowance",
                              amount: kilometerAllowanceAmount,
                            },
                          ]
                        : []
                  }
                />
              </Stack>
            )}
    </>
  );
}
