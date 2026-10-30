"use client";

import { Box, Chip, Stack, Tooltip } from "@mui/material";
import type {
  BookingRequestDirection,
  ClientBookingStatus,
} from "../../../app/clients/booking/clientBookingRecords";
import {
  bookingSecondaryStatusBadgeSx,
  bookingSecondaryStatusChipSx,
  bookingStatusChipColors,
  bookingStatusLabel,
} from "../../../app/clients/booking/clientBookingStatus";
import type { ReactNode } from "react";
import BookingRequestBadge from "../calendar/BookingRequestBadge";
import BookingRequestReceivedIcon from "../calendar/BookingRequestReceivedIcon";
import BookingIndicatorIcon from "../calendar/BookingIndicatorIcon";
import EditRequestIndicatorIcon from "./EditRequestIndicatorIcon";

const STATUS_ICON_BOX = {
  display: "grid",
  placeItems: "center",
  width: 24,
  height: 24,
  lineHeight: 0,
  flexShrink: 0,
} as const;

export type BookingRequestRowMode =
  | "default"
  | "professional_suggested"
  | "professional_rejected";

type Props = {
  bookingStatus: ClientBookingStatus;
  bookingRequestSent?: boolean;
  editRequestPending?: boolean;
  /** Keep ER pill after accept/reject until the recipient OKs. */
  editRequestAwaitingAck?: boolean;
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
        ...bookingSecondaryStatusChipSx,
        cursor: onClick ? "pointer" : "default",
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
  editRequestAwaitingAck = false,
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
  const isEbrIncoming = rowMode === "professional_suggested";
  const isEbrRejected =
    rowMode === "professional_rejected" &&
    (bookingStatus === "cancelled" || bookingStatus === "invalid");
  const isDraft = bookingStatus === "draft";
  // Parent passes schedule-resolved status (confirmed ↔ in_progress ↔ completed).
  const displayStatus: ClientBookingStatus = bookingStatus;
  const isCompleted = displayStatus === "completed";
  const isTerminal =
    bookingStatus === "cancelled" ||
    bookingStatus === "invalid" ||
    bookingStatus === "no_show";
  const showErPill =
    (rowMode === "professional_rejected" && !isEbrRejected) ||
    ((editRequestPending || editRequestAwaitingAck) &&
      !isEbrIncoming &&
      !isTerminal &&
      !isCompleted);

  // Icon 1 while any prepayment is still owed (BR / confirmed / draft sent).
  const waitingForPrepayment =
    requiresPrepayment &&
    !prepaymentPaid &&
    !isCompleted &&
    !isTerminal &&
    (bookingStatus === "br_accepted" ||
      bookingStatus === "requested" ||
      bookingStatus === "confirmed" ||
      (isDraft && bookingRequestSent));

  const chipStatus: ClientBookingStatus = isEbrRejected
    ? "invalid"
    : displayStatus;

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

  const waitingForResponse =
    !responseOverdue &&
    !isTerminal &&
    !isCompleted &&
    ((showBrPill && !showBrAcceptedPill) || showErPill || isEbrIncoming);

  return (
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
      <Chip
        label={chipLabel}
        size="small"
        sx={{
          height: 24,
          minHeight: 24,
          maxHeight: 24,
          boxSizing: "border-box",
          fontWeight: 600,
          fontSize: 11,
          borderRadius: "6px",
          bgcolor: chipColors.bgcolor,
          color: chipColors.color,
          border: chipColors.border,
          borderWidth: chipColors.border === "none" ? 0 : undefined,
          "& .MuiChip-label": {
            px: 1.1,
            py: 0,
            lineHeight: "24px",
            display: "flex",
            alignItems: "center",
          },
        }}
      />

      {showUpdated && !isEbrIncoming && !showErPill ? (
        <Chip label="Updated" size="small" sx={bookingSecondaryStatusChipSx} />
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
          sx={bookingSecondaryStatusBadgeSx}
        />
      ) : null}

      {waitingForResponse ? (
        <Box
          title="Waiting for response"
          aria-label="Waiting for response"
          sx={STATUS_ICON_BOX}
        >
          <BookingIndicatorIcon variant="response_time_active" size={24} />
        </Box>
      ) : null}

      {responseOverdue && !isTerminal && !isCompleted ? (
        <Box
          title="Overdue response"
          aria-label="Overdue response"
          sx={STATUS_ICON_BOX}
        >
          <BookingIndicatorIcon variant="overdue_response" size={24} />
        </Box>
      ) : null}

      {/*
        Icon 1 (€ clock: prepayment due OR after-treatment payment due.
        Icon 2 (€✓): only when prepaid (if required) AND remaining AT is settled.
      */}
      {waitingForPrepayment ? (
        <Box
          component={onWaitingForPrepaymentClick ? "button" : "span"}
          type={onWaitingForPrepaymentClick ? "button" : undefined}
          title="Waiting for payment — prepayment due"
          aria-label="Waiting for payment — prepayment due"
          onClick={onWaitingForPrepaymentClick}
          sx={{
            ...STATUS_ICON_BOX,
            border: "none",
            padding: 0,
            bgcolor: "transparent",
            cursor: onWaitingForPrepaymentClick ? "pointer" : "default",
            borderRadius: "8px",
            "&:hover": onWaitingForPrepaymentClick
              ? { opacity: 0.88 }
              : undefined,
          }}
        >
          <BookingIndicatorIcon variant="waiting_for_payment" size={24} />
        </Box>
      ) : paymentDue && !paymentOverdue ? (
        <Box
          title="Waiting for payment"
          aria-label="Waiting for payment"
          sx={STATUS_ICON_BOX}
        >
          <BookingIndicatorIcon variant="waiting_for_payment" size={24} />
        </Box>
      ) : paymentOverdue ? (
        <Box
          title="Overdue payment"
          aria-label="Overdue payment"
          sx={STATUS_ICON_BOX}
        >
          <BookingIndicatorIcon variant="overdue_payment" size={24} />
        </Box>
      ) : (!requiresPrepayment || prepaymentPaid) &&
        !paymentDue &&
        !paymentOverdue &&
        isCompleted &&
        !isTerminal ? (
        <Box
          title="Paid"
          aria-label="Paid"
          sx={STATUS_ICON_BOX}
        >
          <BookingIndicatorIcon variant="prepaid" size={24} />
        </Box>
      ) : null}
    </Stack>
  );
}
