"use client";

import * as React from "react";
import { getBusinessPublicProfileByShopId } from "../../../data/businessPublicProfile.data";
import type { ClientBookingDraft, ClientBookingSelectedShop } from "./types";
import { parsePrepaymentPercent } from "./parsePrepaymentPercent";

export function useClientBookingDraft() {
  const [draft, setDraft] = React.useState<ClientBookingDraft | null>(null);
  const [shop, setShop] = React.useState<ClientBookingSelectedShop | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:booking_draft");
      if (!raw) return;
      setDraft(JSON.parse(raw) as ClientBookingDraft);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:selected_shop");
      if (!raw) return;
      const parsed = JSON.parse(raw) as ClientBookingSelectedShop;
      if (parsed?.shopId && parsed?.shopName) setShop(parsed);
    } catch {
      // ignore
    }
  }, []);

  const businessProfile = React.useMemo(
    () => (shop?.shopId ? getBusinessPublicProfileByShopId(shop.shopId) : null),
    [shop?.shopId],
  );

  const prepaymentPercent = React.useMemo(
    () => parsePrepaymentPercent(businessProfile?.prepaymentLabel),
    [businessProfile?.prepaymentLabel],
  );

  return { draft, shop, businessProfile, prepaymentPercent, requiresPrepayment: prepaymentPercent > 0 };
}
