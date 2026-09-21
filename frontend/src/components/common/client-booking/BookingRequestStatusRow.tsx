"use client";

import { Box, Chip, Stack, Tooltip } from "@mui/material";
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
import BookingIndicatorIcon from "../calendar/BookingIndicatorIcon";
import PrepaymentStatusIcon from "../calendar/PrepaymentStatusIcon";
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
  /** Click waiting-for-prepayment icon to open checkout. */
  onWaitingForPrepaymentClick?: () => void;
  bookingRequestDirection?: BookingRequestDirection;
  rowMode?: BookingRequestRowMode;
  /** Post-accept edit from the other party — show next to Confirmed status. */
  showUpdated?: boolean;
  updatedSignpostTitle?: string;
  onUpdatedClick?: () => void;
  /** Confirmed booking was edited after ER/EBR accept. */
  showEditScenario?: boolean;
  ebrSignpostTitle?: string;
  onEbrClick?: () => void;
  erSignpostTitle?: string;
  onErClick?: () => void;
};

function ScenarioPill({
  label,
  children,
  title,
  onClick,
}: {
  label: string;
  children?: ReactNode;
  title?: string;
  onClick?: () => void;
}) {
  const m = useTheme().palette.mollure;
  const chip = (
    <Chip
      size="small"
      label={
        <Stack direction="row" alignItems="center" spacing={0.35}>
          <span>{label}</span>
          {children}
        </Stack>
      }
      onClick={onClick}
      sx={{
        height: 18,
        fontWeight: 800,
        fontSize: 9,
        borderRadius: "6px",
        bgcolor: alpha(m.navy, 0.06),
        color: alpha(m.navy, 0.62),
        border: `1px solid ${alpha(m.navy, 0.14)}`,
        cursor: onClick ? "pointer" : "default",
        "& .MuiChip-label": { px: 0.7, py: 0, lineHeight: 1.2 },
      }}
    />
  );
  if (!title) return chip;
  return (
    <Tooltip title={title} placement="top">
      {chip}
    </Tooltip>
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
  ebrSignpostTitle,
  onEbrClick,
  erSignpostTitle,
  onErClick,
  onWaitingForPrepaymentClick,
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
    (bookingStatus === "br_accepted" ||
      bookingStatus === "requested" ||
      (isDraft && bookingRequestSent)) &&
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

  // BR pending (draft/requested) or accepted indicator (br_accepted → Confirmed chip + BR✓).
  const showBrAcceptedPill = bookingStatus === "br_accepted";
  const showBrPill =
    !isCompleted &&
    !isTerminal &&
    !isEbrIncoming &&
    !isEbrRejected &&
    !showErPill &&
    rowMode === "default" &&
    bookingStatus !== "confirmed" &&
    bookingStatus !== "in_progress" &&
    (showBrAcceptedPill ||
      (isDraft
        ? bookingRequestSent
        : bookingRequestSent || bookingStatus === "requested"));

  return (
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
      <Chip
        label={chipLabel}
        size="small"
        sx={{
          height: 18,
          fontWeight: 800,
          fontSize: 9,
          borderRadius: "6px",
          bgcolor: chipColors.bgcolor,
          color: chipColors.color,
          border: chipColors.border,
          "& .MuiChip-label": { px: 0.7, py: 0, lineHeight: 1.2 },
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
        <ScenarioPill
          label="EBR"
          title={ebrSignpostTitle}
          onClick={onEbrClick}
        >
          <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
            <BookingRequestReceivedIcon size={11} />
          </Box>
        </ScenarioPill>
      ) : null}

      {showErPill ? (
        <ScenarioPill label="ER" title={erSignpostTitle} onClick={onErClick}>
          {rowMode === "professional_rejected" ? (
            <EditRequestIndicatorIcon variant="rejected" />
          ) : (
            <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
              <BookingIndicatorIcon variant="suggestion_for_change" size={14} />
            </Box>
          )}
        </ScenarioPill>
      ) : null}

      {showBrPill ? (
        <BookingRequestBadge
          iconSize={12}
          state={showBrAcceptedPill ? "accepted" : "sent"}
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
          component={onWaitingForPrepaymentClick ? "button" : "span"}
          type={onWaitingForPrepaymentClick ? "button" : undefined}
          title="Waiting for prepayment — pay now"
          aria-label="Waiting for prepayment — pay now"
          onClick={onWaitingForPrepaymentClick}
          sx={{
            display: "grid",
            placeItems: "center",
            border: 0,
            padding: 0,
            bgcolor: "transparent",
            cursor: onWaitingForPrepaymentClick ? "pointer" : "default",
            borderRadius: "6px",
            "&:hover": onWaitingForPrepaymentClick
              ? { bgcolor: alpha(m.navy, 0.06) }
              : undefined,
          }}
        >
          <PrepaymentStatusIcon variant="pending" size={18} />
        </Box>
      ) : requiresPrepayment && prepaymentPaid && !isTerminal ? (
        <Box
          title="Prepayment received"
          aria-label="Prepayment received"
          sx={{ display: "grid", placeItems: "center" }}
        >
          <PrepaymentStatusIcon variant="confirmed" size={18} />
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
