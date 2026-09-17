"use client";

import * as React from "react";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import { DD } from "../../../../images";
import {
  ActivityTimelineGlyph,
  BookingDetailsGlyph,
  Bullet,
  LinkedSalesGlyph,
  MARKETING_CARD_SHADOW,
  MARKETING_CARD_SHADOW_INNER,
} from "./professionalFeaturesCardsShared";

export function CalendarSchedulingCard() {
  const tokens = useTheme().palette.mollure;
  const greenBg = tokens.statusGreenBg;
  const greenFg = tokens.statusGreenFg;

  const Mini = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: MARKETING_CARD_SHADOW_INNER,
        px: 1.8,
        py: 1.35,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        minHeight: 56,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.2,
          bgcolor: greenBg,
          color: greenFg,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: 11.5,
          color: alpha(tokens.navy, 0.62),
          lineHeight: 1.3,
        }}
      >
        {text}
      </Typography>
    </Paper>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: MARKETING_CARD_SHADOW,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(232, 251, 247, 0.85) 0%, rgba(255,255,255,0.94) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative blocks (top-right) */}
      <Box
        sx={{
          position: "absolute",
          right: 10,
          top: 10,
          width: 150,
          height: 150,
          display: { xs: "none", md: "block" },
          opacity: 0.92,
        }}
      >
        <Image
          src={DD}
          alt=""
          width={150}
          height={150}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ position: "relative", p: { xs: 2.4, md: 3 } }}>
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
            Calendar &amp; Scheduling
          </Typography>
        </Box>

        <Typography
          sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}
        >
          Manage Your Entire Schedule From One Central Place.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet color={greenFg}>
            Central calendar with a full overview of all bookings (online and
            offline)
          </Bullet>
          <Bullet color={greenFg}>Team scheduling with long-term availability planning</Bullet>
          <Bullet color={greenFg}>
            Time blocking for breaks, meetings, or unavailable periods
          </Bullet>
        </Stack>

        <Box
          sx={{
            mt: 2.1,
            border: `2px dashed ${alpha(greenFg, 0.45)}`,
            borderRadius: 2,
            bgcolor: alpha(greenBg, 0.7),
            p: 2,
          }}
        >
          <Bullet color={greenFg}>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Per-booking overview including:
            </Box>
          </Bullet>

          <Grid container spacing={2} sx={{ mt: 1.6 }}>
            <Grid item xs={12} md={4}>
              <Mini
                icon={<BookingDetailsGlyph />}
                text="Booking Details"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini
                icon={<LinkedSalesGlyph />}
                text="Linked Sales And Payment Activity"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini
                icon={<ActivityTimelineGlyph />}
                text="Complete Activity Timeline With Date- And Time-Stamped Actions"
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 2.2 }}>
          <Bullet color={greenFg}>
            Set your public hours and define booking preferences, including time
            intervals between appointments, service order logic and calendar
            appearance.
          </Bullet>
        </Box>
      </Box>
    </Paper>
  );
}
