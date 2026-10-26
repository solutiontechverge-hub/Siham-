"use client";

import { Box, Typography } from "@mui/material";
import { BOOKING_STATUS_THEME } from "./bookingStatus";

/** True when this person was selected in the No Show modal (ids in notes meta). */
export function isParticipantMarkedNoShow(
  participantId: string | null | undefined,
  noShowParticipantIds?: readonly string[] | null,
): boolean {
  const id = String(participantId ?? "").trim();
  if (!id || !noShowParticipantIds?.length) return false;
  return noShowParticipantIds.some((row) => String(row) === id);
}

/** Compact “No Show” pill beside a participant name (pro + client). */
export default function BookingNoShowTag() {
  const theme = BOOKING_STATUS_THEME["No Show"];
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.3,
        borderRadius: "999px",
        bgcolor: theme.chipBg,
        color: theme.chipColor,
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          lineHeight: 1.2,
          color: "inherit",
        }}
      >
        No Show
      </Typography>
    </Box>
  );
}
