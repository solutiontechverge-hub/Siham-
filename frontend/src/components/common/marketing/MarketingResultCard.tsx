"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Card, CardContent } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ProfessionalResultIconKey } from "../../../app/professionals/professionals.data";
import { BodyText, CardTitle } from "../../ui/typography";

export type MarketingResultCardProps = {
  iconKey: ProfessionalResultIconKey;
  title: string;
  description: string;
};

const RESULT_ICONS: Record<
  ProfessionalResultIconKey,
  { src: string; alt: string }
> = {
  moreTime: {
    src: "/professionals/results/more-time.png",
    alt: "More time",
  },
  moreBookings: {
    src: "/professionals/results/more-bookings.png",
    alt: "More bookings",
  },
  onePlace: {
    src: "/professionals/results/one-place.png",
    alt: "Everything in one place",
  },
};

export default function MarketingResultCard({
  iconKey,
  title,
  description,
}: MarketingResultCardProps) {
  const m = useTheme().palette.mollure;
  const icon = RESULT_ICONS[iconKey];

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "12px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        boxShadow: "0 14px 26px rgba(16, 35, 63, 0.10)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            mb: 1.4,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <Image
            src={icon.src}
            alt={icon.alt}
            fill
            sizes="40px"
            style={{ objectFit: "contain" }}
          />
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
