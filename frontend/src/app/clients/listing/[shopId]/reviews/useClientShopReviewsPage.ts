"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { resolveReviewsBackHref } from "../../../../../data/clientProfessionalReviews";
import { useBusinessPublicProfile } from "../../../../../hooks/useBusinessPublicProfile";
import { useAppSelector } from "../../../../../store/hooks";
import { resolveSelectedShopLocationMode } from "../../../booking/clientBookingSession";
import { shopReviewsPageData } from "./shopReviews.data";

export type ShopReviewsLocationMode = "fixed" | "desired";

export function useClientShopReviewsPage() {
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
    shopReviewsPageData.guestLabel;

  const locationMode = React.useMemo<ShopReviewsLocationMode>(() => {
    if (!profile) return "fixed";
    return resolveSelectedShopLocationMode({
      shopId: profile.shopId,
      supportsFixedLocation: profile.supportsFixedLocation,
      supportsDesiredLocation: profile.supportsDesiredLocation,
      defaultMode: profile.locationModeDefault,
    });
  }, [profile]);

  // Only scope to a team member when explicitly requested — otherwise show shop-level reviews
  // matching the listing/shop aggregate rating.
  const member = React.useMemo(() => {
    if (!profile?.teamMembers.length) return null;
    if (!memberIdParam) return null;
    return profile.teamMembers.find((m) => m.id === memberIdParam) ?? null;
  }, [memberIdParam, profile]);

  return {
    user,
    displayName,
    profile,
    isLoading,
    isError,
    locationMode,
    member,
    backHref,
    copy: shopReviewsPageData,
  };
}
