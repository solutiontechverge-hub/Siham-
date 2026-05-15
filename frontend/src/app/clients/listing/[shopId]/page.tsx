"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Container } from "@mui/material";
import { BusinessPublicProfile, MarketingSiteFooter, MollureMarketingHeader } from "../../../../components/common";
import {
  getBusinessPublicProfileByShopId,
  resolveBusinessOfferingFlags,
} from "../../../../data/businessPublicProfile.data";
import { marketingShellFooter } from "../../../../data/marketingShell.data";
import { useAppSelector } from "../../../../store/hooks";

export default function ClientBusinessProfilePage() {
  const router = useRouter();
  const params = useParams();
  const shopId = typeof params?.shopId === "string" ? params.shopId : "";
  const profile = React.useMemo(() => getBusinessPublicProfileByShopId(shopId), [shopId]);

  const user = useAppSelector((s) => s.auth.user);
  const displayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();

  const [locationMode, setLocationMode] = React.useState<"fixed" | "desired">("fixed");

  React.useEffect(() => {
    if (!profile) return;
    const offering = resolveBusinessOfferingFlags(profile.businessOffering);

    let modeFromListing: "fixed" | "desired" | null = null;
    try {
      const raw = window.localStorage.getItem("mollure:selected_shop");
      if (raw) {
        const parsed = JSON.parse(raw) as { shopId?: string; locationMode?: "fixed" | "desired" };
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
        window.localStorage.setItem(
          "mollure:selected_shop",
          JSON.stringify({
            shopId: profile.shopId,
            shopName: profile.shopName,
            municipalityLabel: profile.fixedLocation.municipality,
            addressLabel: profile.fixedLocation.formattedAddress,
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
      if (!offering.supportsFixedLocation || !offering.supportsDesiredLocation) return;
      setLocationMode(mode);
      persistSelectedShop(mode);
    },
    [persistSelectedShop, profile],
  );

  const onBookNow = () => {
    persistSelectedShop();
    router.push("/clients/booking?mode=create");
  };

  if (!profile) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#EAF9FB", py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", py: 8 }}>Business not found.</Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#EAF9FB" }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={displayName}
        homeHref="/clients/listing"
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
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
