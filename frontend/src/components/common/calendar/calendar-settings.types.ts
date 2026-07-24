import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BlockTimeDraft } from "./calendar.utils";
import type { PublicBusinessHoursDraft } from "./CalendarPublicBusinessHoursModal";
import type { CalendarDesignDraft } from "./CalendarDesignModal";

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
  if (!raw) return base;

  const categories = raw.categories?.length
    ? [...raw.categories]
    : raw.categoryKeys?.length
      ? [...raw.categoryKeys]
      : base.categories;

  // Keep any fallback categories/services that were added in setup but not yet in saved order.
  for (const category of base.categories) {
    if (!categories.some((entry) => entry.toLowerCase() === category.toLowerCase())) {
      categories.push(category);
    }
  }

  const servicesByCategory = { ...base.servicesByCategory, ...(raw.servicesByCategory ?? {}) };
  for (const category of categories) {
    const existing = servicesByCategory[category] ?? [];
    const fallbackServices = base.servicesByCategory[category] ?? [];
    const merged = [...existing];
    for (const service of fallbackServices) {
      if (!merged.some((entry) => entry.toLowerCase() === service.toLowerCase())) {
        merged.push(service);
      }
    }
    servicesByCategory[category] = merged;
  }

  return {
    categories,
    servicesByCategory,
    hiddenCategories: raw.hiddenCategories ? [...raw.hiddenCategories] : [...(base.hiddenCategories ?? [])],
    hiddenServicesByCategory: {
      ...(base.hiddenServicesByCategory ?? {}),
      ...(raw.hiddenServicesByCategory ?? {}),
    },
  };
}

export type CalendarAvailabilitySettings = {
  publicBusinessHours?: PublicBusinessHoursDraft[];
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
): PublicBusinessHoursDraft[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (entry): entry is PublicBusinessHoursDraft =>
        typeof entry === "object" && entry !== null,
    );
  }
  // Legacy shape: a single hours object was stored instead of an array.
  if (typeof raw === "object" && raw !== null) {
    return [raw as PublicBusinessHoursDraft];
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
