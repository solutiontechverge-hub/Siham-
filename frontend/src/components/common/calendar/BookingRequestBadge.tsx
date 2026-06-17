"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { Box, Stack, Tooltip, Typography, type SxProps, type Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BookingRequestSentIcon, { BOOKING_REQUEST_SENT_LABEL } from "./BookingRequestSentIcon";

export const BOOKING_REQUEST_ACCEPTED_LABEL = "Booking request accepted";
export const BOOKING_REQUEST_REJECTED_LABEL = "Booking request rejected";

export type BookingRequestBadgeVariant = "compact" | "default" | "inline";
export type BookingRequestBadgeState = "sent" | "accepted" | "rejected";

type BookingRequestBadgeProps = {
  variant?: BookingRequestBadgeVariant;
  iconSize?: number;
  /** @deprecated Prefer `state` */
  accepted?: boolean;
  state?: BookingRequestBadgeState;
  sx?: SxProps<Theme>;
};

function resolveBadgeState({
  accepted,
  state,
}: Pick<BookingRequestBadgeProps, "accepted" | "state">): BookingRequestBadgeState {
  if (state) return state;
  if (accepted) return "accepted";
  return "sent";
}

function BookingRequestRejectedIcon({ size }: { size: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: "#E53935",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <CloseRoundedIcon sx={{ fontSize: Math.max(8, size - 6), color: "#fff" }} />
    </Box>
  );
}

export default function BookingRequestBadge({
  variant = "default",
  iconSize,
  accepted,
  state: stateProp,
  sx,
}: BookingRequestBadgeProps) {
  const m = useTheme().palette.mollure;
  const state = resolveBadgeState({ accepted, state: stateProp });
  const isCompact = variant === "compact";
  const isInline = variant === "inline";
  const resolvedIconSize = iconSize ?? (isCompact || isInline ? 10 : 12);
  const labelSize = isCompact ? 9.5 : 12.5;
  const fontWeight = isCompact ? 700 : 900;
  const tooltipLabel =
    state === "accepted"
      ? BOOKING_REQUEST_ACCEPTED_LABEL
      : state === "rejected"
        ? BOOKING_REQUEST_REJECTED_LABEL
        : BOOKING_REQUEST_SENT_LABEL;
  const statusIconSize = isCompact ? 14 : Math.max(18, resolvedIconSize + 6);

  const content = (
    <>
      <Typography
        component="span"
        sx={{
          fontWeight,
          fontSize: labelSize,
          color: isCompact ? "inherit" : alpha(m.navy, 0.55),
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        BR
      </Typography>
      <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
        {state === "accepted" ? (
          <CheckCircleOutlinedIcon sx={{ fontSize: statusIconSize, color: m.success }} />
        ) : state === "rejected" ? (
          <BookingRequestRejectedIcon size={statusIconSize} />
        ) : (
          <BookingRequestSentIcon size={resolvedIconSize} />
        )}
      </Box>
    </>
  );

  if (isInline) {
    return (
      <Tooltip title={tooltipLabel} placement="top">
        <Stack direction="row" alignItems="center" spacing={0.35} sx={sx}>
          {content}
        </Stack>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipLabel} placement="top">
      <Stack
        direction="row"
        alignItems="center"
        spacing={isCompact ? 0.35 : 0.5}
        sx={[
          isCompact
            ? {
                height: 20,
                borderRadius: "999px",
                border: `1px solid ${alpha(m.navy, 0.25)}`,
                bgcolor: alpha("#fff", 0.72),
                color: alpha(m.navy, 0.78),
                px: 0.65,
                flexShrink: 0,
                pointerEvents: "auto",
              }
            : {
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.25,
                py: 0.65,
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.04),
                border: `1px solid ${alpha(m.navy, 0.08)}`,
              },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {content}
      </Stack>
    </Tooltip>
  );
}

export function resolveBookingRequestBadgeState(
  event: Pick<{ status?: string; bookingScenario?: string }, "status" | "bookingScenario"> | null | undefined,
): BookingRequestBadgeState {
  if (!event || event.bookingScenario !== "BR") return "sent";
  if (event.status === "Confirmed" || event.status === "Completed") return "accepted";
  if (event.status === "Invalid") return "rejected";
  return "sent";
}
