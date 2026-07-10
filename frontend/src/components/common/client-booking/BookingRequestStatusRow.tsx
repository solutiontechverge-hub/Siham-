"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingRequestDirection, ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import { bookingStatusChipColors, bookingStatusLabel } from "../../../app/clients/booking/clientBookingStatus";
import BookingRequestBadge from "../calendar/BookingRequestBadge";
import BookingRequestReceivedIcon from "../calendar/BookingRequestReceivedIcon";
import EditRequestIndicatorIcon from "./EditRequestIndicatorIcon";
import PrepaymentPayNowIcon from "./PrepaymentPayNowIcon";
import PaymentDueIcon from "./PaymentDueIcon";

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
  const isEbrIncoming = rowMode === "professional_suggested";
  const isEbrRejected = rowMode === "professional_rejected" && bookingStatus === "cancelled";
  const showErPill = rowMode === "professional_rejected" && !isEbrRejected;
  const isDraft = bookingStatus === "draft";
  const isCompleted = bookingStatus === "completed";
  const waitingForPrepayment =
    requiresPrepayment && !prepaymentPaid && !isCompleted && bookingStatus !== "cancelled";
  const showPaymentIcon = waitingForPrepayment || paymentDue;

  const showBrPill =
    !isCompleted &&
    !showPaymentIcon &&
    !isEbrIncoming &&
    !isEbrRejected &&
    bookingStatus !== "cancelled" &&
    rowMode === "default" &&
    (isDraft
      ? bookingRequestSent || editRequestPending
      : bookingRequestSent || bookingStatus === "requested" || editRequestPending);
  const brAccepted = bookingStatus === "confirmed";
  const brRejected = bookingStatus === "cancelled" || isEbrRejected;

  const resolvedStatusForChip: ClientBookingStatus = isEbrIncoming ? "requested" : bookingStatus;
  const chipColors = isEbrRejected
    ? {
        bgcolor: "rgba(229, 115, 115, 0.22)",
        color: "#C62828",
        border: "1px solid rgba(229, 115, 115, 0.35)",
      }
    : bookingStatusChipColors(resolvedStatusForChip, { paymentDue });
  const chipLabel = isEbrRejected ? "Invalid" : bookingStatusLabel(resolvedStatusForChip, { paymentDue });

  return (
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
      {isEbrIncoming ? (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.6,
            height: 24,
            pl: 1.1,
            pr: 0.85,
            borderRadius: "999px",
            bgcolor: m.teal,
            color: "#fff",
            border: `1px solid ${m.tealDark}`,
          }}
          title="Edited booking request incoming"
          aria-label="EBR Incoming"
        >
          <Typography sx={{ fontWeight: 900, fontSize: 11, color: "#fff", lineHeight: 1, letterSpacing: "0.01em" }}>
            EBR Incoming
          </Typography>
          <Box sx={{ display: "grid", placeItems: "center", "& svg path": { stroke: "#fff" } }}>
            <BookingRequestReceivedIcon size={11} />
          </Box>
        </Box>
      ) : null}
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
          <EditRequestIndicatorIcon variant="rejected" />
        </Box>
      ) : null}
      {showPaymentIcon ? (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: paymentDue ? 30 : undefined,
            height: paymentDue ? 30 : undefined,
            borderRadius: paymentDue ? "8px" : undefined,
            bgcolor: paymentDue ? alpha(m.navy, 0.04) : undefined,
          }}
          title={paymentDue ? "Payment due" : "Waiting for payment"}
          aria-label={paymentDue ? "Payment due" : "Waiting for payment"}
        >
          {paymentDue ? <PaymentDueIcon size={22} /> : <PrepaymentPayNowIcon size={22} />}
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
