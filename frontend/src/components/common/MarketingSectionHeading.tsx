"use client";

import * as React from "react";
import { Stack, Typography } from "@mui/material";

type MarketingSectionHeadingProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center" | "right";
  mb?: number;
};

export default function MarketingSectionHeading({
  title,
  subtitle,
  align = "center",
  mb = 5,
}: MarketingSectionHeadingProps) {
  return (
    <Stack spacing={1.25} sx={{ mb }} textAlign={align}>
      <Typography
        component="h2"
        sx={{
          fontWeight: 600,
          color: "mollure.textcolorgrey700",
          fontSize: { xs: "2rem", md: "2.6rem" },
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography
          sx={{
            fontWeight: 400,
            color: "mollure.bodyText",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            lineHeight: 1.7,
            maxWidth: align === "center" ? 820 : undefined,
            mx: align === "center" ? "auto" : undefined,
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}

