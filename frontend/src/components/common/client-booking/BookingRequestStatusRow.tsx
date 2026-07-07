"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingRequestDirection, ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import { bookingStatusChipColors, bookingStatusLabel } from "../../../app/clients/booking/clientBookingStatus";
import BookingRequestBadge from "../calendar/BookingRequestBadge";
import EditRequestIndicatorIcon from "./EditRequestIndicatorIcon";
import PrepaymentEuroIndicator from "./PrepaymentEuroIndicator";

export type BookingRequestRowMode = "default" | "professional_suggested" | "professional_rejected";

type Props = {
  bookingStatus: ClientBookingStatus;
  bookingRequestSent?: boolean;
  editRequestPending?: boolean;
  requiresPrepayment?: boolean;
  bookingRequestDirection?: BookingRequestDirection;
  rowMode?: BookingRequestRowMode;
};

export default function BookingRequestStatusRow({
  bookingStatus,
  bookingRequestSent = false,
  editRequestPending = false,
  requiresPrepayment = false,
  bookingRequestDirection = "outgoing",
  rowMode = "default",
}: Props) {
  const m = useTheme().palette.mollure;
  const showErPill = rowMode === "professional_suggested" || rowMode === "professional_rejected";
  const isDraft = bookingStatus === "draft";
  const showBrPill =
    bookingStatus !== "cancelled" &&
    rowMode === "default" &&
    (isDraft
      ? bookingRequestSent || editRequestPending
      : bookingRequestSent || !isDraft);
  const brAccepted = bookingStatus === "confirmed" || bookingStatus === "completed";
  const brRejected = bookingStatus === "cancelled";

  const statusForChip: ClientBookingStatus =
    rowMode === "professional_suggested" ? "confirmed" : bookingStatus;
  const chipColors = bookingStatusChipColors(statusForChip);
  const chipLabel = bookingStatusLabel(statusForChip);

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
      {showBrPill ? (
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <BookingRequestBadge
            iconSize={12}
            state={brRejected ? "rejected" : brAccepted ? "accepted" : "sent"}
            direction={bookingRequestDirection}
          />
          {requiresPrepayment ? <PrepaymentEuroIndicator size={22} /> : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
