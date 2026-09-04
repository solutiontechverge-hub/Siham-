"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function CompanyClientTag(_props?: {
  variant?: "pill" | "dot";
}) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      component="span"
      aria-label="Business Client"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        height: 18,
        px: 0.85,
        borderRadius: "999px",
        bgcolor: alpha(m.teal, 0.12),
        color: m.teal,
        border: `1px solid ${alpha(m.teal, 0.28)}`,
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      BC
    </Box>
  );
}
