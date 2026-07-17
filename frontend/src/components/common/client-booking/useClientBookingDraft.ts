"use client";

import * as React from "react";
import type { ClientBookingRecord } from "../../../app/clients/booking/clientBookingRecords";
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

  React.useEffect(() => {
    if (activeBooking?.draft) {
      setDraft(activeBooking.draft);
    }
    const recordShop = shopFromRecord(activeBooking?.shop);
    if (recordShop) {
      setShop(recordShop);
    }
  }, [activeBooking]);

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
    requiresPrepayment: prepaymentPercent > 0 || Boolean(activeBooking?.requiresPrepayment),
    isBusinessProfileLoading,
  };
}
