"use client";

import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Paper, Typography } from "@mui/material";
import { mollureSectionTitleSx } from "../../../theme/mollureHierarchy";

export function PublicProfilePageShell({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        bgcolor: "#fff",
        overflow: "hidden",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
      }}
    >
      {children}
    </Paper>
  );
}

export function PublicProfileTopBar({ title }: { title: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
        mb: 2,
      }}
    >
      <Box
        sx={{
          mx: { xs: 1.5, md: 2 },
          my: { xs: 1.5, md: 1.75 },
          px: { xs: 1.75, md: 2 },
          py: { xs: 1.25, md: 1.5 },
          borderRadius: "8px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: m.fxGrayF2F4F7,
        }}
      >
        <Typography sx={mollureSectionTitleSx(m.navy)}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}
