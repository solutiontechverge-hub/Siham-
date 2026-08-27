"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingEditTagVariant } from "./bookingRequestNegotiation";

const TAG_LABELS: Record<BookingEditTagVariant, string> = {
  edited: "Edited",
  client_edited: "Edited",
  added: "Edited Added",
  cancelled: "Service Cancelled",
  updated: "Updated",
};

type BookingEditedTagProps = {
  variant: BookingEditTagVariant;
};

export default function BookingEditedTag({ variant }: BookingEditedTagProps) {
  const m = useTheme().palette.mollure;
  const isCancelled = variant === "cancelled";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.3,
        borderRadius: "999px",
        bgcolor: isCancelled ? m.statusRedBg : alpha(m.teal, 0.14),
        color: isCancelled ? m.statusRedFg : m.teal,
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
        {TAG_LABELS[variant]}
      </Typography>
    </Box>
  );
}
