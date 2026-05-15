"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Small inline separator dot used between time range and duration labels. */
export function MollureMetaDot() {
  const m = useTheme().palette.mollure;

  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: 4,
        height: 4,
        borderRadius: "999px",
        bgcolor: alpha(m.navy, 0.35),
        flexShrink: 0,
      }}
    />
  );
}
