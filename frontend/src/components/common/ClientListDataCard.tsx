"use client";

import * as React from "react";
import { Box, Paper, type PaperProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type ClientListDataCardProps = PaperProps;

export default function ClientListDataCard({ sx, children, ...rest }: ClientListDataCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: `1px solid ${alpha(m.navy, 0.06)}`,
        bgcolor: "#FFFFFF",
        overflow: "hidden",
        ...sx,
      }}
      {...rest}
    >
      <Box sx={{ px: 2.25, py: 1.9 }}>{children}</Box>
    </Paper>
  );
}

