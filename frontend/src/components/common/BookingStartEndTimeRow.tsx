"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { Box, type SxProps, type Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import {
  fmtTimeLabel,
  parseClockToMinutes,
} from "./calendar/calendar.utils";

/**
 * Normalize clocks for the status row.
 * Start only when end is missing; full `HH:MM-HH:MM` when both parse.
 */
export function bookingStartEndRangeLabel(
  start?: string | null,
  end?: string | null,
): string | null {
  const startMin = start?.trim() ? parseClockToMinutes(start.trim()) : null;
  if (startMin == null) return null;
  const endMin = end?.trim() ? parseClockToMinutes(end.trim()) : null;
  if (endMin == null) return fmtTimeLabel(startMin);
  return `${fmtTimeLabel(startMin)}-${fmtTimeLabel(endMin)}`;
}

type Props = {
  start?: string | null;
  /** Omit (or empty) on empty new booking — do not invent a placeholder end. */
  end?: string | null;
  sx?: SxProps<Theme>;
};

/** Light grey row under Status: clock + start (or start–end) booking times. */
export default function BookingStartEndTimeRow({ start, end, sx }: Props) {
  const m = useTheme().palette.mollure;
  const range = bookingStartEndRangeLabel(start, end);
  if (!range) return null;
  const hasEnd = Boolean(end?.trim() && parseClockToMinutes(end.trim()) != null);
  const prefix = hasEnd
    ? "Start and end time booking"
    : "Start time booking";

  return (
    <Box
      sx={[
        {
          width: "100%",
          borderRadius: "10px",
          minHeight: 40,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 0.85,
          bgcolor: alpha(m.navy, 0.04),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <AccessTimeOutlinedIcon
        sx={{ fontSize: 18, color: alpha(m.navy, 0.45), flexShrink: 0 }}
      />
      <BodyText
        sx={{
          m: 0,
          fontSize: 13,
          fontWeight: 700,
          color: alpha(m.navy, 0.55),
          lineHeight: 1.25,
        }}
      >
        {prefix} {range}
      </BodyText>
    </Box>
  );
}
