"use client";

import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingRequestDirection, ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import { bookingStatusChipColors, bookingStatusLabel } from "../../../app/clients/booking/clientBookingStatus";
import EditRequestIndicatorIcon from "./EditRequestIndicatorIcon";
import PrepaymentEuroIndicator from "./PrepaymentEuroIndicator";

export type BookingRequestRowMode = "default" | "professional_suggested" | "professional_rejected";

type Props = {
  bookingStatus: ClientBookingStatus;
  requiresPrepayment?: boolean;
  bookingRequestDirection?: BookingRequestDirection;
  rowMode?: BookingRequestRowMode;
};

export default function BookingRequestStatusRow({
  bookingStatus,
  requiresPrepayment = false,
  bookingRequestDirection,
  rowMode = "default",
}: Props) {
  const m = useTheme().palette.mollure;
  const showErPill = rowMode === "professional_suggested" || rowMode === "professional_rejected";
  const showBrPill = bookingStatus !== "cancelled" && rowMode === "default";

  const statusForChip: ClientBookingStatus =
    rowMode === "professional_suggested" ? "confirmed" : bookingStatus;
  const chipColors = bookingStatusChipColors(statusForChip);
  const chipLabel = bookingStatusLabel(statusForChip);

  const bookingRequestSent =
    bookingStatus === "requested" || bookingStatus === "confirmed" || bookingStatus === "completed";
  const tickActive =
    bookingRequestDirection === "outgoing"
      ? bookingRequestSent
      : bookingRequestDirection === "incoming"
        ? bookingStatus === "confirmed" || bookingStatus === "completed"
        : bookingRequestSent;

  const tickSize = 22;
  const tickStroke = tickActive ? m.success : alpha(m.navy, 0.32);

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
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.65,
            borderRadius: "10px",
            bgcolor: alpha(m.navy, 0.04),
            border: `1px solid ${alpha(m.navy, 0.08)}`,
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.55), letterSpacing: "0.02em" }}>
            BR
          </Typography>
          {bookingRequestDirection ? (
            <Typography sx={{ fontWeight: 900, fontSize: 11, color: alpha(m.navy, 0.42), lineHeight: 1 }}>
              {bookingRequestDirection === "outgoing" ? "→" : "←"}
            </Typography>
          ) : null}
          {tickActive ? (
            <CheckCircleOutlinedIcon sx={{ fontSize: tickSize, color: m.success }} />
          ) : (
            <Box
              component="span"
              aria-hidden
              sx={{ width: tickSize, height: tickSize, flexShrink: 0, display: "inline-flex" }}
            >
              <svg width={tickSize} height={tickSize} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke={tickStroke} strokeWidth="1.5" />
              </svg>
            </Box>
          )}
          {requiresPrepayment ? <PrepaymentEuroIndicator size={22} /> : null}
        </Box>
      ) : null}
    </Stack>
  );
}
