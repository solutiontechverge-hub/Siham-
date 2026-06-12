"use client";

import * as React from "react";
import {
  BOOKINGS_CHANGED_EVENT,
  type ClientBookingRecord,
} from "../../../app/clients/booking/clientBookingRecords";
import { ACTIVE_BOOKING_ID_KEY } from "../../../app/clients/booking/clientBookingSession";
import { useBusinessPublicProfile } from "../../../hooks/useBusinessPublicProfile";
import { useActiveClientBooking } from "./useActiveClientBooking";
import type { ClientBookingDraft, ClientBookingSelectedShop } from "./types";
import { parsePrepaymentPercent } from "./parsePrepaymentPercent";

function shopFromRecord(shop: ClientBookingRecord["shop"]): ClientBookingSelectedShop | null {
  if (!shop?.shopId || !shop.shopName) return null;
  return {
    shopId: shop.shopId,
    shopName: shop.shopName,
    municipalityLabel: shop.municipalityLabel,
    addressLabel: shop.addressLabel,
    locationMode: shop.locationMode,
  };
}

export function useClientBookingDraft() {
  const { record: activeBooking } = useActiveClientBooking();
  const [draft, setDraft] = React.useState<ClientBookingDraft | null>(null);
  const [shop, setShop] = React.useState<ClientBookingSelectedShop | null>(null);

  const hydrateFromStorage = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const activeId = window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY);
    if (activeId && activeBooking?.id === activeId) {
      if (activeBooking.draft) {
        setDraft(activeBooking.draft);
      }
      const recordShop = shopFromRecord(activeBooking.shop);
      if (recordShop) {
        setShop(recordShop);
        return;
      }
    }

    try {
      const raw = window.localStorage.getItem("mollure:booking_draft");
      if (raw) setDraft(JSON.parse(raw) as ClientBookingDraft);
    } catch {
      // ignore
    }

    try {
      const raw = window.localStorage.getItem("mollure:selected_shop");
      if (!raw) return;
      const parsed = JSON.parse(raw) as ClientBookingSelectedShop;
      if (parsed?.shopId && parsed?.shopName) setShop(parsed);
    } catch {
      // ignore
    }
  }, [activeBooking]);

  React.useEffect(() => {
    hydrateFromStorage();
    window.addEventListener(BOOKINGS_CHANGED_EVENT, hydrateFromStorage);
    return () => window.removeEventListener(BOOKINGS_CHANGED_EVENT, hydrateFromStorage);
  }, [hydrateFromStorage]);

  const { profile: businessProfile, isLoading: isBusinessProfileLoading } = useBusinessPublicProfile(shop?.shopId);

  const prepaymentPercent = React.useMemo(
    () => parsePrepaymentPercent(businessProfile?.prepaymentLabel),
    [businessProfile?.prepaymentLabel],
  );

  return {
    draft,
    shop,
    businessProfile,
    prepaymentPercent,
    requiresPrepayment: prepaymentPercent > 0,
    isBusinessProfileLoading,
  };
}
