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
import { useListingTokens } from "../../../app/clients/listing/listing.use";
import { DesiredLocationIcon, FixedLocationIcon } from "../../../../images";

export function ListingCard({
  item,
  isFavorite,
  onToggleFavorite,
}: {
  item: ListingCardData;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const tokens = useListingTokens();
  const [mode, setMode] = React.useState<"fixed" | "desired">(item.locationModeDefault);

  return (
    <AppCard
      sx={{
        overflow: "hidden",
        borderRadius: 2.5,
        backgroundColor: "#fff",
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "0 10px 22px rgba(16, 24, 40, 0.08)",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "relative", height: 170 }}>
          <Image src={item.image} alt={item.title} fill priority={false} style={{ objectFit: "cover" }} />
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
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
            "&:hover": { bgcolor: "#fff" },
          }}
          aria-label="Toggle favorite"
        >
          {isFavorite ? (
            <FavoriteRoundedIcon sx={{ color: tokens.teal, fontSize: 18 }} />
          ) : (
            <FavoriteBorderRoundedIcon sx={{ color: alpha(tokens.navy, 0.55), fontSize: 18 }} />
          )}
        </IconButton>
      </Box>

      <CardContent sx={{ p: 2.25 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography sx={{ fontWeight: 900, color: tokens.navy, fontSize: 13, lineHeight: 1.25 }}>
              {item.title}
            </Typography>
            <Typography sx={{ fontWeight: 800, color: tokens.navy, fontSize: 12, opacity: 0.9 }}>
              {item.subtitle}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: tokens.slate }}>
            <Typography sx={{ fontSize: 12 }}>{item.municipalityLabel}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarRoundedIcon key={i} sx={{ fontSize: 14, color: tokens.star }} />
              ))}
              <Typography sx={{ fontSize: 11, color: tokens.slate, ml: 0.5 }}>{item.reviewsCount} Reviews</Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "flex",
              border: `1px solid ${tokens.border}`,
              borderRadius: 999,
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            <Button
              onClick={() => setMode("fixed")}
              sx={{
                flex: 1,
                py: 0.6,
                textTransform: "none",
                fontWeight: 900,
                fontSize: 12,
                borderRadius: 0,
                color: mode === "fixed" ? "#fff" : tokens.teal,
                bgcolor: mode === "fixed" ? tokens.teal : "transparent",
                "&:hover": { bgcolor: mode === "fixed" ? tokens.tealDark : "rgba(33, 184, 191, 0.08)" },
              }}
              startIcon={
                <Image
                  src={FixedLocationIcon}
                  alt="Fixed location"
                  width={14}
                  height={14}
                  style={{ filter: mode === "fixed" ? "brightness(0) invert(1)" : "none" }}
                />
              }
            >
              Fixed Location
            </Button>
            <Divider orientation="vertical" flexItem sx={{ borderColor: tokens.border }} />
            <Button
              onClick={() => setMode("desired")}
              sx={{
                flex: 1,
                py: 0.6,
                textTransform: "none",
                fontWeight: 900,
                fontSize: 12,
                borderRadius: 0,
                color: mode === "desired" ? "#fff" : tokens.teal,
                bgcolor: mode === "desired" ? tokens.teal : "transparent",
                "&:hover": { bgcolor: mode === "desired" ? tokens.tealDark : "rgba(33, 184, 191, 0.08)" },
              }}
              startIcon={
                <Image
                  src={DesiredLocationIcon}
                  alt="Desired location"
                  width={14}
                  height={14}
                  style={{ filter: mode === "desired" ? "brightness(0) invert(1)" : "none" }}
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
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: tokens.navy }}>{svc.name}</Typography>
                    {svc.durationLabel ? (
                      <Typography sx={{ fontSize: 11, color: tokens.slate }}>{svc.durationLabel}</Typography>
                    ) : null}
                  </Box>
                  <Typography sx={{ fontSize: 11, color: tokens.slate, whiteSpace: "nowrap" }}>
                    {svc.priceLabel}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </AppCard>
  );
}

