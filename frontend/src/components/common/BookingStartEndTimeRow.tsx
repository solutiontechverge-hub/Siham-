"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { Box, type SxProps, type Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import {
  fmtTimeLabel,
  parseClockToMinutes,
} from "./calendar/calendar.utils";

/** Normalize start/end clock strings to `HH:MM-HH:MM`, or null if either is missing. */
export function bookingStartEndRangeLabel(
  start?: string | null,
  end?: string | null,
): string | null {
  const startMin = start?.trim() ? parseClockToMinutes(start.trim()) : null;
  const endMin = end?.trim() ? parseClockToMinutes(end.trim()) : null;
  if (startMin == null || endMin == null) return null;
  return `${fmtTimeLabel(startMin)}-${fmtTimeLabel(endMin)}`;
}

type Props = {
  start?: string | null;
  end?: string | null;
  sx?: SxProps<Theme>;
};

/** Light grey row under Status: clock + "Start and end time booking {start}-{end}". */
export default function BookingStartEndTimeRow({ start, end, sx }: Props) {
  const m = useTheme().palette.mollure;
  const range = bookingStartEndRangeLabel(start, end);
  if (!range) return null;

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
        Start and end time booking {range}
      </BodyText>
    </Box>
  );
}
