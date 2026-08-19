"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function CompanyClientTag({
  variant = "pill",
}: {
  variant?: "pill" | "dot";
}) {
  const m = useTheme().palette.mollure;
  const isDot = variant === "dot";

  return (
    <Box
      component="span"
      aria-label="Company Client"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        height: isDot ? 22 : 20,
        minWidth: isDot ? 22 : 22,
        px: isDot ? 0 : 0.65,
        borderRadius: "999px",
        bgcolor: alpha(m.teal, isDot ? 0.2 : 0.16),
        color: m.teal,
        border: `1px solid ${alpha(m.teal, 0.4)}`,
        fontSize: isDot ? 10 : 9.5,
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      CC
    </Box>
  );
}
