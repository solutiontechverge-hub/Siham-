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
  teamMemberId?: string | null;
  teamMemberName?: string | null;
  guestId?: string | null;
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

/** Minutes from start to end; 0 when either time is missing. May be negative if end is earlier. */
export function minutesBetweenTimes(start: string, end: string) {
  if (!start.trim() || !end.trim()) return 0;
  const diff = minutesSinceMidnight(end) - minutesSinceMidnight(start);
  return Number.isFinite(diff) ? diff : 0;
}

/**
 * Duration between two clock times for display.
 * If end is earlier on the clock, treat it as the next day.
 */
export function positiveMinutesBetweenTimes(start: string, end: string) {
  const diff = minutesBetweenTimes(start, end);
  if (diff > 0) return diff;
  if (diff === 0 || !Number.isFinite(diff)) return 0;
  return diff + 24 * 60;
}

export function formatTimeWindowDurationLabel(
  start?: string | null,
  end?: string | null,
  fallbackLabel?: string | null,
) {
  const fromTimes = positiveMinutesBetweenTimes(start ?? "", end ?? "");
  if (fromTimes > 0) return formatDurationMinsLabel(fromTimes);
  const fromFallback = parseDurationMinsLabel(fallbackLabel);
  return fromFallback ? formatDurationMinsLabel(fromFallback) : "";
}

export function formatServiceTimeRange(start?: string, end?: string) {
  const startTime = start?.trim();
  if (!startTime) return undefined;
  const endTime = end?.trim();
  return endTime ? `${startTime}–${endTime}` : startTime;
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
  const startTime = override?.startTime ?? options?.defaultStartTime ?? "10:00";
  const catalogDuration = override?.durationMins ?? service.durationMins;
  const endTime = override?.endTime ?? addMinutesToTime(startTime, catalogDuration);
  const windowMins = minutesBetweenTimes(startTime, endTime);
  const durationMins = windowMins > 0 ? windowMins : catalogDuration;

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
  if (!draft.startTime.trim()) errors.startTime = "Start time is required.";
  if (!draft.endTime.trim()) {
    errors.endTime = "End time is required.";
  } else if (
    draft.startTime.trim() &&
    minutesBetweenTimes(draft.startTime, draft.endTime) <= 0
  ) {
    errors.endTime = "End time must be after start time.";
  }
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

  const startTime = draft.startTime.trim() || undefined;
  const endTime = draft.endTime.trim() || undefined;
  const windowMins =
    startTime && endTime ? minutesBetweenTimes(startTime, endTime) : 0;
  const durationMins =
    windowMins > 0
      ? windowMins
      : Number.parseInt(draft.durationMins, 10) || catalogService.durationMins;

  return {
    id: catalogService.id,
    name: draft.name.trim(),
    price: Number.parseFloat(draft.price.replace(",", ".")) || 0,
    durationMins,
    startTime,
    endTime,
    priceType: draft.priceType || "fixed",
    discount,
    staffResourceId: draft.staffResourceId || undefined,
  };
}

export function getEffectiveServicePrice(service: BookingServiceLineItem) {
  const base = service.price;
  if (!service.discount?.amount || base <= 0) return base;
  const discounted =
    service.discount.type === "percentage"
      ? Math.max(0, base - (base * service.discount.amount) / 100)
      : Math.max(0, base - service.discount.amount);
  return Math.round((discounted + Number.EPSILON) * 100) / 100;
}

export function getServiceDiscountAmount(service: BookingServiceLineItem) {
  return Math.round(
    (Math.max(0, service.price - getEffectiveServicePrice(service)) +
      Number.EPSILON) *
      100,
  ) / 100;
}

/** Fill missing per-service start/end so each line has its own window (sequential from booking start). */
export function ensureServiceStartEndTimes<
  T extends { durationMins: number; startTime?: string; endTime?: string },
>(
  services: readonly T[],
  bookingStart?: string,
): T[] {
  if (!services.length) return [];
  let cursor =
    bookingStart?.trim() ||
    services.find((service) => service.startTime?.trim())?.startTime ||
    "08:00";

  return services.map((service) => {
    const duration = service.durationMins > 0 ? service.durationMins : 60;
    if (service.startTime?.trim() && service.endTime?.trim()) {
      cursor = service.endTime.trim();
      const windowMins = minutesBetweenTimes(
        service.startTime,
        service.endTime,
      );
      if (windowMins > 0 && windowMins !== service.durationMins) {
        return { ...service, durationMins: windowMins };
      }
      return service;
    }
    const startTime = service.startTime?.trim() || cursor;
    const endTime =
      service.endTime?.trim() || addMinutesToTime(startTime, duration);
    cursor = endTime;
    return { ...service, startTime, endTime };
  });
}

/**
 * Recalculate every service window sequentially from bookingStart.
 * Use when the top-level booking start changes so nested lines stay in sync.
 */
export function recalculateServiceStartEndTimes<
  T extends BookingServiceLineItem,
>(services: readonly T[], bookingStart?: string): T[] {
  if (!services.length) return [];
  let cursor =
    bookingStart?.trim() ||
    services.find((service) => service.startTime?.trim())?.startTime ||
    "08:00";

  return services.map((service) => {
    const duration = service.durationMins > 0 ? service.durationMins : 60;
    const startTime = cursor;
    const endTime = addMinutesToTime(startTime, duration);
    cursor = endTime;
    return { ...service, startTime, endTime };
  });
}

function splitBackIntoGroups<T extends BookingServiceLineItem>(
  groups: readonly (readonly T[])[],
  flattened: readonly T[],
): T[][] {
  let index = 0;
  return groups.map((group) => group.map(() => flattened[index++]));
}

/**
 * Apply one sequential timeline across multiple service groups (e.g. client then guests).
 */
export function recalculateGroupedServiceStartEndTimes<
  T extends BookingServiceLineItem,
>(
  groups: readonly (readonly T[])[],
  bookingStart?: string,
): T[][] {
  const flat = groups.flat();
  if (!flat.length) return groups.map(() => []);
  return splitBackIntoGroups(
    groups,
    recalculateServiceStartEndTimes(flat, bookingStart),
  );
}

/** Fill missing windows across groups on one shared cursor, keeping existing times. */
export function ensureGroupedServiceStartEndTimes<
  T extends BookingServiceLineItem,
>(
  groups: readonly (readonly T[])[],
  bookingStart?: string,
): T[][] {
  const flat = groups.flat();
  if (!flat.length) return groups.map(() => []);
  return splitBackIntoGroups(
    groups,
    ensureServiceStartEndTimes(flat, bookingStart),
  );
}

/** Place services sequentially from bookingStart, overwriting any prior times. */
export function placeServicesSequentially(
  services: readonly BookingServiceLineItem[],
  bookingStart?: string,
): BookingServiceLineItem[] {
  return recalculateServiceStartEndTimes(services, bookingStart);
}

/** Chronological sort by start time; items without start stay at the end. */
export function sortServicesByStartTime(
  services: readonly BookingServiceLineItem[],
): BookingServiceLineItem[] {
  return [...services].sort((a, b) => {
    const aStart = a.startTime?.trim();
    const bStart = b.startTime?.trim();
    if (!aStart && !bStart) return 0;
    if (!aStart) return 1;
    if (!bStart) return -1;
    return minutesSinceMidnight(aStart) - minutesSinceMidnight(bStart);
  });
}

/** Parse a duration string like "45", "45 Mins", "165 min", or "2 hr 45 min". */
export function parseDurationMinsLabel(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const text = value.trim().toLowerCase();
  const hourMatch = text.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  const minMatch = text.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
  const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0;
  let mins = 0;
  if (minMatch) {
    mins = Number.parseInt(minMatch[1], 10);
  } else if (!hourMatch) {
    mins = Number.parseInt(text.replace(/[^\d]/g, ""), 10);
  }
  const total =
    (Number.isFinite(hours) ? hours : 0) * 60 +
    (Number.isFinite(mins) ? mins : 0);
  return total > 0 ? total : null;
}

/** 60 min = 1 hr. Short buffers stay in min; longer ones also show hours. */
export function formatDurationMinsLabel(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return "";
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours <= 0) return `${rest} min`;
  if (rest <= 0) return hours === 1 ? "1 hr" : `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

/**
 * Latest end time among timed booking lines (services / planning / buffer).
 * Falls back to `fallbackStart` when nothing timed is present.
 */
export function getLatestTimedEnd(
  items: readonly {
    startTime?: string | null;
    endTime?: string | null;
  }[],
  fallbackStart?: string,
): string {
  let latest = "";
  let latestMin = -1;
  for (const item of items) {
    const end = item.endTime?.trim();
    if (!end) continue;
    const mins = minutesSinceMidnight(end);
    if (mins >= latestMin) {
      latestMin = mins;
      latest = end;
    }
  }
  return latest || fallbackStart?.trim() || "";
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

export function reorderById<T extends { id: string }>(
  list: readonly T[],
  fromId: string,
  toId: string,
): T[] {
  if (fromId === toId) return [...list];
  const from = list.findIndex((item) => item.id === fromId);
  const to = list.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function reorderMatchingItems<T extends { id: string }>(
  list: readonly T[],
  fromId: string,
  toId: string,
  match: (item: T) => boolean,
): T[] {
  const subset = list.filter(match);
  const reordered = reorderById(subset, fromId, toId);
  let index = 0;
  return list.map((item) => (match(item) ? reordered[index++]! : item));
}

/** Reorder a service container and keep windows sequential from the original first start. */
export function reorderServicesInContainer(
  services: readonly BookingServiceLineItem[],
  fromId: string,
  toId: string,
): BookingServiceLineItem[] {
  const next = reorderById(services, fromId, toId);
  const anchor =
    services[0]?.startTime?.trim() ||
    next.find((service) => service.startTime?.trim())?.startTime;
  return recalculateServiceStartEndTimes(next, anchor);
}

export type PlanningWindowItem = {
  planningStartTime?: string;
  planningEndTime?: string;
  planningDuration?: string;
};

/** Lay planning rows out sequentially from `bookingStart` using each row's duration. */
export function resequencePlanningWindows<T extends PlanningWindowItem>(
  items: readonly T[],
  bookingStart?: string,
): T[] {
  const anchor =
    bookingStart?.trim() ||
    items.find((item) => item.planningStartTime?.trim())?.planningStartTime?.trim() ||
    "";
  if (!anchor) return [...items];
  let cursor = anchor;
  return items.map((item) => {
    const duration =
      parseDurationMinsLabel(item.planningDuration) ||
      positiveMinutesBetweenTimes(
        item.planningStartTime ?? "",
        item.planningEndTime ?? "",
      ) ||
      0;
    const startTime = cursor;
    const endTime = duration > 0 ? addMinutesToTime(startTime, duration) : "";
    if (endTime) cursor = endTime;
    return {
      ...item,
      planningStartTime: startTime,
      planningEndTime: endTime || undefined,
      planningDuration:
        duration > 0
          ? formatDurationMinsLabel(duration)
          : item.planningDuration,
    };
  });
}
