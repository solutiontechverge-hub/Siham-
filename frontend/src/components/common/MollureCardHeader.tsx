"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  mollurePageSubtitleSx,
  mollurePageTitleSx,
} from "../../theme/mollureHierarchy";
import { BodyText, SubHeading } from "../ui/typography";

export type MollureCardHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: "default" | "tinted";
};

export default function MollureCardHeader({
  title,
  subtitle,
  tone = "default",
}: MollureCardHeaderProps) {
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
      <SubHeading sx={mollurePageTitleSx(m.navy)}>{title}</SubHeading>
      {subtitle ? (
        <BodyText sx={mollurePageSubtitleSx(m.navy, { mt: 0.4, lineHeight: 1.4 })}>
          {subtitle}
        </BodyText>
      ) : null}
    </Box>
  );
}
