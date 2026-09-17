"use client";

import { Box, CircularProgress, Container, Typography } from "@mui/material";
import {
  BusinessPublicProfile,
  MollureMarketingHeader,
} from "../../../../components/common";
import { useClientShopProfilePage } from "./useClientShopProfilePage";

export default function ClientShopProfilePageView() {
  const {
    user,
    displayName,
    profile,
    isLoading,
    isError,
    locationMode,
    handleLocationModeChange,
    onBookNow,
    copy,
  } = useClientShopProfilePage();

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
    <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg" }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={displayName}
        homeHref="/"
      />

      <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 3.5 } }}>
        <BusinessPublicProfile
          data={profile}
          locationMode={locationMode}
          onLocationModeChange={handleLocationModeChange}
          onBookNow={onBookNow}
        />
      </Container>
    </Box>
  );
}
