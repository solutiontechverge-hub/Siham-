"use client";

import * as React from "react";
import { Paper, type PaperProps } from "@mui/material";

export default function AppCard({ sx, ...props }: PaperProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "28px",
        border: "1px solid rgba(16, 35, 63, 0.08)",
        backgroundColor: "rgba(255,255,255,0.9)",
        boxShadow: "0 24px 80px rgba(16, 35, 63, 0.10)",
        ...sx,
      }}
      {...props}
    />
  );
}
