"use client";

import AppButton from "../../../components/common/AppButton";
import {
  Alert,
  Box,
  Container,
  Grid,
  PaginationItem,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppCard,
  AppPagination,
  ClientListingCard,
  ClientPageTabsBar,
  clientTopTabsActiveLabel,
  MollureSnackbar,
  MarketingSiteFooter,
  MollureMarketingHeader,
  stickyFooterAnchorSx,
  stickyFooterPageSx,
} from "../../../components/common";
import { favouritesPageData } from "./favourites.data";
import { useClientFavouritesPage } from "./useClientFavouritesPage";
import { profilePageData } from "../profile/profile.data";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import {
  mollurePageSubtitleSx,
  mollurePageTitleSx,
} from "../../../theme/mollureHierarchy";

export default function ClientFavouritesPageView() {
  const pathname = usePathname();
  const {
    tokens,
    user,
    userName,
    avatarUrl,
    items,
    favorites,
    toggleFavorite,
    page,
    setPage,
    totalPages,
    totalCount,
    rangeLabel,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
  } = useClientFavouritesPage();

  return (
    <Box sx={{ ...stickyFooterPageSx, bgcolor: profilePageData.pageBg }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={userName}
        userAvatarSrc={avatarUrl}
        homeHref="/"
      />

      <MollureSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity="info"
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
      />

      <ClientPageTabsBar activeLabel={clientTopTabsActiveLabel(pathname)} />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {totalCount === 0 ? (
          <AppCard
            sx={{
              p: { xs: 3, sm: 3.5, md: 4 },
              borderRadius: "10px",
              bgcolor: "#fff",
              border: `1px solid ${tokens.border}`,
              boxShadow: "0 16px 40px rgba(40, 92, 112, 0.08)",
            }}
          >
            <Typography sx={mollurePageTitleSx(tokens.navy)}>
              {favouritesPageData.emptyState.title}
            </Typography>
            <Typography
              sx={mollurePageSubtitleSx(tokens.navy, {
                mt: 1,
                lineHeight: 1.6,
              })}
            >
              {favouritesPageData.emptyState.subtitle}
            </Typography>
            <AppButton
              component={Link}
              href={favouritesPageData.emptyState.ctaHref}
              variant="contained"
              disableElevation
              sx={{
                mt: 3,
                bgcolor: tokens.teal,
                "&:hover": { bgcolor: tokens.tealDark },
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                color: "#fff",
                px: 2.5,
                py: 1.1,
              }}
            >
              {favouritesPageData.emptyState.ctaLabel}
            </AppButton>
          </AppCard>
        ) : (
          <>
            <Grid container spacing={2.5} alignItems="stretch">
              {items.map((item) => (
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
                    isFavorite={Boolean(favorites[item.id])}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <AppPagination
                count={totalPages}
                page={page}
                onChange={(_e, next) => setPage(next)}
                summary={`${rangeLabel} of ${totalCount}`}
                renderItem={(item) => (
                  <PaginationItem
                    {...item}
                    sx={{
                      "&.Mui-selected": { bgcolor: tokens.teal, color: "#fff" },
                      "&:hover": { bgcolor: "rgba(33, 184, 191, 0.10)" },
                    }}
                  />
                )}
              />
            </Box>
          </>
        )}
      </Container>

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
