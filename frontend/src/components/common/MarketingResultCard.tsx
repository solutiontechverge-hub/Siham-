"use client";

import * as React from "react";
import { Box, Card, CardContent } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { MarketingFeatureCardIconKey } from "./MarketingFeatureCard";
import { getMarketingFeatureIcon } from "./MarketingFeatureCard";
import { BodyText, CardTitle } from "../ui/typography";

export type MarketingResultCardProps = {
  iconKey: MarketingFeatureCardIconKey;
  title: string;
  description: string;
};

export default function MarketingResultCard({
  iconKey,
  title,
  description,
}: MarketingResultCardProps) {
  const m = useTheme().palette.mollure;

  const icon = getMarketingFeatureIcon(iconKey);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "12px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.10)}`,
        boxShadow: "0 14px 26px rgba(16, 35, 63, 0.10)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: alpha(m.teal, 0.10),
            color: m.teal,
            display: "grid",
            placeItems: "center",
            mb: 1.4,
          }}
        >
          {icon}
        </Box>
        <CardTitle
          sx={{
            fontSize: 13.5,
            lineHeight: 1.25,
          }}
        >
          {title}
        </CardTitle>
        <BodyText
          sx={{
            mt: 1,
            color: alpha(m.navy, 0.55),
            fontSize: 11.5,
            lineHeight: 1.6,
          }}
        >
          {description}
        </BodyText>
      </CardContent>
    </Card>
  );
}

