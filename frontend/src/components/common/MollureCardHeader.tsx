"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText, SubHeading } from "../ui/typography";

export type MollureCardHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: "default" | "tinted";
};

export default function MollureCardHeader({ title, subtitle, tone = "default" }: MollureCardHeaderProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box
      sx={{
        px: 2.25,
        py: 1.75,
        bgcolor: tone === "tinted" ? m.surface : "transparent",
      }}
    >
      <SubHeading sx={{ color: alpha(m.navy, 0.88) }}>{title}</SubHeading>
      {subtitle ? (
        <BodyText sx={{ mt: 0.4, color: alpha(m.navy, 0.55) }}>
          {subtitle}
        </BodyText>
      ) : null}
    </Box>
  );
}

