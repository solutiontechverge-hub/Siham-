"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingEditTagVariant } from "./bookingRequestNegotiation";

const TAG_LABELS: Record<BookingEditTagVariant, string> = {
  edited: "Edited",
  client_edited: "Client edited",
};

type BookingEditedTagProps = {
  variant: BookingEditTagVariant;
};

export default function BookingEditedTag({ variant }: BookingEditedTagProps) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.75,
        py: 0.2,
        borderRadius: "999px",
        bgcolor: alpha(m.teal, 0.12),
        color: m.teal,
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          lineHeight: 1.2,
          color: "inherit",
        }}
      >
        {TAG_LABELS[variant]}
      </Typography>
    </Box>
  );
}
