import type { ClientBookingSelectedShop } from "../../../components/common/client-booking/types";
import type { ClientBookingRecord } from "./clientBookingRecords";
import {
  cacheClientBookingDraftSnapshot,
  enrichClientBookingRecord,
} from "./clientBookingDraftCache";

export const CHECKOUT_REF_KEY = "mollure:checkout_booking_ref";
export const ACTIVE_BOOKING_ID_KEY = "mollure:active_booking_id";
export const ACTIVE_BOOKING_RECORD_KEY = "mollure:active_booking_record";
export const ACTIVE_BOOKING_CHANGED_EVENT = "mollure:active-booking-changed";
/** Keep the editor draft until EBR/ER grant persist finishes (API must not overwrite it). */
export const EBR_DRAFT_LOCK_KEY = "mollure:ebr_draft_lock";
/** Create-page URL to reopen after summary back (keeps `from=profile&t=`). */
export const CREATE_RETURN_HREF_KEY = "mollure:create_return_href";
export const SELECTED_SHOP_KEY = "mollure:selected_shop";

/** Resolve FL/DL mode from selected-shop session + offering flags. */
export function resolveSelectedShopLocationMode(args: {
  shopId: string;
  supportsFixedLocation: boolean;
  supportsDesiredLocation: boolean;
  defaultMode: "fixed" | "desired";
}): "fixed" | "desired" {
  if (!args.supportsFixedLocation) return "desired";
  if (!args.supportsDesiredLocation) return "fixed";
  if (typeof window === "undefined") return args.defaultMode;
  try {
    const raw = window.sessionStorage.getItem(SELECTED_SHOP_KEY);
    if (!raw) return args.defaultMode;
    const parsed = JSON.parse(raw) as {
      shopId?: string;
      locationMode?: "fixed" | "desired";
    };
    if (parsed.shopId === args.shopId && parsed.locationMode) {
      return parsed.locationMode;
    }
  } catch {
    // ignore
  }
  return args.defaultMode;
}

export function isEbrDraftLocked() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(EBR_DRAFT_LOCK_KEY) === "1";
}

export function lockEbrDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(EBR_DRAFT_LOCK_KEY, "1");
}

export function unlockEbrDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(EBR_DRAFT_LOCK_KEY);
}

export function createBookingRef() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ol${Date.now()}${suffix}`;
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
  const liveRecord = enrichClientBookingRecord(record);
  if (liveRecord.bookingRef) window.sessionStorage.setItem(CHECKOUT_REF_KEY, liveRecord.bookingRef);
  window.sessionStorage.setItem(ACTIVE_BOOKING_ID_KEY, liveRecord.apiBookingId ?? liveRecord.id);
  window.sessionStorage.setItem(ACTIVE_BOOKING_RECORD_KEY, JSON.stringify(liveRecord));
  cacheClientBookingDraftSnapshot(liveRecord);
  const shop = record.shop;
  if (shop?.shopId && shop.shopName) {
    const payload: ClientBookingSelectedShop = {
      shopId: shop.shopId,
      shopName: shop.shopName,
      municipalityLabel: shop.municipalityLabel,
      addressLabel: shop.addressLabel,
      locationMode: shop.locationMode,
    };
    window.sessionStorage.setItem(SELECTED_SHOP_KEY, JSON.stringify(payload));
  }
}

export function notifyActiveBookingChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACTIVE_BOOKING_CHANGED_EVENT));
}

export function getCheckoutPath(record: ClientBookingRecord, listTab?: string) {
  const base = record.requiresPrepayment ? "/clients/booking/checkout/prepaid" : "/clients/booking/checkout";
  if (!listTab) return base;
  return `${base}?tab=${encodeURIComponent(listTab)}`;
}

export function rememberCreateReturnHref() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    CREATE_RETURN_HREF_KEY,
    `${window.location.pathname}${window.location.search}`,
  );
}

export function getCreateReturnHref(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(CREATE_RETURN_HREF_KEY);
}

/** True when the user is returning from Service Summary to the create form. */
export function isReturningToCreateDraft(args: {
  fromProfile: boolean;
  hydrationToken: string;
  shopId?: string | null;
}): boolean {
  const session = getActiveBookingSession();
  if (!session?.draft?.services?.length) return false;
  if (session.bookingRequestSent) return false;
  if (session.status !== "draft") return false;
  if (
    args.shopId &&
    session.shop?.shopId &&
    session.shop.shopId !== args.shopId
  ) {
    return false;
  }
  const returnHref = getCreateReturnHref();
  if (!returnHref) return false;
  if (!args.fromProfile) return true;
  try {
    const url = new URL(returnHref, window.location.origin);
    const savedToken = url.searchParams.get("t") ?? "";
    return savedToken === args.hydrationToken;
  } catch {
    return false;
  }
}
