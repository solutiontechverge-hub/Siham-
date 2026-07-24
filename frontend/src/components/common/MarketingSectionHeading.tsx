"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import { Description, MainHeading } from "../ui/typography";
import {
  MOLLURE_HEADING_BODY_GAP,
  MOLLURE_HEADING_BODY_GAP_PX,
} from "../../theme/spacing";

type MarketingSectionHeadingProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center" | "right";
  mb?: ResponsiveStyleValue<number | string>;
};

export default function MarketingSectionHeading({
  title,
  subtitle,
  align = "center",
  mb = MOLLURE_HEADING_BODY_GAP,
}: MarketingSectionHeadingProps) {
  return (
    <Stack
      spacing={MOLLURE_HEADING_BODY_GAP}
      sx={{
        mb,
        textAlign: align,
        alignItems:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
      }}
    >
      <MainHeading sx={{ textAlign: align }}>{title}</MainHeading>
      {subtitle ? (
        <Description
          sx={{
            textAlign: align,
            maxWidth: align === "center" ? 820 : undefined,
            mx: align === "center" ? "auto" : undefined,
          }}
        >
          {subtitle}
        </Description>
      ) : null}
    </Stack>
  );
}
