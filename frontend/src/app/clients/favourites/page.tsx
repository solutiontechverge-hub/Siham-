"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  PaginationItem,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "../../../store/hooks";
import {
  AppCard,
  AppPagination,
  ClientListingCard,
  ClientTopTabs,
  MarketingSiteFooter,
  MollureMarketingHeader,
} from "../../../components/common";
import { favouritesPageData } from "./data-favourites";
import { useClientFavouritesPage } from "./use-favourites";
import { profilePageData } from "../profile/data-profile";
import { marketingShellFooter } from "../../../data/marketingShell.data";

const clientTopTabs = [
  { label: "Booking", href: "/clients/booking" },
  { label: "Favorites", href: "/clients/favourites" },
  { label: "Profile", href: "/clients/profile" },
] as const;

export default function ClientFavouritesPage() {
  const pathname = usePathname();
  const { tokens, items, favorites, toggleFavorite, page, setPage, totalPages, totalCount, rangeLabel } =
    useClientFavouritesPage();
  const user = useAppSelector((s) => s.auth.user);
  const fallbackDisplayName =
    ((user as any)?.display_name as string | undefined) ||
    `${(user as any)?.first_name ?? ""} ${(user as any)?.last_name ?? ""}`.trim();
  const [userName, setUserName] = React.useState<string>(fallbackDisplayName);
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  const closeSnackbar = (_e?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:client_profile");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        avatar_url?: string | null;
        email?: string;
        first_name?: string;
        last_name?: string;
        display_name?: string;
      };
      const authedEmail = user?.email?.trim().toLowerCase();
      const persistedEmail = data?.email?.trim().toLowerCase();
      if (authedEmail && persistedEmail && authedEmail === persistedEmail) {
        if (typeof data.avatar_url === "string" && data.avatar_url) setAvatarUrl(data.avatar_url);
        const persistedName = (data.display_name ?? "").trim();
        const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
        const resolved = persistedName || fullName;
        if (resolved) setUserName(resolved);
      }
    } catch {
      // ignore
    }
  }, [user?.email]);

  React.useEffect(() => {
    const next = fallbackDisplayName.trim();
    if (next) setUserName(next);
  }, [fallbackDisplayName]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: profilePageData.pageBg }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={userName}
        userAvatarSrc={avatarUrl}
        homeHref="/clients/listing"
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity="info" variant="filled" sx={{ fontWeight: 700 }}>
          Item Removed
        </Alert>
      </Snackbar>

      <Box sx={{ mt: 2, bgcolor: "transparent" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1.5 }}>
          <ClientTopTabs
            tabs={clientTopTabs}
            activeLabel={
              pathname?.includes("/clients/booking")
                ? "Booking"
                : pathname?.includes("/clients/favourites")
                  ? "Favorites"
                  : "Profile"
            }
          />
        </Container>
      </Box>

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
            <Typography sx={{ fontWeight: 800, color: tokens.navy, fontSize: 18 }}>
              {favouritesPageData.emptyState.title}
            </Typography>
            <Typography sx={{ mt: 1, color: tokens.slate, fontSize: 14, lineHeight: 1.6 }}>
              {favouritesPageData.emptyState.subtitle}
            </Typography>
            <Button
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
            </Button>
          </AppCard>
        ) : (
          <>
            <Grid container spacing={2.5}>
              {items.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <ClientListingCard
                    item={item}
                    isFavorite={Boolean(favorites[item.id])}
                    onToggleFavorite={() => {
                      const wasFavorite = Boolean(favorites[item.id]);
                      toggleFavorite(item.id);
                      if (wasFavorite) setSnackbarOpen(true);
                    }}
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
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
