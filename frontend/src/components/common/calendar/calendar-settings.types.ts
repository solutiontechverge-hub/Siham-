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
  };
  if (!raw) return base;

  const categories = raw.categories?.length
    ? [...raw.categories]
    : raw.categoryKeys?.length
      ? [...raw.categoryKeys]
      : base.categories;

  const servicesByCategory = { ...base.servicesByCategory, ...(raw.servicesByCategory ?? {}) };
  for (const category of categories) {
    servicesByCategory[category] ??= [];
  }

  return { categories, servicesByCategory };
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

export function parseCalendarSettings(
  rawAvailability: Record<string, unknown> | null | undefined,
  rawDesign: Record<string, unknown> | null | undefined,
): ParsedCalendarSettings {
  const availability = (rawAvailability ?? {}) as CalendarAvailabilitySettings;
  const designRaw = (rawDesign ?? {}) as Partial<CalendarDesignDraft>;

  return {
    availability: {
      publicBusinessHours: availability.publicBusinessHours ?? [],
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
      colorsByCategory: designRaw.colorsByCategory ?? {},
      colorsByService: designRaw.colorsByService ?? {},
      colorsByStatus: designRaw.colorsByStatus ?? {},
      colorsByTeamMember: designRaw.colorsByTeamMember ?? {},
    },
  };
}
