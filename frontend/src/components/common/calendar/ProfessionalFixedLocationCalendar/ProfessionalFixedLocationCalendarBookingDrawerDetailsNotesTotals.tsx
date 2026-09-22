"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";

import {
  Box,
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
  | "confirmDrawerPrepayment"
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
    confirmDrawerPrepayment,
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
              <BookingDrawerTotalPriceCard
                payableTotal={
                  showPrepayBreakdown
                    ? bookingTotalForSave
                    : drawerPriceDisplay.displayTotal
                }
                actualAmount={
                  drawerPriceDisplay.originalPrice ??
                  bookingTotalForSave
                }
                lineDiscountAmount={lineDiscountAmount}
                bookingDiscountAmount={bookingDiscountAmount}
                bookingTotalDiscount={bookingTotalDiscount}
                lateCancellationFeeAmount={
                  bookingPrice.lateCancellationFeeAmount
                }
                lateRescheduleFeeAmount={
                  bookingPrice.lateRescheduleFeeAmount
                }
                noShowFeeAmount={bookingPrice.noShowFeeAmount}
                prepaidApplied={
                  isDrawerPrepaymentPaid ? displayPrepaidAmount : 0
                }
                showPrepayment={showPrepayBreakdown}
                prepaymentPaid={isDrawerPrepaymentPaid}
                prepaymentPercent={effectivePrepayPercent}
                prepaymentAmount={displayPrepaidAmount}
                remainingAmount={displayRemaining}
                prepaidAction={
                  showPrepayBreakdown && !isDrawerPrepaymentPaid ? (
                    <BodyText
                      component="button"
                      type="button"
                      // ponytail: testing Pay Now — ceiling: local paid override only; restore real checkout when Stripe is wired.
                      onClick={confirmDrawerPrepayment}
                      sx={mollureLabelSx(m.navy, {
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        bgcolor: "transparent",
                        p: 0,
                        m: 0,
                        cursor: "pointer",
                        color: m.teal,
                        fontFamily: "inherit",
                        appearance: "none",
                        WebkitAppearance: "none",
                        "&:hover": { color: m.tealDark },
                        "&:focus": { outline: "none" },
                        "&:focus-visible": {
                          outline: `2px solid ${alpha(m.teal, 0.45)}`,
                          outlineOffset: 2,
                        },
                      })}
                    >
                      Pay Now
                    </BodyText>
                  ) : isDrawerPrepaymentPaid ? (
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
                  kilometerAllowanceAmount > 0
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
            )}
    </>
  );
}
