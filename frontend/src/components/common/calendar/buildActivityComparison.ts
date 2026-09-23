import { isServiceReorderOnly } from "./bookingRequestNegotiation";
import type { CalendarBookingServiceItem } from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type ActivityComparisonMode = "ebr" | "er" | "silent_updated";

export type ActivityComparisonChangeKind =
  | "changed"
  | "added"
  | "removed"
  | "updated";

/** Who a comparison row belongs to — used to group Activity Comparison. */
export type ActivityComparisonSection =
  | "main_client"
  | "guest"
  | "model"
  | "planning";

export const ACTIVITY_COMPARISON_SECTION_ORDER: readonly ActivityComparisonSection[] =
  ["main_client", "guest", "model", "planning"];

/** Fallback role labels when booking data has no person name. */
export const ACTIVITY_COMPARISON_SECTION_LABELS: Record<
  ActivityComparisonSection,
  string
> = {
  main_client: "Client",
  guest: "Guest",
  model: "Model",
  planning: "Planning",
};

export type ActivityComparisonRow = {
  id: string;
  label: string;
  originalValue: string;
  newValue: string;
  changeKind: ActivityComparisonChangeKind;
  /** Role bucket for ordering (Client → Guest → Model → Planning). */
  section?: ActivityComparisonSection;
  /** Group key — person id for extras, or `main_client`. */
  sectionKey?: string;
  /** Dynamic heading from booking participant / client name. */
  sectionLabel?: string;
};

export type ActivityComparisonSectionGroup = {
  key: string;
  section: ActivityComparisonSection;
  label: string;
  rows: ActivityComparisonRow[];
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
  guestId?: string | null;
};

type ParticipantLike = {
  id?: string | null;
  name?: string | null;
  isRequester?: boolean;
  participantType?: "model" | "planning" | "guest" | "buffer" | "notes" | null;
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

function sectionForParticipant(
  person: ParticipantLike | null | undefined,
): ActivityComparisonSection | null {
  if (!person) return null;
  // Requester / company contact = Client — never Guest (participantType is often unset).
  if (person.isRequester) return "main_client";
  const kind = person.participantType;
  if (kind === "buffer" || kind === "notes") return null;
  if (kind === "planning" || (person.name ?? "").trim() === "Planning") {
    return "planning";
  }
  if (kind === "model") return "model";
  if (kind === "guest") return "guest";
  // No type + not requester: company/main-client contact in people[] — leave unmapped
  // so resolve treats their guestId as Client (same as isMainClientAssignedLine).
  return null;
}

/** Dynamic heading from participant name + role (e.g. "Guest umer", "alizaCompany"). */
export function activityComparisonSectionHeading(
  section: ActivityComparisonSection,
  name?: string | null,
): string {
  const n = (name ?? "").trim();
  if (section === "main_client") return n || ACTIVITY_COMPARISON_SECTION_LABELS.main_client;
  if (section === "planning") {
    if (!n || /^planning$/i.test(n)) return ACTIVITY_COMPARISON_SECTION_LABELS.planning;
    return n;
  }
  if (section === "model") {
    if (!n || /^model$/i.test(n)) return ACTIVITY_COMPARISON_SECTION_LABELS.model;
    return n;
  }
  // guest — "Guest umer" pattern when name doesn't already start with Guest
  if (!n || /^guest$/i.test(n)) return ACTIVITY_COMPARISON_SECTION_LABELS.guest;
  return /^guest\b/i.test(n) ? n : `Guest ${n}`;
}

type ParticipantRegistry = {
  byId: Map<string, { section: ActivityComparisonSection; name: string }>;
  clientName: string;
};

/** Map person id → role + name; resolve main client display name from booking data. */
export function buildParticipantSectionMap(
  participants?: readonly ParticipantLike[] | null,
): Map<string, ActivityComparisonSection> {
  const map = new Map<string, ActivityComparisonSection>();
  for (const [id, meta] of buildParticipantRegistry(participants).byId) {
    map.set(id, meta.section);
  }
  return map;
}

function buildParticipantRegistry(
  participants?: readonly ParticipantLike[] | null,
  clientNameHint?: string | null,
): ParticipantRegistry {
  const byId = new Map<string, { section: ActivityComparisonSection; name: string }>();
  let clientName = (clientNameHint ?? "").trim();

  for (const person of participants ?? []) {
    const id = String(person.id ?? "").trim();
    const name = (person.name ?? "").trim();
    if (person.isRequester && name && !clientName) clientName = name;

    const section = sectionForParticipant(person);
    if (!id || !section) continue;

    const existing = byId.get(id);
    // Prefer Guest/Model/Planning over a later requester duplicate of the same id.
    if (existing && existing.section !== "main_client" && section === "main_client") {
      continue;
    }
    if (!existing || existing.section === "main_client") {
      byId.set(id, { section, name });
    }
    if (section === "main_client" && name && !clientName) clientName = name;
  }

  return {
    byId,
    clientName: clientName || ACTIVITY_COMPARISON_SECTION_LABELS.main_client,
  };
}

type SectionMeta = {
  section: ActivityComparisonSection;
  sectionKey: string;
  sectionLabel: string;
};

function resolveSectionMeta(
  guestId: string | null | undefined,
  registry: ParticipantRegistry,
): SectionMeta {
  const id = String(guestId ?? "").trim();
  const clientMeta = (): SectionMeta => ({
    section: "main_client",
    sectionKey: "main_client",
    sectionLabel: registry.clientName,
  });
  if (!id) return clientMeta();
  const hit = registry.byId.get(id);
  // Unknown / requester / company contact ids → Client (not Guest).
  if (!hit || hit.section === "main_client") {
    return {
      section: "main_client",
      sectionKey: "main_client",
      sectionLabel: hit?.name || registry.clientName,
    };
  }
  return {
    section: hit.section,
    sectionKey: id,
    sectionLabel: activityComparisonSectionHeading(hit.section, hit.name),
  };
}

/** Group rows by dynamic sectionKey; only non-empty groups; ordered by role then first seen. */
export function groupActivityComparisonSections(
  rows: readonly ActivityComparisonRow[],
): ActivityComparisonSectionGroup[] {
  const groups: ActivityComparisonSectionGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const row of rows) {
    const section = row.section ?? "main_client";
    const key = row.sectionKey ?? section;
    const label =
      row.sectionLabel?.trim() ||
      ACTIVITY_COMPARISON_SECTION_LABELS[section];
    let idx = indexByKey.get(key);
    if (idx == null) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({ key, section, label, rows: [] });
    }
    groups[idx].rows.push(row);
  }

  return groups.sort((a, b) => {
    const ao = ACTIVITY_COMPARISON_SECTION_ORDER.indexOf(a.section);
    const bo = ACTIVITY_COMPARISON_SECTION_ORDER.indexOf(b.section);
    if (ao !== bo) return ao - bo;
    return 0;
  });
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

/** Client + guest often share a catalog id — never key comparison maps by id alone. */
function comparisonLineKey(item: {
  id: string;
  guestId?: string | null;
}): string {
  return `${item.guestId ?? ""}:${item.id}`;
}

/** Expand bare catalog ids from persisted edit payloads to every matching line key. */
function lineKeysForBareIds(
  bareIds: Iterable<string>,
  byKey: Map<string, { id: string }>,
): string[] {
  const ids = new Set([...bareIds].map(String));
  if (!ids.size) return [];
  const keys: string[] = [];
  for (const [key, item] of byKey) {
    if (ids.has(String(item.id))) keys.push(key);
  }
  return keys;
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
  /** Guests / people used to map service.guestId → Client / Guest / Model / Planning. */
  participants?: readonly ParticipantLike[] | null;
  /** Main booker / company display name for the Client heading. */
  clientName?: string | null;
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
  const registry = buildParticipantRegistry(input.participants, input.clientName);
  const rowMeta = (guestId?: string | null): SectionMeta =>
    resolveSectionMeta(guestId, registry);
  const clientMeta = rowMeta(null);

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
      ...clientMeta,
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
      ...clientMeta,
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
            ...clientMeta,
          });
        }
      }
    } else {
      const originalByKey = new Map(
        originalServices.map((s) => [comparisonLineKey(s), s]),
      );
      const currentByKey = new Map(
        currentServices.map((s) => [comparisonLineKey(s), s]),
      );
      // Empty baseline (fresh create) must not treat every catalog line as Added.
      const allowComputedLineDiffs = originalServices.length > 0;
      const cancelledKeys = new Set<string>(
        lineKeysForBareIds(input.cancelledServiceIds ?? [], originalByKey),
      );
      const addedKeys = new Set<string>(
        lineKeysForBareIds(input.addedServiceIds ?? [], currentByKey),
      );
      const editedKeys = new Set<string>([
        ...lineKeysForBareIds(input.editedServiceIds ?? [], currentByKey),
        ...lineKeysForBareIds(input.editedServiceIds ?? [], originalByKey),
      ]);

      if (allowComputedLineDiffs) {
        for (const [key] of originalByKey) {
          if (!currentByKey.has(key)) cancelledKeys.add(key);
        }
        for (const [key, current] of currentByKey) {
          const original = originalByKey.get(key);
          if (!original) addedKeys.add(key);
          else if (formatServiceLine(original) !== formatServiceLine(current)) {
            editedKeys.add(key);
          }
        }
      }

      // Bare-id lists can name a catalog id shared by client + guest — keep only
      // keys that are actually gone / new / changed for that person.
      for (const key of [...cancelledKeys]) {
        if (currentByKey.has(key) || !originalByKey.has(key)) cancelledKeys.delete(key);
      }
      for (const key of [...addedKeys]) {
        if (originalByKey.has(key) || !currentByKey.has(key)) addedKeys.delete(key);
      }
      for (const key of [...editedKeys]) {
        if (addedKeys.has(key) || cancelledKeys.has(key)) {
          editedKeys.delete(key);
          continue;
        }
        const original = originalByKey.get(key);
        const current = currentByKey.get(key);
        if (!original || !current) {
          editedKeys.delete(key);
          continue;
        }
        if (formatServiceLine(original) === formatServiceLine(current)) {
          editedKeys.delete(key);
        }
      }

      for (const key of cancelledKeys) {
        const original = originalByKey.get(key);
        if (!original) continue;
        rows.push({
          id: `service-removed-${key}`,
          label: itemRowLabel(original.name, undefined, "Service"),
          originalValue: formatServiceLine(original),
          newValue: "—",
          changeKind: "removed",
          ...rowMeta(original.guestId),
        });
      }

      for (const key of addedKeys) {
        const current = currentByKey.get(key);
        if (!current) continue;
        rows.push({
          id: `service-added-${key}`,
          label: itemRowLabel(current.name, undefined, "Service"),
          originalValue: "—",
          newValue: formatServiceLine(current),
          changeKind: "added",
          ...rowMeta(current.guestId),
        });
      }

      for (const key of editedKeys) {
        const original = originalByKey.get(key);
        const current = currentByKey.get(key);
        if (!original || !current) continue;
        rows.push({
          id: `service-edited-${key}`,
          label: itemRowLabel(current.name, original.name, "Service"),
          originalValue: formatServiceLine(original),
          newValue: formatServiceLine(current),
          changeKind: "changed",
          ...rowMeta(current.guestId ?? original.guestId),
        });
      }
    }
  }

  const originalProducts = [...(input.originalProducts ?? [])];
  const currentProducts = [...(input.currentProducts ?? [])];
  const editedProductIds = new Set((input.editedProductIds ?? []).map(String));
  if (editedProductIds.size && (originalProducts.length || currentProducts.length)) {
    const originalByKey = new Map(
      originalProducts.map((p) => [comparisonLineKey(p), p]),
    );
    const currentByKey = new Map(
      currentProducts.map((p) => [comparisonLineKey(p), p]),
    );
    const productKeys = new Set([
      ...lineKeysForBareIds(editedProductIds, originalByKey),
      ...lineKeysForBareIds(editedProductIds, currentByKey),
    ]);
    for (const key of productKeys) {
      const original = originalByKey.get(key);
      const current = currentByKey.get(key);
      if (!original && current) {
        rows.push({
          id: `product-added-${key}`,
          label: itemRowLabel(current.name, undefined, "Product"),
          originalValue: "—",
          newValue: formatProductLine(current),
          changeKind: "added",
          ...rowMeta(current.guestId),
        });
        continue;
      }
      if (original && !current) {
        rows.push({
          id: `product-removed-${key}`,
          label: itemRowLabel(original.name, undefined, "Product"),
          originalValue: formatProductLine(original),
          newValue: "—",
          changeKind: "removed",
          ...rowMeta(original.guestId),
        });
        continue;
      }
      if (original && current) {
        if (formatProductLine(original) === formatProductLine(current)) continue;
        rows.push({
          id: `product-edited-${key}`,
          label: itemRowLabel(current.name, original.name, "Product"),
          originalValue: formatProductLine(original),
          newValue: formatProductLine(current),
          changeKind: "changed",
          ...rowMeta(current.guestId ?? original.guestId),
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
      ...clientMeta,
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
    const renameName =
      newGuests !== "—" ? newGuests : originalGuests !== "—" ? originalGuests : "";
    // Aggregate identity rename (guest + model names). Prefer Guest heading;
    // model-only renames still land here (ponytail: split per-person when needed).
    rows.push({
      id: "guests",
      label: "Guest names",
      originalValue: originalGuests,
      newValue: newGuests,
      changeKind: guestKind,
      section: "guest",
      sectionKey: "guest-names",
      sectionLabel: activityComparisonSectionHeading("guest", renameName),
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
