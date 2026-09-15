"use client";

import * as React from "react";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import {
  BookingRequestIcon,
  EditConfirmedIcon,
  EditedBookingIcon,
} from "../../../../images";
import {
  Bullet,
  MARKETING_CARD_SHADOW,
  MARKETING_CARD_SHADOW_INNER,
} from "./professionalFeaturesCardsShared";

export function InteractiveBookingFlowCard() {
  const tokens = useTheme().palette.mollure;

  const orange = tokens.star; // theme-based orange/yellow accent

  const Mini = ({
    icon,
    title,
    filledIcon = false,
  }: {
    icon: React.ReactNode;
    title: string;
    filledIcon?: boolean;
  }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1.6,
        border: `1px solid ${alpha(tokens.navy, 0.08)}`,
        bgcolor: "#fff",
        boxShadow: MARKETING_CARD_SHADOW_INNER,
        px: 2,
        py: 1.2,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        minHeight: 54,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.2,
          bgcolor: filledIcon ? "transparent" : orange,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          overflow: "hidden",
          "& img": filledIcon
            ? {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }
            : undefined,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 800,
          color: alpha(tokens.navy, 0.82),
          lineHeight: 1.25,
          maxWidth: 230,
        }}
      >
        {title}
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
          bgcolor: alpha(orange, 0.12),
          pointerEvents: "none",
        }}
      />

      {/* Decorative circles (top-right) */}
      <Box
        sx={{
          position: "absolute",
          right: -18,
          top: -30,
          width: 150,
          height: 150,
          display: { xs: "none", md: "block" },
          pointerEvents: "none",
          opacity: 0.35,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `20px solid ${alpha(orange, 0.18)}`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 26,
            borderRadius: "50%",
            border: `18px solid ${alpha(orange, 0.14)}`,
          }}
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
            Interactive Booking Flow
          </Typography>
        </Box>

        <Typography
          sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}
        >
          Handle Online Bookings Through A Structured, Fair Approval Process.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet color={orange}>
            Online bookings follow Mollure&apos;s interactive booking flow when
            confirmation is required
          </Bullet>
        </Stack>

        <Box
          sx={{
            mt: 2.1,
            border: `2px dashed ${alpha(orange, 0.8)}`,
            borderRadius: 2,
            bgcolor: alpha(orange, 0.08),
            p: 2.1,
          }}
        >
          <Bullet color={orange}>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Support for:
            </Box>
          </Bullet>

          <Grid container spacing={1.8} sx={{ mt: 1.5 }}>
            <Grid item xs={12} md={4}>
              <Mini
                filledIcon
                icon={
                  <Image
                    src={BookingRequestIcon}
                    alt=""
                    width={28}
                    height={28}
                  />
                }
                title="Booking Request"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini
                filledIcon
                icon={
                  <Image
                    src={EditedBookingIcon}
                    alt=""
                    width={28}
                    height={28}
                  />
                }
                title="Edited Booking"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini
                filledIcon
                icon={
                  <Image
                    src={EditConfirmedIcon}
                    alt=""
                    width={28}
                    height={28}
                  />
                }
                title="Edit Confirmed"
              />
            </Grid>
          </Grid>
        </Box>

        <Stack spacing={1.35} sx={{ mt: 2.2 }}>
          <Bullet color={orange}>Clear comparison of changes before approval</Bullet>
          <Bullet color={orange}>
            Ability to accept, edit, or reject requests with full transparency
          </Bullet>
          <Bullet color={orange}>
            Major changes always require approval from the other party
          </Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}
