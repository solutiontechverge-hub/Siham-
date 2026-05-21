"use client";

import * as React from "react";
import { Box, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Typography } from "../ui/typography";

type ClientListHeaderCardProps = {
  title: string;
  subtitle?: string;
};

export default function ClientListHeaderCard({ title, subtitle }: ClientListHeaderCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: `1px solid ${alpha(m.navy, 0.06)}`,
        bgcolor: alpha(m.navy, 0.015),
        px: 2.5,
        py: 1.9,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontWeight: 900,
            color: alpha(m.navy, 0.9),
            fontSize: 20,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            sx={{
              mt: 0.4,
              color: alpha(m.navy, 0.6),
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}

