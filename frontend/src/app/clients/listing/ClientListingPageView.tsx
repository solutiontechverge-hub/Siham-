"use client";

import AppButton from "../../../components/common/AppButton";
import * as React from "react";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSearchParams } from "next/navigation";
import {
  ListingFilterBox,
  ListingFiltersDrawer,
  MollureSnackbar,
  AppPagination,
  ClientListingCard,
  MarketingSiteFooter,
  MollureMarketingHeader,
  stickyFooterAnchorSx,
  stickyFooterPageSx,
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

  const toolbarButtonSx = {
    height: 40,
    minWidth: 104,
    px: 1.5,
    borderRadius: "6px",
    textTransform: "none" as const,
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
  };

  return (
    <Box sx={{ ...stickyFooterPageSx, bgcolor: "#fff" }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={state.user?.email ?? ""}
        userName={state.displayName}
        userAvatarSrc={state.avatarUrl}
        homeHref="/"
      />

      <MollureSnackbar
        open={state.snackbarOpen}
        message={state.snackbarMessage}
        severity="success"
        autoHideDuration={2500}
        onClose={() => state.setSnackbarOpen(false)}
      />

      {/* Hero with BG + Filter Box */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          pb: { xs: 4, md: 5 },
          backgroundImage: `url("${toSrc(ListingBG)}")`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${alpha(tokens.teal, 0.14)}, ${alpha(tokens.teal, 0.26)})`,
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
          useFlexGap
          flexWrap="wrap"
          sx={{ mb: 2 }}
        >
          <AppButton
            variant="outlined"
            endIcon={<TuneRoundedIcon />}
            onClick={state.openFiltersDrawer}
            sx={toolbarButtonSx}
          >
            {toolbar.filterLabel}
          </AppButton>

          <AppButton
            variant="outlined"
            endIcon={<SwapVertRoundedIcon />}
            onClick={(event) => state.setSortMenuAnchor(event.currentTarget)}
            aria-haspopup="listbox"
            aria-expanded={state.sortMenuOpen ? "true" : "false"}
            aria-controls={state.sortMenuOpen ? "listing-sort-menu" : undefined}
            sx={toolbarButtonSx}
          >
            {toolbar.sortLabel}
          </AppButton>
          <Menu
            id="listing-sort-menu"
            anchorEl={state.sortMenuAnchor}
            open={state.sortMenuOpen}
            onClose={() => state.setSortMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.75,
                  minWidth: 240,
                  borderRadius: "8px",
                  boxShadow: "0 12px 28px rgba(16, 24, 40, 0.12)",
                },
              },
            }}
          >
            {toolbar.sortOptions.map((opt) => (
              <MenuItem
                key={opt.value}
                selected={state.sort === opt.value}
                onClick={() => {
                  state.setSort(opt.value as ListingSortValue);
                  state.setPage(1);
                  state.setSortMenuAnchor(null);
                }}
                sx={{
                  fontSize: 13,
                  fontWeight: state.sort === opt.value ? 600 : 400,
                }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Menu>
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
                    listingPageData.loadErrorFallback,
                )
              : listingPageData.loadErrorFallback}
          </Alert>
        ) : state.items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography
              sx={{ color: alpha(tokens.navy, 0.65), fontWeight: 600 }}
            >
              {listingPageData.emptyResultsMessage}
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
                  onToggleFavorite={() => state.toggleFavorite(item.id)}
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
        open={state.filtersDrawerOpen}
        onClose={state.closeFiltersDrawer}
        filters={state.drawerFilters}
        onChange={state.setDrawerFilters}
        onApply={state.applyAndCloseDrawer}
        onCancel={state.closeFiltersDrawer}
      />

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
        sx={stickyFooterAnchorSx}
      />
    </Box>
  );
}
