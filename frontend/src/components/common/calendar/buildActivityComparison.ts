import { detectServiceLineChanges, isServiceReorderOnly } from "./bookingRequestNegotiation";
import type { CalendarBookingServiceItem } from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type ActivityComparisonMode = "ebr" | "er" | "silent_updated";

export type ActivityComparisonChangeKind =
  | "changed"
  | "added"
  | "removed"
  | "updated";

export type ActivityComparisonRow = {
  id: string;
  label: string;
  originalValue: string;
  newValue: string;
  changeKind: ActivityComparisonChangeKind;
};

export type ActivityComparison = {
  mode: ActivityComparisonMode;
  headline: string;
  baselineCaption: string;
  proposedCaption: string;
  rows: ActivityComparisonRow[];
};

/** Visible signpost / link copy that deep-links into Activity comparison. */
export const ACTIVITY_COMPARISON_SIGNPOST = "View comparison in Activity";

type ServiceLike = {
  id: string;
  name: string;
  price: number;
  durationMins?: number;
  startTime?: string;
  endTime?: string;
  teamMemberName?: string | null;
  staffResourceId?: string | null;
  guestId?: string | null;
};

type ProductLike = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
};

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return `${amount.toFixed(2)} EUR`;
}

function formatServiceLine(service: ServiceLike): string {
  const parts = [service.name || "Service"];
  if (service.durationMins && service.durationMins > 0) {
    parts.push(`${service.durationMins} min`);
  }
  parts.push(formatMoney(Number(service.price) || 0));
  if (service.startTime && service.endTime) {
    parts.push(`${service.startTime}–${service.endTime}`);
  }
  if (service.teamMemberName?.trim()) {
    parts.push(service.teamMemberName.trim());
  }
  return parts.join(" · ");
}

function formatServiceOrder(services: readonly ServiceLike[]): string {
  const names = services
    .map((service) => service.name?.trim())
    .filter(Boolean);
  return names.length ? names.join(" → ") : "—";
}

function formatProductLine(product: ProductLike): string {
  const qty = product.quantity && product.quantity > 1 ? ` ×${product.quantity}` : "";
  return `${product.name || "Product"}${qty} · ${formatMoney(Number(product.price) || 0)}`;
}

function formatPhone(code?: string | null, number?: string | null): string {
  const c = (code ?? "").trim();
  const n = (number ?? "").trim();
  if (!c && !n) return "—";
  return [c, n].filter(Boolean).join(" ");
}

/** HH:mm only — strips seconds / ISO datetime so "09:00:00" === "09:00". */
function clockHm(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const match = raw.match(/(?:T|\s|^)(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match) return raw;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function formatSchedule(dateISO?: string | null, time?: string | null): string {
  const datePart = (() => {
    if (!dateISO?.trim()) return "";
    // Prefer YYYY-MM-DD prefix when value is a full ISO datetime.
    const day = dateISO.trim().match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? dateISO.trim();
    const dt = new Date(`${day}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return day;
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();
  const timePart = clockHm(time);
  if (!datePart && !timePart) return "—";
  return [datePart, timePart].filter(Boolean).join(" · ");
}

function formatGuestNames(names?: readonly string[] | null): string {
  const cleaned = (names ?? []).map((n) => n.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(", ") : "—";
}

function itemRowLabel(
  preferred?: string | null,
  fallback?: string | null,
  generic = "Service",
): string {
  const name = (preferred ?? "").trim() || (fallback ?? "").trim();
  return name || generic;
}

function formatLocationValue(
  value?: string | Record<string, string | undefined> | null,
): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  const parts = [
    value.street,
    value.number,
    value.postalCode,
    value.municipality,
    value.province,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.join(", ");
}

function toComparableServices(
  services: readonly ServiceLike[],
): CalendarBookingServiceItem[] {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    price: service.price,
    durationMins: service.durationMins ?? 0,
    startTime: service.startTime,
    endTime: service.endTime,
    staffResourceId: service.staffResourceId ?? undefined,
    guestId: service.guestId ?? null,
  }));
}

function modeCopy(mode: ActivityComparisonMode): Pick<
  ActivityComparison,
  "headline" | "baselineCaption" | "proposedCaption"
> {
  if (mode === "ebr") {
    return {
      headline: "Edited Booking Request",
      baselineCaption: "Original Booking Request",
      proposedCaption: "Edited request",
    };
  }
  if (mode === "er") {
    return {
      headline: "Edit Request",
      baselineCaption: "Original Confirmed booking",
      proposedCaption: "Proposed changes",
    };
  }
  return {
    headline: "Updated details",
    baselineCaption: "Previous",
    proposedCaption: "New",
  };
}

export type BuildActivityComparisonInput = {
  mode: ActivityComparisonMode;
  originalServices?: readonly ServiceLike[] | null;
  currentServices?: readonly ServiceLike[] | null;
  editedServiceIds?: readonly string[] | null;
  addedServiceIds?: readonly string[] | null;
  cancelledServiceIds?: readonly string[] | null;
  originalProducts?: readonly ProductLike[] | null;
  currentProducts?: readonly ProductLike[] | null;
  editedProductIds?: readonly string[] | null;
  originalDateISO?: string | null;
  originalTime?: string | null;
  newDateISO?: string | null;
  newTime?: string | null;
  originalPhoneCode?: string | null;
  originalPhoneNumber?: string | null;
  newPhoneCode?: string | null;
  newPhoneNumber?: string | null;
  originalGuestNames?: readonly string[] | null;
  newGuestNames?: readonly string[] | null;
  originalDesiredLocation?: string | Record<string, string | undefined> | null;
  newDesiredLocation?: string | Record<string, string | undefined> | null;
};

/**
 * Builds before/after rows for Activity comparison.
 * Returns null when nothing actually changed.
 */
export function buildActivityComparison(
  input: BuildActivityComparisonInput,
): ActivityComparison | null {
  const rows: ActivityComparisonRow[] = [];
  const mode = input.mode;

  const originalSchedule = formatSchedule(input.originalDateISO, input.originalTime);
  const newSchedule = formatSchedule(input.newDateISO, input.newTime);
  if (
    (input.originalDateISO || input.originalTime || input.newDateISO || input.newTime) &&
    originalSchedule !== newSchedule
  ) {
    rows.push({
      id: "schedule",
      label: "Date & time",
      originalValue: originalSchedule,
      newValue: newSchedule,
      changeKind: mode === "silent_updated" ? "updated" : "changed",
    });
  }

  const originalLoc = formatLocationValue(input.originalDesiredLocation);
  const newLoc = formatLocationValue(input.newDesiredLocation);
  if ((originalLoc || newLoc) && originalLoc !== newLoc) {
    rows.push({
      id: "desired-location",
      label: "Desired location",
      originalValue: originalLoc || "—",
      newValue: newLoc || "—",
      changeKind: mode === "silent_updated" ? "updated" : "changed",
    });
  }

  const originalServices = toComparableServices([...(input.originalServices ?? [])]);
  const currentServices = toComparableServices([...(input.currentServices ?? [])]);
  if (originalServices.length || currentServices.length) {
    if (mode === "silent_updated") {
      if (isServiceReorderOnly(originalServices, currentServices)) {
        const originalOrder = formatServiceOrder(originalServices);
        const newOrder = formatServiceOrder(currentServices);
        if (originalOrder !== newOrder) {
          rows.push({
            id: "service-order",
            label: "Service order",
            originalValue: originalOrder,
            newValue: newOrder,
            changeKind: "updated",
          });
        }
      }
    } else {
      const lineChanges = detectServiceLineChanges(originalServices, currentServices);
      // Empty baseline (fresh create) must not treat every catalog line as Added.
      const allowComputedLineDiffs = originalServices.length > 0;
      const added = new Set(
        [
          ...(input.addedServiceIds ?? []),
          ...(allowComputedLineDiffs ? lineChanges.added : []),
        ].map(String),
      );
      const cancelled = new Set(
        [
          ...(input.cancelledServiceIds ?? []),
          ...(allowComputedLineDiffs ? lineChanges.cancelled : []),
        ].map(String),
      );
      const edited = new Set(
        [
          ...(input.editedServiceIds ?? []),
          ...(allowComputedLineDiffs ? lineChanges.edited : []),
        ].map(String),
      );
      const originalById = new Map(originalServices.map((s) => [s.id, s]));
      const currentById = new Map(currentServices.map((s) => [s.id, s]));

      for (const id of cancelled) {
        const original = originalById.get(id);
        if (!original) continue;
        rows.push({
          id: `service-removed-${id}`,
          label: itemRowLabel(original.name, undefined, "Service"),
          originalValue: formatServiceLine(original),
          newValue: "—",
          changeKind: "removed",
        });
      }

      for (const id of added) {
        const current = currentById.get(id);
        if (!current) continue;
        rows.push({
          id: `service-added-${id}`,
          label: itemRowLabel(current.name, undefined, "Service"),
          originalValue: "—",
          newValue: formatServiceLine(current),
          changeKind: "added",
        });
      }

      for (const id of edited) {
        if (added.has(id) || cancelled.has(id)) continue;
        const original = originalById.get(id);
        const current = currentById.get(id);
        if (!original && current) {
          rows.push({
            id: `service-added-${id}`,
            label: itemRowLabel(current.name, undefined, "Service"),
            originalValue: "—",
            newValue: formatServiceLine(current),
            changeKind: "added",
          });
          continue;
        }
        if (original && !current) {
          rows.push({
            id: `service-removed-${id}`,
            label: itemRowLabel(original.name, undefined, "Service"),
            originalValue: formatServiceLine(original),
            newValue: "—",
            changeKind: "removed",
          });
          continue;
        }
        if (!original || !current) continue;
        if (formatServiceLine(original) === formatServiceLine(current)) continue;
        rows.push({
          id: `service-edited-${id}`,
          label: itemRowLabel(current.name, original.name, "Service"),
          originalValue: formatServiceLine(original),
          newValue: formatServiceLine(current),
          changeKind: "changed",
        });
      }
    }
  }

  const originalProducts = [...(input.originalProducts ?? [])];
  const currentProducts = [...(input.currentProducts ?? [])];
  const editedProductIds = new Set((input.editedProductIds ?? []).map(String));
  if (editedProductIds.size && (originalProducts.length || currentProducts.length)) {
    const originalById = new Map(originalProducts.map((p) => [p.id, p]));
    const currentById = new Map(currentProducts.map((p) => [p.id, p]));
    for (const id of editedProductIds) {
      const original = originalById.get(id);
      const current = currentById.get(id);
      if (!original && current) {
        rows.push({
          id: `product-added-${id}`,
          label: itemRowLabel(current.name, undefined, "Product"),
          originalValue: "—",
          newValue: formatProductLine(current),
          changeKind: "added",
        });
        continue;
      }
      if (original && !current) {
        rows.push({
          id: `product-removed-${id}`,
          label: itemRowLabel(original.name, undefined, "Product"),
          originalValue: formatProductLine(original),
          newValue: "—",
          changeKind: "removed",
        });
        continue;
      }
      if (original && current) {
        if (formatProductLine(original) === formatProductLine(current)) continue;
        rows.push({
          id: `product-edited-${id}`,
          label: itemRowLabel(current.name, original.name, "Product"),
          originalValue: formatProductLine(original),
          newValue: formatProductLine(current),
          changeKind: "changed",
        });
      }
    }
  }

  const originalPhone = formatPhone(input.originalPhoneCode, input.originalPhoneNumber);
  const newPhone = formatPhone(input.newPhoneCode, input.newPhoneNumber);
  if (
    (input.originalPhoneCode ||
      input.originalPhoneNumber ||
      input.newPhoneCode ||
      input.newPhoneNumber) &&
    originalPhone !== newPhone
  ) {
    rows.push({
      id: "phone",
      label: "Phone number",
      originalValue: originalPhone,
      newValue: newPhone,
      changeKind: mode === "silent_updated" ? "updated" : "changed",
    });
  }

  const originalGuests = formatGuestNames(input.originalGuestNames);
  const newGuests = formatGuestNames(input.newGuestNames);
  if (
    ((input.originalGuestNames?.length ?? 0) > 0 ||
      (input.newGuestNames?.length ?? 0) > 0) &&
    originalGuests !== newGuests
  ) {
    const guestKind: ActivityComparisonChangeKind =
      mode === "silent_updated"
        ? "updated"
        : (input.originalGuestNames?.length ?? 0) === 0
          ? "added"
          : (input.newGuestNames?.length ?? 0) === 0
            ? "removed"
            : "changed";
    rows.push({
      id: "guests",
      label: "Guest names",
      originalValue: originalGuests,
      newValue: newGuests,
      changeKind: guestKind,
    });
  }

  if (!rows.length) return null;

  return {
    mode,
    ...modeCopy(mode),
    rows,
  };
}

export function findActivityComparisonItem<
  T extends {
    bookingId: string;
    bookingCode?: string;
    kind: string;
    comparison?: ActivityComparison | null;
  },
>(
  items: readonly T[],
  options?: {
    bookingRef?: string | null;
    mode?: ActivityComparisonMode;
  },
): T | null {
  const ref = options?.bookingRef?.replace(/^#/, "").trim() ?? "";
  const mode = options?.mode;

  const matchesBooking = (item: T) => {
    if (!ref) return true;
    const code = (item.bookingCode ?? "").replace(/^#/, "").trim();
    return (
      item.bookingId === ref ||
      item.bookingId === options?.bookingRef ||
      code === ref ||
      item.bookingCode === options?.bookingRef
    );
  };

  const withComparison = items.filter(
    (item) => matchesBooking(item) && (item.comparison?.rows.length ?? 0) > 0,
  );
  if (!withComparison.length) return null;

  if (mode) {
    const byMode = withComparison.find((item) => item.comparison?.mode === mode);
    if (byMode) return byMode;
    // Edited hover asks for er/ebr — don't fall back to silent Updated rows.
    if (mode === "er" || mode === "ebr") {
      const editRow = withComparison.find(
        (item) =>
          item.comparison?.mode === "er" || item.comparison?.mode === "ebr",
      );
      if (editRow) return editRow;
      const editKind = withComparison.find(
        (item) =>
          item.kind === "edit_request_sent" ||
          item.kind === "edit_request_suggest" ||
          item.kind === "edit_request_accepted",
      );
      if (editKind) return editKind;
    }
  }

  // Prefer the drill-in "sent" / "updated" entries over suggest/accepted.
  const preferred = withComparison.find(
    (item) =>
      item.kind === "edit_request_sent" || item.kind === "booking_updated",
  );
  return preferred ?? withComparison[0] ?? null;
}
