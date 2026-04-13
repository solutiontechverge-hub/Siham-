"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import { Description, MainHeading } from "../ui/typography";

type MarketingSectionHeadingProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center" | "right";
  mb?: ResponsiveStyleValue<number>;
};

export default function MarketingSectionHeading({
  title,
  subtitle,
  align = "center",
  mb = 5,
}: MarketingSectionHeadingProps) {
  return (
    <Stack
      spacing={1.25}
      sx={{
        mb,
        textAlign: align,
        alignItems:
          align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <MainHeading
        sx={{
          fontSize: { xs: "2rem", md: "2.6rem" },
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          textAlign: align,
        }}
      >
        {title}
      </MainHeading>
      {subtitle ? (
        <Description
          sx={{
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            lineHeight: 1.7,
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
