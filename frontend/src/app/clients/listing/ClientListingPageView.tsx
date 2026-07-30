"use client";

import AppButton from "../../../components/common/AppButton";
import * as React from "react";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ListingFilterBox,
  ListingFiltersDrawer,
  MollureSnackbar,
  AppPagination,
  ClientListingCard,
  MarketingSiteFooter,
  MollureMarketingHeader,
  MollureTextField,
} from "../../../components/common";
import { listingPageData } from "./listing.data";
import { parseListingSearchParams } from "./listingSearchParams";
import {
  useClientListingState,
  useListingTokens,
  type ListingSortValue,
} from "./useClientListingPage";
import { useListingCards } from "./use-listing-cards";
import { ListingBG } from "../../../../images";
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

export default function ClientListingPageView() {
  const tokens = useListingTokens();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const urlFilters = React.useMemo(
    () => parseListingSearchParams(searchParams),
    [searchKey],
  );
  const { filters: filterData, toolbar } = listingPageData;
  const { cards, isLoading, isError, error } = useListingCards();
  const state = useClientListingState(cards, urlFilters, searchKey);
  const user = useAppSelector((s) => s.auth.user);
  const displayName =
    ((user as any)?.display_name as string | undefined) ||
    `${(user as any)?.first_name ?? ""} ${(user as any)?.last_name ?? ""}`.trim();
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:client_profile");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        avatar_url?: string | null;
        email?: string;
      };
      const authedEmail = user?.email?.trim().toLowerCase();
      const persistedEmail = data?.email?.trim().toLowerCase();
      if (authedEmail && persistedEmail && authedEmail === persistedEmail) {
        if (typeof data.avatar_url === "string" && data.avatar_url)
          setAvatarUrl(data.avatar_url);
      }
    } catch {
      // ignore
    }
  }, [user?.email]);

  return (
    <Box sx={{ bgcolor: "mollure.pageBg", minHeight: "100vh" }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={displayName}
        userAvatarSrc={avatarUrl}
        homeHref="/"
      />

      <MollureSnackbar
        open={snackbarOpen}
        message="Added to the favourites"
        severity="success"
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
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

        <Container
          maxWidth="lg"
          sx={{ position: "relative", pt: { xs: 5, md: 7 } }}
        >
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ width: "100%", maxWidth: 820 }}>
              <ListingFilterBox
                values={state.filters}
                onChange={state.setFilters}
                categoryOptions={filterData.categoryOptions}
                municipalityOptions={filterData.municipalityOptions}
                onApply={() => {
                  state.applyFilters();
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Results */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          spacing={1.25}
          sx={{ mb: 2 }}
        >
          {/*
            Toolbar controls must match the compact design:
            same height/shape/typography for Filters + Sort.
          */}
          {/** shared sizing tokens */}
          <AppButton
            variant="outlined"
            endIcon={<TuneRoundedIcon />}
            onClick={() => setFiltersDrawerOpen(true)}
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
              "&:hover": {
                bgcolor: "#fff",
                borderColor: alpha(tokens.navy, 0.28),
              },
              "& .MuiButton-endIcon": {
                ml: 1,
                color: alpha(tokens.navy, 0.85),
              },
            }}
          >
            {toolbar.filterLabel}
          </AppButton>

          <MollureTextField
            select
            size="small"
            value={state.sort}
            onChange={(e) => {
              state.setSort(e.target.value as ListingSortValue);
              state.setPage(1);
            }}
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
                "&.Mui-focused fieldset": {
                  borderColor: alpha(tokens.navy, 0.28),
                  borderWidth: 1,
                },
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
              endAdornment: (
                <SwapVertRoundedIcon
                  sx={{ color: alpha(tokens.navy, 0.8), mr: 0.25 }}
                />
              ),
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

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: tokens.teal }} />
          </Box>
        ) : isError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {typeof error === "object" && error && "data" in error
              ? String(
                  (error as { data?: { message?: string } }).data?.message ??
                    "Unable to load listings.",
                )
              : "Unable to load listings."}
          </Alert>
        ) : state.items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography
              sx={{ color: alpha(tokens.navy, 0.65), fontWeight: 600 }}
            >
              No professionals found. Try adjusting your filters.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5} alignItems="stretch">
            {state.items.map((item) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={item.id}
                sx={{ display: "flex" }}
              >
                <ClientListingCard
                  item={item}
                  visibleLocationModes={state.appliedFilters.locationModes}
                  isFavorite={Boolean(state.favorites[item.id])}
                  onToggleFavorite={() => {
                    const wasFavorite = Boolean(state.favorites[item.id]);
                    state.toggleFavorite(item.id);
                    if (!wasFavorite) setSnackbarOpen(true);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {!isLoading && !isError ? (
          <Box sx={{ mt: 3.5 }}>
            <AppPagination
              count={state.totalPages}
              page={state.page}
              onChange={(_e, next) => state.setPage(next)}
              summary={`${state.totalCount} results`}
            />
          </Box>
        ) : null}
      </Container>

      <ListingFiltersDrawer
        open={filtersDrawerOpen}
        onClose={() => {
          state.cancelDrawerFilters();
          setFiltersDrawerOpen(false);
        }}
        filters={state.drawerFilters}
        onChange={state.setDrawerFilters}
        onApply={(next) => {
          state.applyDrawerFilters(next);
          setFiltersDrawerOpen(false);
        }}
        onCancel={() => {
          state.cancelDrawerFilters();
          setFiltersDrawerOpen(false);
        }}
      />

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
