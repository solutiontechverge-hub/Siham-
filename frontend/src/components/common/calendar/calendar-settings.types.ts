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
      serviceOrder: availability.serviceOrder,
      scheduleAvailability: availability.scheduleAvailability ?? [],
      dateOverrides: availability.dateOverrides ?? [],
    },
    design: {
      scope: designRaw.scope === "Services" ? "Services" : "Categories",
      colorsByCategory: designRaw.colorsByCategory ?? {},
      colorsByService: designRaw.colorsByService ?? {},
    },
  };
}
