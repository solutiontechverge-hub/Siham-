"use client";

import * as React from "react";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
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
import { ListingFilterBox, AppPagination, AppCard, MollureTextField } from "../../../components/common";
import { listingPageData, type ListingCardData } from "./listing.data";
import { useClientListingState, useListingTokens, type ListingSortValue } from "./listing.use";
import { Logo, ListingBG, FixedLocationIcon, DesiredLocationIcon } from "../../../../images";

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
              <Typography sx={{ fontSize: 11, color: tokens.slate, ml: 0.5 }}>
                {item.reviewsCount} Reviews
              </Typography>
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
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: tokens.navy }}>
                      {svc.name}
                    </Typography>
                    {svc.durationLabel ? (
                      <Typography sx={{ fontSize: 11, color: tokens.slate }}>
                        {svc.durationLabel}
                      </Typography>
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

export default function ClientListingPage() {
  const tokens = useListingTokens();
  const { header, filters: filterData, toolbar, cards } = listingPageData;
  const state = useClientListingState(cards);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: tokens.whiteOverlay,
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box component={Link} href="/" sx={{ display: "inline-flex", alignItems: "center" }}>
              <Image src={Logo} alt="Mollure" width={160} height={38} priority />
            </Box>

            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: tokens.border,
                  color: tokens.navy,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  height: 36,
                }}
              >
                {header.localeLabel}
              </Button>
              <Button
                variant="contained"
                disableElevation
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: tokens.teal,
                  height: 36,
                  "&:hover": { bgcolor: tokens.tealDark },
                }}
              >
                {header.loginLabel}
              </Button>
              <Typography sx={{ color: tokens.headerHint, fontSize: 13 }}>
                {header.professionalLinkLabel}
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

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
          <Button
            variant="text"
            startIcon={<TuneRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              color: tokens.slate,
              "&:hover": { bgcolor: "rgba(33, 184, 191, 0.08)", color: tokens.navy },
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
              width: 170,
              "& .MuiOutlinedInput-root": {
                height: 40,
                bgcolor: "#fff",
                borderRadius: "6px",
                fontSize: 13,
                color: tokens.navy,
                "& fieldset": { borderColor: tokens.inputBorder },
                "&:hover fieldset": { borderColor: tokens.inputBorderHover },
                "&.Mui-focused fieldset": { borderColor: tokens.teal, borderWidth: 1 },
              },
            }}
            InputProps={{
              startAdornment: <SortRoundedIcon sx={{ color: tokens.placeholder, mr: 0.75 }} />,
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
    </Box>
  );
}

