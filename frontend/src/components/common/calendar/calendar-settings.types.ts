import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { BUSINESS_SERVICE_CATEGORY_CATALOG } from "../../../data/businessServiceCategorySlider.data";
import type { PublicBusinessHoursEntry } from "./CalendarPublicBusinessHoursModal";
import type { CalendarDesignDraft } from "./CalendarDesignModal";
import type { BlockTimeDraft } from "./calendar.utils";

export type ScheduleShift = {
  start: string;
  end: string;
};

export type ScheduleAvailabilityRow = {
  id: string;
  resourceIds: string[];
  locations: CalendarBookingLocation[];
  dateFrom: string;
  dateTo: string;
  dayFrom: BlockTimeDraft["dayFrom"];
  dayTo: BlockTimeDraft["dayTo"];
  shifts: ScheduleShift[];
  archived?: boolean;
  excludedDates?: string[];
};

export type ScheduleDateOverride = {
  id: string;
  resourceId: string;
  date: string;
  locations: CalendarBookingLocation[];
  shifts: ScheduleShift[];
  sourceRowId?: string;
};

export type BookingRules = {
  flIntervalHours: string;
  flIntervalMinutes: string;
  dlIntervalHours: string;
  dlIntervalMinutes: string;
  dlMinTimeslotHours: string;
  dlMinTimeslotMinutes: string;
};

export type ServiceOrderSettings = {
  categories: string[];
  servicesByCategory: Record<string, string[]>;
  /** Categories hidden from business setup / listing (data kept). */
  hiddenCategories?: string[];
  /** Services hidden per category title (data kept). */
  hiddenServicesByCategory?: Record<string, string[]>;
};

type RawServiceOrderSettings = Partial<ServiceOrderSettings> & {
  categoryKeys?: readonly string[];
};

function normalizeCategoryToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function serviceOrderCategoryLabelsMatch(a: string, b: string): boolean {
  const left = normalizeCategoryToken(a);
  const right = normalizeCategoryToken(b);
  if (!left || !right) return false;
  if (left === right || left.replace(/\s+/g, "") === right.replace(/\s+/g, "")) {
    return true;
  }

  const resolveGroup = (token: string): string | null => {
    const compact = token.replace(/\s+/g, "");
    let best: { key: string; len: number } | null = null;
    const groups: Array<{ key: string; aliases: string[] }> = [
      { key: "waxing", aliases: ["waxing", "ontharing", "hair removal", "hairremoval"] },
      { key: "facial", aliases: ["facial", "gezichtsbehandeling", "facial treatment", "facetreatment"] },
      { key: "body", aliases: ["body", "lichaamsbehandeling", "body treatment", "bodytreatment"] },
      { key: "makeup", aliases: ["makeup", "make-up", "make up"] },
      { key: "lashes", aliases: ["lashes", "wimpers", "eyelashes"] },
      { key: "brows", aliases: ["brows", "wenkbrauwen", "eyebrows"] },
      { key: "nails", aliases: ["nails", "nagels", "nail"] },
      { key: "hair", aliases: ["hair", "haar"] },
    ];
    for (const entry of BUSINESS_SERVICE_CATEGORY_CATALOG) {
      groups.push({
        key: entry.key,
        aliases: [entry.key, normalizeCategoryToken(entry.label)],
      });
    }
    for (const group of groups) {
      for (const alias of group.aliases) {
        const aliasToken = normalizeCategoryToken(alias);
        const aliasCompact = aliasToken.replace(/\s+/g, "");
        if (token === aliasToken || compact === aliasCompact) {
          if (!best || aliasCompact.length > best.len) {
            best = { key: group.key, len: aliasCompact.length };
          }
        }
      }
    }
    return best?.key ?? null;
  };

  const leftGroup = resolveGroup(left);
  const rightGroup = resolveGroup(right);
  return Boolean(leftGroup && rightGroup && leftGroup === rightGroup);
}

function canonicalizeServiceOrderCategoryLabel(title: string): string {
  const trimmed = String(title ?? "").trim();
  if (!trimmed) return "";
  const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find((entry) =>
    serviceOrderCategoryLabelsMatch(entry.label, trimmed) ||
    serviceOrderCategoryLabelsMatch(entry.key, trimmed),
  );
  return catalogEntry?.label ?? trimmed;
}

function dedupeServiceOrderCategoryList(titles: readonly string[]): string[] {
  const result: string[] = [];
  for (const title of titles) {
    const canonical = canonicalizeServiceOrderCategoryLabel(title);
    if (!canonical) continue;
    if (result.some((entry) => serviceOrderCategoryLabelsMatch(entry, canonical))) {
      continue;
    }
    result.push(canonical);
  }
  return result;
}

export function normalizeServiceOrderSettings(
  raw: RawServiceOrderSettings | null | undefined,
  fallback?: ServiceOrderSettings,
): ServiceOrderSettings {
  const base: ServiceOrderSettings = {
    categories: fallback?.categories ?? [],
    servicesByCategory: fallback?.servicesByCategory ?? {},
    hiddenCategories: fallback?.hiddenCategories ?? [],
    hiddenServicesByCategory: fallback?.hiddenServicesByCategory ?? {},
  };
  if (!raw) {
    return {
      ...base,
      categories: dedupeServiceOrderCategoryList(base.categories),
      hiddenCategories: dedupeServiceOrderCategoryList(base.hiddenCategories ?? []),
    };
  }

  const categories = raw.categories?.length
    ? [...raw.categories]
    : raw.categoryKeys?.length
      ? [...raw.categoryKeys]
      : [...base.categories];

  // Keep fallback categories not already present (alias-aware — no Haar+Hair / Make-Up twice).
  for (const category of base.categories) {
    if (
      !categories.some((entry) => serviceOrderCategoryLabelsMatch(entry, category))
    ) {
      categories.push(category);
    }
  }

  const dedupedCategories = dedupeServiceOrderCategoryList(categories);

  const servicesByCategory: Record<string, string[]> = {};
  const mergeServices = (key: string, services: readonly string[] | undefined) => {
    const canonical = canonicalizeServiceOrderCategoryLabel(key);
    if (!canonical) return;
    const merged = servicesByCategory[canonical] ?? [];
    for (const service of services ?? []) {
      if (
        !merged.some(
          (entry) => entry.toLowerCase().trim() === service.toLowerCase().trim(),
        )
      ) {
        merged.push(service);
      }
    }
    servicesByCategory[canonical] = merged;
  };

  for (const [key, services] of Object.entries(base.servicesByCategory ?? {})) {
    mergeServices(key, services);
  }
  for (const [key, services] of Object.entries(raw.servicesByCategory ?? {})) {
    mergeServices(key, services);
  }

  const hiddenSource = raw.hiddenCategories
    ? [...raw.hiddenCategories]
    : [...(base.hiddenCategories ?? [])];
  const hiddenCategories = dedupeServiceOrderCategoryList(hiddenSource);

  const hiddenServicesByCategory: Record<string, string[]> = {
    ...(base.hiddenServicesByCategory ?? {}),
  };
  for (const [key, services] of Object.entries(
    raw.hiddenServicesByCategory ?? {},
  )) {
    const canonical = canonicalizeServiceOrderCategoryLabel(key);
    if (!canonical) continue;
    const merged = [...(hiddenServicesByCategory[canonical] ?? [])];
    for (const service of services ?? []) {
      if (
        !merged.some(
          (entry) => entry.toLowerCase().trim() === service.toLowerCase().trim(),
        )
      ) {
        merged.push(service);
      }
    }
    hiddenServicesByCategory[canonical] = merged;
  }

  return {
    categories: dedupedCategories,
    servicesByCategory,
    hiddenCategories,
    hiddenServicesByCategory,
  };
}

export type CalendarAvailabilitySettings = {
  publicBusinessHours?: PublicBusinessHoursEntry[];
  bookingRules?: BookingRules;
  serviceOrder?: ServiceOrderSettings;
  scheduleAvailability?: ScheduleAvailabilityRow[];
  dateOverrides?: ScheduleDateOverride[];
};

export type ParsedCalendarSettings = {
  availability: CalendarAvailabilitySettings;
  design: CalendarDesignDraft;
};

export const defaultBookingRules = (): BookingRules => ({
  flIntervalHours: "0",
  flIntervalMinutes: "15",
  dlIntervalHours: "0",
  dlIntervalMinutes: "15",
  dlMinTimeslotHours: "2",
  dlMinTimeslotMinutes: "0",
});

function normalizePublicBusinessHours(
  raw: unknown,
): PublicBusinessHoursEntry[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (entry): entry is PublicBusinessHoursEntry =>
        typeof entry === "object" && entry !== null,
    );
  }
  // Legacy shape: a single hours object was stored instead of an array.
  if (typeof raw === "object" && raw !== null) {
    return [raw as PublicBusinessHoursEntry];
  }
  return [];
}

function asSettingsRecord(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function asColorMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out;
}

export function parseCalendarSettings(
  rawAvailability: unknown,
  rawDesign: unknown,
): ParsedCalendarSettings {
  const availability = asSettingsRecord(rawAvailability) as CalendarAvailabilitySettings;
  const designRaw = asSettingsRecord(rawDesign) as Partial<CalendarDesignDraft>;

  return {
    availability: {
      publicBusinessHours: normalizePublicBusinessHours(availability.publicBusinessHours),
      bookingRules: { ...defaultBookingRules(), ...availability.bookingRules },
      serviceOrder: normalizeServiceOrderSettings(availability.serviceOrder as RawServiceOrderSettings | undefined),
      scheduleAvailability: availability.scheduleAvailability ?? [],
      dateOverrides: availability.dateOverrides ?? [],
    },
    design: {
      scope:
        designRaw.scope === "Services"
          ? "Services"
          : designRaw.scope === "Status"
            ? "Status"
            : designRaw.scope === "Team Members"
              ? "Team Members"
              : "Categories",
      colorsByCategory: asColorMap(designRaw.colorsByCategory),
      colorsByService: asColorMap(designRaw.colorsByService),
      colorsByStatus: asColorMap(designRaw.colorsByStatus) as CalendarDesignDraft["colorsByStatus"],
      colorsByTeamMember: asColorMap(designRaw.colorsByTeamMember),
    },
  };
}
