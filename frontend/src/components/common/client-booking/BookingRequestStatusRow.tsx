"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingRequestDirection, ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import { bookingStatusChipColors, bookingStatusLabel } from "../../../app/clients/booking/clientBookingStatus";
import BookingRequestBadge from "../calendar/BookingRequestBadge";
import EditRequestIndicatorIcon from "./EditRequestIndicatorIcon";
import PrepaymentPayNowIcon from "./PrepaymentPayNowIcon";

export type BookingRequestRowMode = "default" | "professional_suggested" | "professional_rejected";

type Props = {
  bookingStatus: ClientBookingStatus;
  bookingRequestSent?: boolean;
  editRequestPending?: boolean;
  requiresPrepayment?: boolean;
  /** True when required prepayment has already been paid. */
  prepaymentPaid?: boolean;
  /** Past booking still awaiting settlement. */
  paymentDue?: boolean;
  bookingRequestDirection?: BookingRequestDirection;
  rowMode?: BookingRequestRowMode;
};

export default function BookingRequestStatusRow({
  bookingStatus,
  bookingRequestSent = false,
  editRequestPending = false,
  requiresPrepayment = false,
  prepaymentPaid = false,
  paymentDue = false,
  bookingRequestDirection = "outgoing",
  rowMode = "default",
}: Props) {
  const m = useTheme().palette.mollure;
  const showErPill = rowMode === "professional_suggested" || rowMode === "professional_rejected";
  const isDraft = bookingStatus === "draft";
  const isCompleted = bookingStatus === "completed";
  const waitingForPrepayment =
    requiresPrepayment && !prepaymentPaid && !isCompleted && bookingStatus !== "cancelled";
  const showPaymentIcon = waitingForPrepayment || paymentDue;

  // Completed without payment due: status chip only — no BR / payment icons.
  // Waiting for payment: waiting-payment icon only (no BR).
  const showBrPill =
    !isCompleted &&
    !showPaymentIcon &&
    bookingStatus !== "cancelled" &&
    rowMode === "default" &&
    (isDraft
      ? bookingRequestSent || editRequestPending
      : bookingRequestSent || bookingStatus === "requested");
  const brAccepted = bookingStatus === "confirmed";
  const brRejected = bookingStatus === "cancelled";

  const statusForChip: ClientBookingStatus =
    rowMode === "professional_suggested" ? "confirmed" : bookingStatus;
  const chipColors = bookingStatusChipColors(statusForChip, { paymentDue });
  const chipLabel = bookingStatusLabel(statusForChip, { paymentDue });

  return (
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
      <Chip
        label={chipLabel}
        size="small"
        sx={{
          height: 24,
          fontWeight: 900,
          fontSize: 11,
          borderRadius: "999px",
          bgcolor: chipColors.bgcolor,
          color: chipColors.color,
          border: chipColors.border,
        }}
      />
      {showErPill ? (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.25,
            py: 0.65,
            borderRadius: "10px",
            bgcolor: alpha(m.navy, 0.04),
            border: `1px solid ${alpha(m.navy, 0.08)}`,
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.55), letterSpacing: "0.02em" }}>
            ER
          </Typography>
          <EditRequestIndicatorIcon variant={rowMode === "professional_rejected" ? "rejected" : "arrow"} />
        </Box>
      ) : null}
      {showPaymentIcon ? (
        <Box
          sx={{ display: "inline-flex", alignItems: "center" }}
          title={paymentDue ? "Payment due" : "Waiting for payment"}
          aria-label={paymentDue ? "Payment due" : "Waiting for payment"}
        >
          <PrepaymentPayNowIcon size={22} />
        </Box>
      ) : null}
      {showBrPill ? (
        <BookingRequestBadge
          iconSize={12}
          state={brRejected ? "rejected" : brAccepted ? "accepted" : "sent"}
          direction={bookingRequestDirection}
        />
      ) : null}
    </Stack>
  );
}
