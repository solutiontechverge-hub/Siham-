import { fmtTimeLabel, minutesSinceMidnight } from "../components/common/calendar/calendar.utils";
import type { BookingCatalogService } from "./bookingServiceCatalog.data";

export type BookingServicePriceType = "fixed" | "starting_from";
export type BookingServiceDiscountType = "fixed" | "percentage";

export type BookingServiceLineItem = {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  startTime?: string;
  endTime?: string;
  priceType?: BookingServicePriceType;
  discount?: { type: BookingServiceDiscountType; amount: number } | null;
  staffResourceId?: string;
};

export type BookingServiceEditDraft = {
  serviceId: string;
  name: string;
  durationMins: string;
  startTime: string;
  endTime: string;
  priceType: BookingServicePriceType | "";
  price: string;
  discountType: BookingServiceDiscountType;
  discountAmount: string;
  staffResourceId: string;
};

export function buildBookingTimeOptions(stepMinutes = 15, startHour = 8, endHour = 22) {
  const options: { label: string; value: string }[] = [];
  for (let mins = startHour * 60; mins <= endHour * 60; mins += stepMinutes) {
    const label = fmtTimeLabel(mins);
    options.push({ label, value: label });
  }
  return options;
}

export function addMinutesToTime(start: string, mins: number) {
  return fmtTimeLabel(minutesSinceMidnight(start) + mins);
}

export function emptyBookingServiceEditDraft(serviceId = ""): BookingServiceEditDraft {
  return {
    serviceId,
    name: "",
    durationMins: "",
    startTime: "",
    endTime: "",
    priceType: "",
    price: "",
    discountType: "fixed",
    discountAmount: "",
    staffResourceId: "",
  };
}

export function buildServiceEditDraftFromCatalog(
  service: BookingCatalogService,
  options?: {
    override?: Partial<BookingServiceLineItem>;
    defaultStartTime?: string;
    defaultStaffResourceId?: string;
  },
): BookingServiceEditDraft {
  const override = options?.override;
  const durationMins = override?.durationMins ?? service.durationMins;
  const startTime = override?.startTime ?? options?.defaultStartTime ?? "10:00";
  const endTime = override?.endTime ?? addMinutesToTime(startTime, durationMins);

  return {
    serviceId: service.id,
    name: override?.name ?? service.name,
    durationMins: String(durationMins),
    startTime,
    endTime,
    priceType: override?.priceType ?? "fixed",
    price: String(override?.price ?? service.price),
    discountType: override?.discount?.type ?? "fixed",
    discountAmount: override?.discount?.amount ? String(override.discount.amount) : "",
    staffResourceId: override?.staffResourceId ?? options?.defaultStaffResourceId ?? "",
  };
}

export function lineItemToOverride(item: BookingServiceLineItem): Partial<BookingServiceLineItem> {
  return {
    name: item.name,
    price: item.price,
    durationMins: item.durationMins,
    startTime: item.startTime,
    endTime: item.endTime,
    priceType: item.priceType,
    discount: item.discount ?? null,
    staffResourceId: item.staffResourceId,
  };
}

export function getBookingServiceEditErrors(draft: BookingServiceEditDraft) {
  const errors: Partial<Record<"name" | "durationMins" | "startTime" | "endTime" | "price", string>> = {};
  if (!draft.name.trim()) errors.name = "Service name is required.";
  const duration = Number.parseInt(draft.durationMins, 10);
  if (!Number.isFinite(duration) || duration <= 0) errors.durationMins = "Duration is required.";
  const price = Number.parseFloat(draft.price.replace(",", "."));
  if (!Number.isFinite(price) || price < 0) errors.price = "Price is required.";
  return errors;
}

export function buildBookingServiceLineItem(
  catalogService: BookingCatalogService,
  draft: BookingServiceEditDraft,
): BookingServiceLineItem {
  const discountAmount = Number.parseFloat(draft.discountAmount.replace(",", "."));
  const discount =
    Number.isFinite(discountAmount) && discountAmount > 0
      ? { type: draft.discountType, amount: discountAmount }
      : null;

  return {
    id: catalogService.id,
    name: draft.name.trim(),
    price: Number.parseFloat(draft.price.replace(",", ".")) || 0,
    durationMins: Number.parseInt(draft.durationMins, 10) || catalogService.durationMins,
    startTime: draft.startTime,
    endTime: draft.endTime,
    priceType: draft.priceType || "fixed",
    discount,
    staffResourceId: draft.staffResourceId || undefined,
  };
}

export function getEffectiveServicePrice(service: BookingServiceLineItem) {
  const base = service.price;
  if (!service.discount?.amount || base <= 0) return base;
  if (service.discount.type === "percentage") {
    return Math.max(0, base - (base * service.discount.amount) / 100);
  }
  return Math.max(0, base - service.discount.amount);
}

export function formatBookingServiceLineMeta(service: BookingServiceLineItem) {
  const parts: string[] = [`${service.durationMins} Mins`];
  parts.push(`€${getEffectiveServicePrice(service)}`);
  if (service.discount?.amount) {
    parts.push(
      service.discount.type === "percentage"
        ? `${service.discount.amount}% off`
        : `€${service.discount.amount} off`,
    );
  }
  return parts.join(" • ");
}
