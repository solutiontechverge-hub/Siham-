"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import { DD } from "../../../../images";
import {
  Bullet,
  MARKETING_CARD_SHADOW,
  MARKETING_CARD_SHADOW_INNER,
} from "./professionalFeaturesCardsShared";

export function AnalyticsPerformanceCard() {
  const tokens = useTheme().palette.mollure;


  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: alpha(tokens.teal, 0.06),
        boxShadow: MARKETING_CARD_SHADOW,
      }}
    >
      {/* Decorative diamonds (top-right) */}
      <Box
        sx={{
          position: "absolute",
          right: 12,
          top: 10,
          width: 160,
          height: 160,
          display: { xs: "none", md: "block" },
          pointerEvents: "none",
          opacity: 0.9,
        }}
      >
        <Image
          src={DD}
          alt=""
          width={160}
          height={160}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: MARKETING_CARD_SHADOW_INNER,
          }}
        >
          <Typography
            sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}
          >
            Analytics &amp; Performance
          </Typography>
        </Box>

        <Typography
          sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}
        >
          Track Performance And Make Informed Decisions.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet color={tokens.teal}>Booking &amp; operational analytics</Bullet>
          <Bullet color={tokens.teal}>Sales volume analytics</Bullet>
          <Bullet color={tokens.teal}>Performance analytics</Bullet>
          <Bullet color={tokens.teal}>Ratings &amp; reviews analytics</Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}
