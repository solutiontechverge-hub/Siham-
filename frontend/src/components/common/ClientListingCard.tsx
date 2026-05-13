"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, Button, CardContent, Divider, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import type { ListingCardData } from "../../app/clients/listing/listing.data";
import AppCard from "./AppCard";

export type ClientListingCardProps = {
  item: ListingCardData;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function ClientListingCard({ item, isFavorite, onToggleFavorite }: ClientListingCardProps) {
  const tokens = useTheme().palette.mollure;
  const router = useRouter();
  const [mode, setMode] = React.useState<"fixed" | "desired">(item.locationModeDefault);

  const onOpenBooking = () => {
    try {
      const payload = {
        shopId: item.id,
        shopName: `${item.title} ${item.subtitle}`.trim(),
        municipalityLabel: item.municipalityLabel,
        addressLabel: item.addressLabel,
        locationMode: mode,
      };
      window.localStorage.setItem("mollure:selected_shop", JSON.stringify(payload));
    } catch {
      // ignore
    }
    router.push("/clients/booking?mode=create");
  };

  return (
    <AppCard
      sx={{
        overflow: "hidden",
        borderRadius: 2.5,
        backgroundColor: "#fff",
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "0 10px 22px rgba(16, 24, 40, 0.08)",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-1px)" },
      }}
      onClick={onOpenBooking}
    >
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "relative", height: 170 }}>
          <Image src={item.image} alt={item.title} fill priority={false} style={{ objectFit: "cover" }} />
        </Box>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
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

        {/* Carousel dots (visual only) */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 10,
            display: "flex",
            justifyContent: "center",
            gap: 0.75,
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: 999,
                bgcolor: i === 1 ? "#fff" : "rgba(255,255,255,0.55)",
                border: i === 1 ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(0,0,0,0.08)",
              }}
            />
          ))}
        </Box>
      </Box>

      <CardContent sx={{ p: 2.25 }}>
        <Stack spacing={1.4} sx={{ textAlign: "center" }}>
          <Box sx={{ color: alpha(tokens.navy, 0.5), fontSize: 13, lineHeight: 1.2 }}>
            Lorem Ipsum | Lorem | Lorem Ipsum
          </Box>
          <Box sx={{ color: alpha(tokens.navy, 0.5), fontSize: 13, lineHeight: 1.2 }}>
            Lorem Ipsum | Lorem | Lorem Ipsum
          </Box>

          <Typography sx={{ fontWeight: 400, color: alpha(tokens.navy, 0.78), fontSize: 18, lineHeight: 1.35 }}>
            {item.title} {item.subtitle}
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
            <LocationOnOutlinedIcon sx={{ fontSize: 16, color: alpha(tokens.navy, 0.55) }} />
            <Typography sx={{ fontSize: 13, color: alpha(tokens.navy, 0.55) }}>{item.municipalityLabel}</Typography>
          </Stack>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarRoundedIcon key={i} sx={{ fontSize: 22, color: tokens.star }} />
              ))}
            </Box>
            <Typography sx={{ fontSize: 12, color: alpha(tokens.navy, 0.55) }}>{item.reviewsCount} Reviews</Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              border: `1px solid ${alpha(tokens.navy, 0.12)}`,
              borderRadius: "8px",
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setMode("fixed");
              }}
              sx={{
                flex: 1,
                py: 1.0,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 0,
                color: mode === "fixed" ? "#fff" : tokens.slate,
                bgcolor: mode === "fixed" ? tokens.teal : "transparent",
                "&:hover": { bgcolor: mode === "fixed" ? tokens.tealDark : "rgba(33, 184, 191, 0.08)" },
              }}
            >
              Fixed Location
            </Button>
            <Divider orientation="vertical" flexItem sx={{ borderColor: alpha(tokens.navy, 0.12) }} />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setMode("desired");
              }}
              sx={{
                flex: 1,
                py: 1.0,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 0,
                color: mode === "desired" ? "#fff" : tokens.slate,
                bgcolor: mode === "desired" ? tokens.teal : "transparent",
                "&:hover": { bgcolor: mode === "desired" ? tokens.tealDark : "rgba(33, 184, 191, 0.08)" },
              }}
            >
              Desired Location
            </Button>
          </Box>

          <Box sx={{ pt: 0.75, textAlign: "left" }}>
            <Stack spacing={1}>
              {item.services.map((svc, idx) => (
                <Stack
                  key={`${svc.name}-${idx}`}
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(tokens.navy, 0.9) }}>
                      {svc.name}
                    </Typography>
                    {svc.durationLabel ? (
                      <Typography sx={{ fontSize: 12, color: alpha(tokens.navy, 0.55) }}>{svc.durationLabel}</Typography>
                    ) : null}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: alpha(tokens.navy, 0.65), whiteSpace: "nowrap" }}>
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

