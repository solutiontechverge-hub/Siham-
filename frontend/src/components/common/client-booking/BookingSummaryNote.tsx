"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function BookingSummaryNote({ note }: { note?: string | null }) {
  const m = useTheme().palette.mollure;
  const text = note?.trim() ?? "";
  if (!text) return null;

  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: 12,
          color: alpha(m.navy, 0.78),
          mb: 0.75,
        }}
      >
        Note
      </Typography>
      <Box
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.06)}`,
          px: 1.2,
          py: 0.9,
          bgcolor: alpha(m.navy, 0.02),
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.72),
            lineHeight: 1.35,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
}
