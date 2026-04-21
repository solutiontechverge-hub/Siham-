"use client";

import * as React from "react";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import {
  Box,
  Button,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { ListingFilterBox, AppPagination, AppCard, MarketingSiteFooter, MollureMarketingHeader, MollureTextField } from "../../../components/common";
import { listingPageData, type ListingCardData } from "./listing.data";
import { useClientListingState, useListingTokens, type ListingSortValue } from "./listing.use";
import { ListingBG, FixedLocationIcon, DesiredLocationIcon } from "../../../../images";
import { useAppSelector } from "../../../store/hooks";
import { marketingShellFooter } from "../../../data/marketingShell.data";

function toSrc(img: any) {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object") {
    if (typeof img.src === "string") return img.src;
    if (typeof img.default === "string") return img.default;
    if (typeof img.default === "object") return toSrc(img.default);
  }
  return String(img);
}

function ListingCard({
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
          <Image
            src={item.image}
            alt={item.title}
            fill
            priority={false}
            style={{ objectFit: "cover" }}
          />
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
            <Typography sx={{ fontSize: 13, color: alpha(tokens.navy, 0.55) }}>
              {item.municipalityLabel}
            </Typography>
          </Stack>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarRoundedIcon key={i} sx={{ fontSize: 22, color: tokens.star }} />
              ))}
            </Box>
            <Typography sx={{ fontSize: 12, color: alpha(tokens.navy, 0.55) }}>
              {item.reviewsCount} Reviews
            </Typography>
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
              onClick={() => setMode("fixed")}
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
              onClick={() => setMode("desired")}
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
                      <Typography sx={{ fontSize: 12, color: alpha(tokens.navy, 0.55) }}>
                        {svc.durationLabel}
                      </Typography>
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

export default function ClientListingPage() {
  const tokens = useListingTokens();
  const { header, filters: filterData, toolbar, cards } = listingPageData;
  const state = useClientListingState(cards);
  const user = useAppSelector((s) => s.auth.user);
  const displayName =
    ((user as any)?.display_name as string | undefined) ||
    `${(user as any)?.first_name ?? ""} ${(user as any)?.last_name ?? ""}`.trim();
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:client_profile");
      if (!raw) return;
      const data = JSON.parse(raw) as { avatar_url?: string | null; email?: string };
      const authedEmail = user?.email?.trim().toLowerCase();
      const persistedEmail = data?.email?.trim().toLowerCase();
      if (authedEmail && persistedEmail && authedEmail === persistedEmail) {
        if (typeof data.avatar_url === "string" && data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch {
      // ignore
    }
  }, [user?.email]);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={displayName}
        userAvatarSrc={avatarUrl}
        homeHref="/clients/listing"
      />

      {/* Hero with BG + Filter Box */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          pb: { xs: 4, md: 5 },
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.30)), url("${toSrc(ListingBG)}")`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "transparent",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.35))`,
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", pt: { xs: 5, md: 7 } }}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ width: "100%", maxWidth: 820 }}>
              <ListingFilterBox
                values={state.filters}
                onChange={state.setFilters}
                categoryOptions={filterData.categoryOptions}
                municipalityOptions={filterData.municipalityOptions}
                onApply={state.applyFilters}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Results */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1.25} sx={{ mb: 2 }}>
          {/*
            Toolbar controls must match the compact design:
            same height/shape/typography for Filters + Sort.
          */}
          {/** shared sizing tokens */}
          <Button
            variant="outlined"
            endIcon={<TuneRoundedIcon />}
            sx={{
              height: 40,
              minWidth: 104,
              px: 1.5,
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 500,
              fontSize: 13,
              lineHeight: 1,
              color: alpha(tokens.navy, 0.85),
              bgcolor: "#fff",
              borderColor: alpha(tokens.navy, 0.18),
              "&:hover": { bgcolor: "#fff", borderColor: alpha(tokens.navy, 0.28) },
              "& .MuiButton-endIcon": { ml: 1, color: alpha(tokens.navy, 0.85) },
            }}
          >
            {toolbar.filterLabel}
          </Button>

          <MollureTextField
            select
            size="small"
            value={state.sort}
            onChange={(e) => state.setSort(e.target.value as ListingSortValue)}
            sx={{
              width: 104,
              "& .MuiOutlinedInput-root": {
                height: 40,
                bgcolor: "#fff",
                borderRadius: "6px",
                fontSize: 13,
                fontWeight: 500,
                color: alpha(tokens.navy, 0.85),
                "& fieldset": { borderColor: alpha(tokens.navy, 0.18) },
                "&:hover fieldset": { borderColor: alpha(tokens.navy, 0.28) },
                "&.Mui-focused fieldset": { borderColor: alpha(tokens.navy, 0.28), borderWidth: 1 },
              },
              "& .MuiSelect-select": {
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
              },
            }}
            InputProps={{
              startAdornment: null,
              endAdornment: <SwapVertRoundedIcon sx={{ color: alpha(tokens.navy, 0.8), mr: 0.25 }} />,
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: () => "Sort By",
              IconComponent: () => null,
            }}
          >
            {toolbar.sortOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MollureTextField>
        </Stack>

        <Grid container spacing={2.5}>
          {state.items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <ListingCard
                item={item}
                isFavorite={Boolean(state.favorites[item.id])}
                onToggleFavorite={() => state.toggleFavorite(item.id)}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3.5 }}>
          <AppPagination
            count={state.totalPages}
            page={state.page}
            onChange={(_e, next) => state.setPage(next)}
            summary={`${state.totalCount} results`}
          />
        </Box>
      </Container>

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}

