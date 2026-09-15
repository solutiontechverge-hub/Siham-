"use client";

import * as React from "react";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import EuroOutlinedIcon from "@mui/icons-material/EuroOutlined";
import EventSeatRoundedIcon from "@mui/icons-material/EventSeatRounded";
import PersonPinCircleRoundedIcon from "@mui/icons-material/PersonPinCircleRounded";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import {
  CombinableServicesIcon,
  DD,
  ProjectBookingsIcon,
} from "../../../../images";
import {
  Bullet,
  MARKETING_CARD_SHADOW,
  MARKETING_CARD_SHADOW_INNER,
} from "./professionalFeaturesCardsShared";

export function BusinessSetupCard() {
  const tokens = useTheme().palette.mollure;

  const SmallCard = ({
    icon,
    title,
    description,
    filledIcon = false,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    filledIcon?: boolean;
  }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: MARKETING_CARD_SHADOW_INNER,
        px: 2,
        py: 1.7,
        display: "flex",
        alignItems: "center",
        gap: 1.4,
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.4,
          bgcolor: filledIcon ? "transparent" : tokens.teal,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          overflow: "hidden",
          "& img": filledIcon
            ? { width: "100%", height: "100%", objectFit: "cover", display: "block" }
            : undefined,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 13,
            color: tokens.navy,
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.25,
            fontSize: 10.5,
            color: alpha(tokens.navy, 0.46),
            lineHeight: 1.25,
          }}
        >
          {description}
        </Typography>
      </Box>
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
            "linear-gradient(180deg, rgba(218, 244, 255, 0.65) 0%, rgba(255,255,255,0.94) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative diamonds */}
      <Box
        sx={{
          position: "absolute",
          right: 12,
          top: 10,
          width: 160,
          height: 160,
          display: { xs: "none", md: "block" },
          opacity: 0.95,
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

      <Box sx={{ position: "relative", p: { xs: 2.4, md: 3 } }}>
        <Typography
          sx={{ fontWeight: 900, fontSize: 15.5, color: tokens.navy }}
        >
          Business Setup &amp; Professional Presence
        </Typography>
        <Typography
          sx={{ mt: 1.1, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}
        >
          Create A Professional Presence That Clearly Reflects Who You Are And
          How You Work.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet color={tokens.teal}>
            Choose whether you offer services at a Fixed Location, Desired
            Location, or both
          </Bullet>
          <Bullet color={tokens.teal}>
            Option to use the same content for both locations or manage them
            separately
          </Bullet>
          <Bullet color={tokens.teal}>
            Present your professional name, bio, cover images, and keywords
          </Bullet>
        </Stack>

        <Box sx={{ mt: 2.6 }}>
          <Bullet color={tokens.teal}>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Define your service locations:
            </Box>
          </Bullet>

          <Grid container spacing={2} sx={{ mt: 1.6 }}>
            <Grid item xs={12} md={6}>
              <SmallCard
                icon={<EventSeatRoundedIcon sx={{ fontSize: 18 }} />}
                title="Fixed Location"
                description="Provide Your Salon Or Workspace Address"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SmallCard
                icon={<PersonPinCircleRoundedIcon sx={{ fontSize: 18 }} />}
                title="Desired Location"
                description="Define Your Operating Areas (Nationwide Or Selected Provinces/Municipalities)"
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 2.25 }}>
          <Bullet color={tokens.teal}>
            Structure your services and sub-services with clear pricing
          </Bullet>
        </Box>

        <Box
          sx={{
            mt: 2.1,
            border: `2px dashed ${alpha(tokens.teal, 0.55)}`,
            borderRadius: 2,
            bgcolor: alpha("#fff", 0.7),
            p: 2,
          }}
        >
          <Bullet color={tokens.teal}>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Enable optional booking features:
            </Box>
          </Bullet>

          <Grid container spacing={2} sx={{ mt: 1.6 }}>
            <Grid item xs={12} md={6}>
              <SmallCard
                filledIcon
                icon={
                  <Image
                    src={CombinableServicesIcon}
                    alt=""
                    width={34}
                    height={34}
                  />
                }
                title="Combinable Services"
                description="(Fixed Location Only)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SmallCard
                filledIcon
                icon={
                  <Image
                    src={ProjectBookingsIcon}
                    alt=""
                    width={34}
                    height={34}
                  />
                }
                title="Project Bookings"
                description="(Desired Location Only, For Business Clients)"
              />
            </Grid>
          </Grid>
        </Box>

        <Stack spacing={1.35} sx={{ mt: 2.2 }}>
          <Bullet color={tokens.teal}>
            Add team members and define which services they provide
          </Bullet>
          <Bullet color={tokens.teal}>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Display key business information on your profile:
            </Box>
          </Bullet>
        </Stack>

        <Grid container spacing={1.5} sx={{ mt: 1.4, pl: 3.75 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.1}>
              {(
                [
                  {
                    label: "Price Range",
                    icon: (
                      <EuroOutlinedIcon
                        sx={{ fontSize: 16, color: tokens.teal, flexShrink: 0 }}
                      />
                    ),
                  },
                  {
                    label: "Kilometer Allowance For On-Location Services",
                    icon: (
                      <FormatListBulletedOutlinedIcon
                        sx={{ fontSize: 16, color: tokens.teal, flexShrink: 0 }}
                      />
                    ),
                  },
                ] as const
              ).map((item) => (
                <Stack
                  key={item.label}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  {item.icon}
                  <Typography
                    sx={{
                      color: alpha(tokens.navy, 0.6),
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.1}>
              {(
                [
                  {
                    label:
                      "Policies (Response Time, Cancellation, Rescheduling, No-Show)",
                    icon: (
                      <PlaceOutlinedIcon
                        sx={{ fontSize: 16, color: tokens.teal, flexShrink: 0 }}
                      />
                    ),
                  },
                  {
                    label: "Prepayment Requirements (If Applicable)",
                    icon: (
                      <FolderOutlinedIcon
                        sx={{ fontSize: 16, color: tokens.teal, flexShrink: 0 }}
                      />
                    ),
                  },
                ] as const
              ).map((item) => (
                <Stack
                  key={item.label}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  {item.icon}
                  <Typography
                    sx={{
                      color: alpha(tokens.navy, 0.6),
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 1.8 }}>
          <Bullet color={tokens.teal}>
            Showcase your work with a portfolio of images visible on your public
            profile
          </Bullet>
        </Box>
      </Box>
    </Paper>
  );
}
