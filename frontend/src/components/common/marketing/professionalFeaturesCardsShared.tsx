"use client";

import * as React from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Stack, SvgIcon, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Elevation aligned with how-it-works / ContentCard sections (softer than 16px stack shadows). */
export const MARKETING_CARD_SHADOW = "0 10px 28px rgba(16, 35, 63, 0.10)";
export const MARKETING_CARD_SHADOW_INNER = "0 10px 28px rgba(16, 35, 63, 0.08)";

export function Bullet({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  const navy = useTheme().palette.mollure.navy;
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <CheckCircleOutlineIcon
        sx={{ fontSize: 18, color, flexShrink: 0 }}
      />
      <Typography
        sx={{
          color: alpha(navy, 0.72),
          fontSize: 13.5,
          lineHeight: 1.7,
        }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

export function BookingDetailsGlyph({ fontSize = 16 }: { fontSize?: number }) {
  return (
    <SvgIcon sx={{ fontSize }} viewBox="0 0 24 24">
      <rect x="4" y="5" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="10" y="5.5" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="10" y="8" width="7" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="4" y="14" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="10" y="14.5" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="10" y="17" width="7" height="1.5" rx="0.75" fill="currentColor" />
    </SvgIcon>
  );
}

export function LinkedSalesGlyph({ fontSize = 16 }: { fontSize?: number }) {
  return (
    <SvgIcon sx={{ fontSize }} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 3.2 18.8 7.2v9.6L12 20.8 5.2 16.8V7.2L12 3.2ZM8.2 13.2h1.8v3.2H8.2v-3.2Zm2.9-2.2h1.8v5.4h-1.8V11Zm2.9-2.4h1.8v7.8H14V8.6Z"
      />
    </SvgIcon>
  );
}

export function ActivityTimelineGlyph({ fontSize = 16 }: { fontSize?: number }) {
  return (
    <SvgIcon sx={{ fontSize }} viewBox="0 0 24 24">
      <path
        d="M5 14.5L9 8.5L13 13.5L19 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="14.5" r="1.7" fill="currentColor" />
      <circle cx="9" cy="8.5" r="1.7" fill="currentColor" />
      <circle cx="13" cy="13.5" r="1.7" fill="currentColor" />
      <circle cx="19" cy="6.5" r="1.7" fill="currentColor" />
    </SvgIcon>
  );
}
