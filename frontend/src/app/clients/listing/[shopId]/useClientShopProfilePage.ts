"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { resolveBusinessOfferingFlags } from "../../../../data/businessPublicProfile.data";
import {
  savePublicProfileBookingSelection,
  type PublicProfileBookingSelection,
} from "../../../../data/publicProfileBookingSelection";
import { useBusinessPublicProfile } from "../../../../hooks/useBusinessPublicProfile";
import { useAppSelector } from "../../../../store/hooks";
import {
  SELECTED_SHOP_KEY,
  resolveSelectedShopLocationMode,
} from "../../booking/clientBookingSession";
import { shopProfilePageData } from "./shopProfile.data";

export type ShopLocationMode = "fixed" | "desired";

function desiredAreaLabel(
  areas: {
    province?: string;
    municipalities: string[];
  }[],
) {
  return (
    areas
      .map((area) => {
        const municipalities = area.municipalities.filter(Boolean).join(", ");
        return [area.province, municipalities].filter(Boolean).join(" · ");
      })
      .filter(Boolean)
      .join("; ") || shopProfilePageData.desiredLocationFallback
  );
}

export function useClientShopProfilePage() {
  const router = useRouter();
  const params = useParams();
  const shopId = typeof params?.shopId === "string" ? params.shopId : "";
  const { profile, isLoading, isError } = useBusinessPublicProfile(shopId);

  const user = useAppSelector((s) => s.auth.user);
  const displayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();

  const [locationMode, setLocationMode] =
    React.useState<ShopLocationMode>("fixed");

  React.useEffect(() => {
    if (!profile) return;
    const offering = resolveBusinessOfferingFlags(profile.businessOffering);
    setLocationMode(
      resolveSelectedShopLocationMode({
        shopId: profile.shopId,
        supportsFixedLocation: offering.supportsFixedLocation,
        supportsDesiredLocation: offering.supportsDesiredLocation,
        defaultMode: profile.locationModeDefault,
      }),
    );
  }, [profile]);

  const persistSelectedShop = React.useCallback(
    (mode: ShopLocationMode = locationMode) => {
      if (!profile) return;
      try {
        const areaLabel = desiredAreaLabel(profile.desiredLocation.areas);
        window.sessionStorage.setItem(
          SELECTED_SHOP_KEY,
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
                ? areaLabel
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
    (mode: ShopLocationMode) => {
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
      const areaLabel = desiredAreaLabel(profile?.desiredLocation.areas ?? []);
      window.sessionStorage.setItem(
        SELECTED_SHOP_KEY,
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
              ? areaLabel
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

  return {
    user,
    displayName,
    profile,
    isLoading,
    isError,
    locationMode,
    handleLocationModeChange,
    onBookNow,
    copy: shopProfilePageData,
  };
}
