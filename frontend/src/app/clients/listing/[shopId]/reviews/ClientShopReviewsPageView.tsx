"use client";

import { Box, CircularProgress, Container, Typography } from "@mui/material";
import {
  MarketingSiteFooter,
  MollureMarketingHeader,
  stickyFooterAnchorSx,
  stickyFooterPageSx,
} from "../../../../../components/common";
import ClientProfessionalReviewsView from "../../../../../components/common/client-reviews/ClientProfessionalReviewsView";
import { marketingShellFooter } from "../../../../../data/marketingShell.data";
import { useClientShopReviewsPage } from "./useClientShopReviewsPage";

export default function ClientShopReviewsPageView() {
  const {
    user,
    displayName,
    profile,
    isLoading,
    isError,
    locationMode,
    member,
    backHref,
    copy,
  } = useClientShopReviewsPage();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg", py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (isError || !profile) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg", py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography>
              {isError ? copy.loadError : copy.notFound}
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ ...stickyFooterPageSx, bgcolor: "mollure.pageBg" }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed={Boolean(user)}
        userLabel={user?.email ?? ""}
        userName={displayName}
        homeHref="/"
      />

      <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 3.5 } }}>
        <ClientProfessionalReviewsView
          profile={profile}
          member={member}
          locationMode={locationMode}
          reviewerName={displayName}
          backHref={backHref}
        />
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
