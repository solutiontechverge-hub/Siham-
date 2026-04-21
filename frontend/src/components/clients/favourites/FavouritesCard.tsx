"use client";

import * as React from "react";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, Button, CardContent, Divider, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import { AppCard } from "../../common";
import type { ListingCardData } from "../../../app/clients/listing/listing.data";
import { DesiredLocationIcon, FixedLocationIcon } from "../../../../images";

export function FavouritesCard({
  item,
  isFavorite,
  onToggleFavorite,
  borderColor,
  cardBorder,
  navy,
  teal,
  tealDark,
  slate,
  star,
}: {
  item: ListingCardData;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  borderColor: string;
  cardBorder: string;
  navy: string;
  teal: string;
  tealDark: string;
  slate: string;
  star: string;
}) {
  return (
    <AppCard
      sx={{
        overflow: "hidden",
        borderRadius: 2.5,
        backgroundColor: "#fff",
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 10px 22px rgba(16, 24, 40, 0.08)",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "relative", height: 170 }}>
          <Image src={item.image} alt={item.title} fill style={{ objectFit: "cover" }} />
        </Box>

        <IconButton
          onClick={onToggleFavorite}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 34,
            height: 34,
            bgcolor: "rgba(255,255,255,0.9)",
            border: `1px solid ${borderColor}`,
            boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
            "&:hover": { bgcolor: "#fff" },
          }}
          aria-label="Toggle favorite"
        >
          {isFavorite ? (
            <FavoriteRoundedIcon sx={{ color: teal, fontSize: 18 }} />
          ) : (
            <FavoriteBorderRoundedIcon sx={{ color: alpha(navy, 0.55), fontSize: 18 }} />
          )}
        </IconButton>
      </Box>

      <CardContent sx={{ p: 2.25 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography sx={{ fontWeight: 900, color: navy, fontSize: 13, lineHeight: 1.25 }}>{item.title}</Typography>
            <Typography sx={{ fontWeight: 800, color: navy, fontSize: 12, opacity: 0.9 }}>{item.subtitle}</Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: slate }}>
            <Typography sx={{ fontSize: 12 }}>{item.municipalityLabel}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarRoundedIcon key={i} sx={{ fontSize: 14, color: star }} />
              ))}
              <Typography sx={{ fontSize: 11, color: slate, ml: 0.5 }}>{item.reviewsCount} Reviews</Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "flex",
              border: `1px solid ${borderColor}`,
              borderRadius: 999,
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            <Button
              sx={{
                flex: 1,
                py: 0.6,
                textTransform: "none",
                fontWeight: 900,
                fontSize: 12,
                borderRadius: 0,
                color: item.locationModeDefault === "fixed" ? "#fff" : teal,
                bgcolor: item.locationModeDefault === "fixed" ? teal : "transparent",
                "&:hover": {
                  bgcolor:
                    item.locationModeDefault === "fixed" ? tealDark : "rgba(33, 184, 191, 0.08)",
                },
              }}
              startIcon={
                <Image
                  src={FixedLocationIcon}
                  alt="Fixed location"
                  width={14}
                  height={14}
                  style={{
                    filter: item.locationModeDefault === "fixed" ? "brightness(0) invert(1)" : "none",
                  }}
                />
              }
            >
              Fixed Location
            </Button>
            <Divider orientation="vertical" flexItem sx={{ borderColor }} />
            <Button
              sx={{
                flex: 1,
                py: 0.6,
                textTransform: "none",
                fontWeight: 900,
                fontSize: 12,
                borderRadius: 0,
                color: item.locationModeDefault === "desired" ? "#fff" : teal,
                bgcolor: item.locationModeDefault === "desired" ? teal : "transparent",
                "&:hover": {
                  bgcolor:
                    item.locationModeDefault === "desired" ? tealDark : "rgba(33, 184, 191, 0.08)",
                },
              }}
              startIcon={
                <Image
                  src={DesiredLocationIcon}
                  alt="Desired location"
                  width={14}
                  height={14}
                  style={{
                    filter: item.locationModeDefault === "desired" ? "brightness(0) invert(1)" : "none",
                  }}
                />
              }
            >
              Desired Location
            </Button>
          </Box>

          <Box sx={{ pt: 0.5 }}>
            <Stack spacing={0.85}>
              {item.services.map((svc, idx) => (
                <Stack
                  key={`${svc.name}-${idx}`}
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: navy }}>{svc.name}</Typography>
                    {svc.durationLabel ? (
                      <Typography sx={{ fontSize: 11, color: slate }}>{svc.durationLabel}</Typography>
                    ) : null}
                  </Box>
                  <Typography sx={{ fontSize: 11, color: slate, whiteSpace: "nowrap" }}>{svc.priceLabel}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </AppCard>
  );
}

