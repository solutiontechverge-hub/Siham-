"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import {
  BusinessPublicProfile,
  MarketingSiteFooter,
  MollureMarketingHeader,
} from "../../../../components/common";
import { resolveBusinessOfferingFlags } from "../../../../data/businessPublicProfile.data";
import {
  savePublicProfileBookingSelection,
  type PublicProfileBookingSelection,
} from "../../../../data/publicProfileBookingSelection";
import { marketingShellFooter } from "../../../../data/marketingShell.data";
import { useBusinessPublicProfile } from "../../../../hooks/useBusinessPublicProfile";
import { useAppSelector } from "../../../../store/hooks";

export default function ClientBusinessProfilePage() {
  const router = useRouter();
  const params = useParams();
  const shopId = typeof params?.shopId === "string" ? params.shopId : "";
  const { profile, isLoading, isError } = useBusinessPublicProfile(shopId);

  const user = useAppSelector((s) => s.auth.user);
  const displayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();

  const [locationMode, setLocationMode] = React.useState<"fixed" | "desired">(
    "fixed",
  );

  React.useEffect(() => {
    if (!profile) return;
    const offering = resolveBusinessOfferingFlags(profile.businessOffering);

    let modeFromListing: "fixed" | "desired" | null = null;
    try {
      const raw = window.sessionStorage.getItem("mollure:selected_shop");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          shopId?: string;
          locationMode?: "fixed" | "desired";
        };
        if (parsed.shopId === profile.shopId && parsed.locationMode) {
          modeFromListing = parsed.locationMode;
        }
      }
    } catch {
      // ignore
    }

    if (!offering.supportsFixedLocation) {
      setLocationMode("desired");
      return;
    }
    if (!offering.supportsDesiredLocation) {
      setLocationMode("fixed");
      return;
    }
    setLocationMode(modeFromListing ?? profile.locationModeDefault);
  }, [profile]);

  const persistSelectedShop = React.useCallback(
    (mode: "fixed" | "desired" = locationMode) => {
      if (!profile) return;
      try {
        const desiredAreaLabel =
          profile.desiredLocation.areas
            .map((area) => {
              const municipalities = area.municipalities.filter(Boolean).join(", ");
              return [area.province, municipalities].filter(Boolean).join(" · ");
            })
            .filter(Boolean)
            .join("; ") || "Desired Location";
        window.sessionStorage.setItem(
          "mollure:selected_shop",
          JSON.stringify({
            shopId: profile.shopId,
            shopName: profile.shopName,
            municipalityLabel:
              mode === "desired"
                ? profile.desiredLocation.areas[0]?.municipalities[0] ||
                  profile.desiredLocation.areas[0]?.province ||
                  ""
                : profile.fixedLocation.municipality,
            addressLabel:
              mode === "desired"
                ? desiredAreaLabel
                : profile.fixedLocation.formattedAddress,
            locationMode: mode,
          }),
        );
      } catch {
        // ignore
      }
    },
    [locationMode, profile],
  );

  const handleLocationModeChange = React.useCallback(
    (mode: "fixed" | "desired") => {
      if (!profile) return;
      const offering = resolveBusinessOfferingFlags(profile.businessOffering);
      if (!offering.supportsFixedLocation || !offering.supportsDesiredLocation)
        return;
      setLocationMode(mode);
      persistSelectedShop(mode);
    },
    [persistSelectedShop, profile],
  );

  const onBookNow = (selection: PublicProfileBookingSelection) => {
    persistSelectedShop(selection.locationMode);
    try {
      const desiredAreaLabel =
        profile?.desiredLocation.areas
          .map((area) => {
            const municipalities = area.municipalities.filter(Boolean).join(", ");
            return [area.province, municipalities].filter(Boolean).join(" · ");
          })
          .filter(Boolean)
          .join("; ") || "Desired Location";
      window.sessionStorage.setItem(
        "mollure:selected_shop",
        JSON.stringify({
          shopId: selection.shopId,
          shopName: selection.shopName ?? profile?.shopName,
          municipalityLabel:
            selection.locationMode === "desired"
              ? profile?.desiredLocation.areas[0]?.municipalities[0] ||
                profile?.desiredLocation.areas[0]?.province ||
                ""
              : profile?.fixedLocation.municipality,
          addressLabel:
            selection.locationMode === "desired"
              ? desiredAreaLabel
              : profile?.fixedLocation.formattedAddress,
          locationMode: selection.locationMode,
        }),
      );
    } catch {
      // ignore
    }
    savePublicProfileBookingSelection(selection);
    router.push(`/clients/booking?mode=create&from=profile&t=${Date.now()}`);
  };

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
              {isError
                ? "Unable to load business profile."
                : "Business not found."}
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
