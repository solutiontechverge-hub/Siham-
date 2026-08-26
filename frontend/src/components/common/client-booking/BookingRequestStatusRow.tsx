"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  BookingRequestDirection,
  ClientBookingStatus,
} from "../../../app/clients/booking/clientBookingRecords";
import {
  bookingStatusChipColors,
  bookingStatusLabel,
} from "../../../app/clients/booking/clientBookingStatus";
import type { ReactNode } from "react";
import BookingRequestBadge from "../calendar/BookingRequestBadge";
import BookingRequestReceivedIcon from "../calendar/BookingRequestReceivedIcon";
import BookingRequestSentIcon from "../calendar/BookingRequestSentIcon";
import BookingIndicatorIcon from "../calendar/BookingIndicatorIcon";
import EditRequestIndicatorIcon from "./EditRequestIndicatorIcon";

export type BookingRequestRowMode =
  | "default"
  | "professional_suggested"
  | "professional_rejected";

type Props = {
  bookingStatus: ClientBookingStatus;
  bookingRequestSent?: boolean;
  editRequestPending?: boolean;
  requiresPrepayment?: boolean;
  /** True when required prepayment has already been paid. */
  prepaymentPaid?: boolean;
  /** Past booking still awaiting settlement. */
  paymentDue?: boolean;
  /** Invoice due date has passed. */
  paymentOverdue?: boolean;
  /** BR/EBR/ER response window has elapsed. */
  responseOverdue?: boolean;
  bookingRequestDirection?: BookingRequestDirection;
  rowMode?: BookingRequestRowMode;
  /** Post-accept edit from the other party — show next to Confirmed status. */
  showUpdated?: boolean;
  /** Confirmed booking was edited after ER/EBR accept. */
  showEditScenario?: boolean;
};

function ScenarioPill({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        height: 24,
        px: 1,
        borderRadius: "8px",
        bgcolor: alpha(m.navy, 0.04),
        border: `1px solid ${alpha(m.navy, 0.08)}`,
      }}
      title={label}
      aria-label={label}
    >
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: 11,
          color: alpha(m.navy, 0.55),
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default function BookingRequestStatusRow({
  bookingStatus,
  bookingRequestSent = false,
  editRequestPending = false,
  requiresPrepayment = false,
  prepaymentPaid = false,
  paymentDue = false,
  paymentOverdue = false,
  responseOverdue = false,
  bookingRequestDirection = "outgoing",
  rowMode = "default",
  showUpdated = false,
  showEditScenario = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const isEbrIncoming = rowMode === "professional_suggested";
  const isEbrRejected =
    rowMode === "professional_rejected" &&
    (bookingStatus === "cancelled" || bookingStatus === "invalid");
  const isDraft = bookingStatus === "draft";
  const isCompleted = bookingStatus === "completed";
  const isTerminal =
    bookingStatus === "cancelled" ||
    bookingStatus === "invalid" ||
    bookingStatus === "no_show";
  const showErPill =
    (rowMode === "professional_rejected" && !isEbrRejected) ||
    (editRequestPending && !isEbrIncoming && !isTerminal && !isCompleted);

  const waitingForPrepayment =
    requiresPrepayment &&
    !prepaymentPaid &&
    !isCompleted &&
    !isTerminal;

  const chipStatus: ClientBookingStatus = isEbrRejected
    ? "invalid"
    : bookingStatus;

  const chipColors = bookingStatusChipColors(chipStatus);
  const chipLabel = isEbrRejected
    ? "Invalid"
    : bookingStatusLabel(chipStatus, {
        edited: showEditScenario && chipStatus === "confirmed",
      });
  const isConfirmedChip = !isEbrRejected && chipStatus === "confirmed";

  // BR only while still pending (draft sent / requested) — hide after accept or reject.
  const showBrPill =
    !isCompleted &&
    !isTerminal &&
    !isEbrIncoming &&
    !isEbrRejected &&
    !showErPill &&
    rowMode === "default" &&
    bookingStatus !== "confirmed" &&
    bookingStatus !== "in_progress" &&
    (isDraft
      ? bookingRequestSent
      : bookingRequestSent || bookingStatus === "requested");

  return (
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
      <Chip
        label={chipLabel}
        size="small"
        icon={
          isConfirmedChip ? (
            <CheckCircleRoundedIcon
              sx={{
                fontSize: "12px !important",
                color: `${chipColors.color} !important`,
              }}
            />
          ) : undefined
        }
        sx={{
          height: 18,
          fontWeight: 800,
          fontSize: 9,
          borderRadius: "6px",
          bgcolor: chipColors.bgcolor,
          color: chipColors.color,
          border: chipColors.border,
          "& .MuiChip-label": { px: 0.7, py: 0, lineHeight: 1.2 },
          "& .MuiChip-icon": { ml: 0.5, mr: -0.35 },
        }}
      />

      {showUpdated && !isEbrIncoming && !showErPill ? (
        <Chip
          label="Updated"
          size="small"
          sx={{
            height: 18,
            fontWeight: 800,
            fontSize: 9,
            borderRadius: "6px",
            bgcolor: alpha(m.teal, 0.12),
            color: m.teal,
            border: `1px solid ${alpha(m.teal, 0.4)}`,
            "& .MuiChip-label": { px: 0.7, py: 0, lineHeight: 1.2 },
          }}
        />
      ) : null}

      {showEditScenario &&
      !isEbrIncoming &&
      !showErPill &&
      !isTerminal &&
      !isCompleted &&
      chipStatus !== "confirmed" ? (
        <ScenarioPill label="Edit" />
      ) : null}

      {isEbrIncoming ? (
        <ScenarioPill label="EBR">
          <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
            <BookingRequestReceivedIcon size={11} />
          </Box>
        </ScenarioPill>
      ) : null}

      {showErPill ? (
        <ScenarioPill label="ER">
          {rowMode === "professional_rejected" ? (
            <EditRequestIndicatorIcon variant="rejected" />
          ) : bookingRequestDirection === "incoming" ? (
            <BookingRequestReceivedIcon size={11} />
          ) : (
            <BookingRequestSentIcon size={11} />
          )}
        </ScenarioPill>
      ) : null}

      {showBrPill ? (
        <BookingRequestBadge
          iconSize={12}
          state="sent"
          direction={bookingRequestDirection}
        />
      ) : null}

      {responseOverdue && !isTerminal && !isCompleted ? (
        <Box
          title="Overdue response"
          aria-label="Overdue response"
          sx={{ display: "grid", placeItems: "center" }}
        >
          <BookingIndicatorIcon variant="overdue_response" size={16} />
        </Box>
      ) : null}

      {waitingForPrepayment ? (
        <Box
          title="Waiting for prepayment"
          aria-label="Waiting for prepayment"
          sx={{ display: "grid", placeItems: "center" }}
        >
          <BookingIndicatorIcon variant="waiting_for_prepayment" size={16} />
        </Box>
      ) : null}

      {prepaymentPaid && !isTerminal && !paymentDue ? (
        <Box
          title="Prepayment received"
          aria-label="Prepayment received"
          sx={{ display: "grid", placeItems: "center" }}
        >
          <BookingIndicatorIcon variant="prepaid" size={16} />
        </Box>
      ) : null}

      {paymentDue && !paymentOverdue ? (
        <Box
          title="Waiting for payment"
          aria-label="Waiting for payment"
          sx={{ display: "grid", placeItems: "center" }}
        >
          <BookingIndicatorIcon variant="waiting_for_payment" size={16} />
        </Box>
      ) : null}

      {paymentOverdue ? (
        <Box
          title="Overdue payment"
          aria-label="Overdue payment"
          sx={{ display: "grid", placeItems: "center" }}
        >
          <BookingIndicatorIcon variant="overdue_payment" size={16} />
        </Box>
      ) : null}
    </Stack>
  );
}
