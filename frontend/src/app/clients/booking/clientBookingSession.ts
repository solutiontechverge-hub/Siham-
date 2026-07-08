import type { ClientBookingSelectedShop } from "../../../components/common/client-booking/types";
import type { ClientBookingRecord } from "./clientBookingRecords";

export const CHECKOUT_REF_KEY = "mollure:checkout_booking_ref";
export const ACTIVE_BOOKING_ID_KEY = "mollure:active_booking_id";
export const ACTIVE_BOOKING_RECORD_KEY = "mollure:active_booking_record";

export function createBookingRef() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `B${Date.now()}${suffix}`;
}

export function getActiveBookingSession(): ClientBookingRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_BOOKING_RECORD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClientBookingRecord;
  } catch {
    return null;
  }
}

export function clearActiveBookingSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHECKOUT_REF_KEY);
  window.sessionStorage.removeItem(ACTIVE_BOOKING_ID_KEY);
  window.sessionStorage.removeItem(ACTIVE_BOOKING_RECORD_KEY);
}

export function setActiveBookingSession(record: ClientBookingRecord) {
  if (typeof window === "undefined") return;
  if (record.bookingRef) window.sessionStorage.setItem(CHECKOUT_REF_KEY, record.bookingRef);
  window.sessionStorage.setItem(ACTIVE_BOOKING_ID_KEY, record.apiBookingId ?? record.id);
  window.sessionStorage.setItem(ACTIVE_BOOKING_RECORD_KEY, JSON.stringify(record));
  const shop = record.shop;
  if (shop?.shopId && shop.shopName) {
    const payload: ClientBookingSelectedShop = {
      shopId: shop.shopId,
      shopName: shop.shopName,
      municipalityLabel: shop.municipalityLabel,
      addressLabel: shop.addressLabel,
      locationMode: shop.locationMode,
    };
    window.sessionStorage.setItem("mollure:selected_shop", JSON.stringify(payload));
  }
}

export function getCheckoutPath(record: ClientBookingRecord, listTab?: string) {
  const base = record.requiresPrepayment ? "/clients/booking/checkout/prepaid" : "/clients/booking/checkout";
  if (!listTab) return base;
  return `${base}?tab=${encodeURIComponent(listTab)}`;
}
