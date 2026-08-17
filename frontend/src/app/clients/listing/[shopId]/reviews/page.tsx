"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import {
  MarketingSiteFooter,
  MollureMarketingHeader,
  stickyFooterAnchorSx,
  stickyFooterPageSx,
} from "../../../../../components/common";
import ClientProfessionalReviewsView from "../../../../../components/common/client-reviews/ClientProfessionalReviewsView";
import { marketingShellFooter } from "../../../../../data/marketingShell.data";
import { resolveReviewsBackHref } from "../../../../../data/clientProfessionalReviews";
import { useBusinessPublicProfile } from "../../../../../hooks/useBusinessPublicProfile";
import { useAppSelector } from "../../../../../store/hooks";

export default function ClientProfessionalReviewsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shopId = typeof params?.shopId === "string" ? params.shopId : "";
  const memberIdParam = searchParams?.get("memberId") ?? "";
  const returnToParam = searchParams?.get("returnTo");
  const backHref = resolveReviewsBackHref(shopId, returnToParam);
  const { profile, isLoading, isError } = useBusinessPublicProfile(shopId);
  const user = useAppSelector((s) => s.auth.user);

  const displayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim() ||
    user?.email ||
    "Guest";

  const locationMode = React.useMemo<"fixed" | "desired">(() => {
    if (!profile) return "fixed";
    if (!profile.supportsFixedLocation) return "desired";
    if (!profile.supportsDesiredLocation) return "fixed";
    try {
      const raw = window.sessionStorage.getItem("mollure:selected_shop");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          shopId?: string;
          locationMode?: "fixed" | "desired";
        };
        if (parsed.shopId === profile.shopId && parsed.locationMode)
          return parsed.locationMode;
      }
    } catch {
      // ignore
    }
    return profile.locationModeDefault;
  }, [profile]);

  // Only scope to a team member when explicitly requested — otherwise show shop-level reviews
  // matching the listing/shop aggregate rating.
  const member = React.useMemo(() => {
    if (!profile?.teamMembers.length) return null;
    if (!memberIdParam) return null;
    return profile.teamMembers.find((m) => m.id === memberIdParam) ?? null;
  }, [memberIdParam, profile]);

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
              {isError ? "Unable to load reviews." : "Professional not found."}
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
