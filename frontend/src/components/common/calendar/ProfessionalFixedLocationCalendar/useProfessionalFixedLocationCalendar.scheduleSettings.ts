import * as React from "react";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import { buildOrderedBookingServiceCategories } from "../../../../data/bookingServiceCatalog.data";
import type { CalendarDesignDraft } from "../CalendarDesignModal";
import { createEmptyPublicBusinessHoursDraft } from "../CalendarPublicBusinessHoursModal";
import type {
  PublicBusinessHoursDraft,
  PublicBusinessHoursEntry,
} from "../CalendarPublicBusinessHoursModal";
import type { EditAvailabilityDraft } from "../CalendarEditAvailabilityModal";
import { archiveFullyPastScheduleRows } from "../calendar-schedule.utils";
import {
  defaultBookingRules,
  normalizeServiceOrderSettings,
  type BookingRules,
  type ParsedCalendarSettings,
  type ScheduleAvailabilityRow,
  type ServiceOrderSettings,
} from "../calendar-settings.types";
import {
  dedupeServiceOrderSettings,
  shouldPreferTemplateServiceOrderDefaults,
} from "../serviceOrder.utils";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { UpsertCalendarSettingsRequest } from "../../../../store/services/businessApi";
import {
  emptyCalendarDesignDraft,
  lookupCategoryColor as lookupCategoryColorPure,
  resolveEventCategoryKey as resolveEventCategoryKeyPure,
  resolveEventColors as resolveEventColorsPure,
} from "./useProfessionalFixedLocationCalendar.helpers";

export type UseProfessionalFixedLocationCalendarScheduleSettingsArgs = {
  calendarSettings?: ParsedCalendarSettings | null;
  serviceOrderDefaults?: ServiceOrderSettings;
  serviceNameToCategoryKey?: Readonly<Record<string, string>>;
  selectableServiceCatalog: readonly BookingCatalogService[];
  supportedLocations: readonly CalendarBookingLocation[];
  onSaveCalendarSettings?: (
    payload: UpsertCalendarSettingsRequest,
  ) => Promise<void>;
};

export function useProfessionalFixedLocationCalendarScheduleSettings({
  calendarSettings,
  serviceOrderDefaults,
  serviceNameToCategoryKey = {},
  selectableServiceCatalog,
  supportedLocations,
  onSaveCalendarSettings,
}: UseProfessionalFixedLocationCalendarScheduleSettingsArgs) {
  const [publicBusinessHoursDraft, setPublicBusinessHoursDraft] =
    React.useState<PublicBusinessHoursDraft>(() =>
      createEmptyPublicBusinessHoursDraft(),
    );

  const [designDraft, setDesignDraft] = React.useState<CalendarDesignDraft>(
    () => emptyCalendarDesignDraft(),
  );
  const [appliedDesign, setAppliedDesign] = React.useState<CalendarDesignDraft>(
    () => emptyCalendarDesignDraft(),
  );
  const [bookingRules, setBookingRules] = React.useState<BookingRules>(() =>
    defaultBookingRules(),
  );
  const [scheduleRows, setScheduleRows] = React.useState<
    ScheduleAvailabilityRow[]
  >([]);
  const autoArchivePersistedRef = React.useRef<string | null>(null);
  const scheduleHydratedRef = React.useRef(false);
  const [dateOverrides, setDateOverrides] = React.useState<
    ParsedCalendarSettings["availability"]["dateOverrides"]
  >([]);
  const [serviceOrderDraft, setServiceOrderDraft] =
    React.useState<ServiceOrderSettings>(() =>
      dedupeServiceOrderSettings(
        normalizeServiceOrderSettings(undefined, {
          categories: serviceOrderDefaults?.categories ?? [],
          servicesByCategory: serviceOrderDefaults?.servicesByCategory ?? {},
        }),
      ),
    );
  const selectableServiceCategories = React.useMemo(() => {
    const patchedServices = selectableServiceCatalog.map((service) => ({
      ...service,
      category: service.category?.trim() || "Services",
    }));
    return buildOrderedBookingServiceCategories(
      patchedServices,
      serviceOrderDraft,
    );
  }, [selectableServiceCatalog, serviceOrderDraft]);
  const [scheduleResourceFilter, setScheduleResourceFilter] = React.useState<
    string[]
  >([]);
  const [editAvailabilityOpen, setEditAvailabilityOpen] = React.useState(false);
  const [editAvailabilityDraft, setEditAvailabilityDraft] =
    React.useState<EditAvailabilityDraft>(() => ({
      resourceId: "",
      date: "",
      locations: [...supportedLocations],
      shifts: [{ start: "09:00", end: "17:00" }],
    }));

  React.useEffect(() => {
    if (!calendarSettings) return;
    setBookingRules(
      calendarSettings.availability.bookingRules ?? defaultBookingRules(),
    );
    const rawSchedule =
      calendarSettings.availability.scheduleAvailability ?? [];
    setScheduleRows(archiveFullyPastScheduleRows(rawSchedule));
    scheduleHydratedRef.current = true;
    setDateOverrides(calendarSettings.availability.dateOverrides ?? []);
    setAppliedDesign(calendarSettings.design);
    setDesignDraft(calendarSettings.design);
    if (
      calendarSettings.availability.serviceOrder &&
      !shouldPreferTemplateServiceOrderDefaults(
        calendarSettings.availability.serviceOrder,
      )
    ) {
      setServiceOrderDraft(
        dedupeServiceOrderSettings(
          normalizeServiceOrderSettings(
            calendarSettings.availability.serviceOrder,
            serviceOrderDefaults,
          ),
        ),
      );
    } else if (serviceOrderDefaults) {
      setServiceOrderDraft(
        dedupeServiceOrderSettings(
          normalizeServiceOrderSettings(serviceOrderDefaults),
        ),
      );
    }
  }, [calendarSettings, serviceOrderDefaults]);

  const persistAvailabilitySettings = React.useCallback(
    async (next: {
      bookingRules?: BookingRules;
      scheduleAvailability?: ScheduleAvailabilityRow[];
      dateOverrides?: ParsedCalendarSettings["availability"]["dateOverrides"];
      serviceOrder?: ServiceOrderSettings;
      publicBusinessHours?: PublicBusinessHoursEntry[];
      design?: CalendarDesignDraft;
    }) => {
      if (!onSaveCalendarSettings) {
        throw new Error("Calendar settings save is unavailable.");
      }
      const serverSchedule =
        calendarSettings?.availability.scheduleAvailability ?? [];
      // When scheduleAvailability is omitted, never fall back to an
      // unhydrated empty local array — that would wipe a good server save.
      const scheduleAvailability =
        next.scheduleAvailability !== undefined
          ? next.scheduleAvailability
          : scheduleHydratedRef.current
            ? scheduleRows
            : serverSchedule.length > 0
              ? serverSchedule
              : scheduleRows;

      await onSaveCalendarSettings({
        availability: {
          bookingRules: next.bookingRules ?? bookingRules,
          scheduleAvailability,
          dateOverrides: next.dateOverrides ?? dateOverrides,
          serviceOrder: next.serviceOrder ?? serviceOrderDraft,
          publicBusinessHours:
            next.publicBusinessHours ??
            calendarSettings?.availability.publicBusinessHours,
        },
        design: next.design ?? appliedDesign,
      });
    },
    [
      appliedDesign,
      bookingRules,
      calendarSettings?.availability.publicBusinessHours,
      calendarSettings?.availability.scheduleAvailability,
      dateOverrides,
      onSaveCalendarSettings,
      scheduleRows,
      serviceOrderDraft,
    ],
  );

  React.useEffect(() => {
    if (!calendarSettings || !onSaveCalendarSettings) return;
    const raw = calendarSettings.availability.scheduleAvailability ?? [];
    const next = archiveFullyPastScheduleRows(raw);
    if (next === raw) return;
    const fingerprint = next
      .map((row) => `${row.id}:${row.archived ? 1 : 0}`)
      .join("|");
    if (autoArchivePersistedRef.current === fingerprint) return;
    autoArchivePersistedRef.current = fingerprint;
    void persistAvailabilitySettings({ scheduleAvailability: next });
  }, [calendarSettings, onSaveCalendarSettings, persistAvailabilitySettings]);

  const resolveEventCategoryKey = React.useCallback(
    (event: CalendarEvent) =>
      resolveEventCategoryKeyPure(event, serviceNameToCategoryKey),
    [serviceNameToCategoryKey],
  );

  const lookupCategoryColor = React.useCallback(
    (categoryKey: string | null | undefined) =>
      lookupCategoryColorPure(categoryKey, appliedDesign.colorsByCategory),
    [appliedDesign.colorsByCategory],
  );

  const resolveEventColors = React.useCallback(
    (event: CalendarEvent) =>
      resolveEventColorsPure(event, appliedDesign, serviceNameToCategoryKey),
    [appliedDesign, serviceNameToCategoryKey],
  );

  return {
    appliedDesign,
    autoArchivePersistedRef,
    bookingRules,
    dateOverrides,
    designDraft,
    editAvailabilityDraft,
    editAvailabilityOpen,
    lookupCategoryColor,
    persistAvailabilitySettings,
    publicBusinessHoursDraft,
    resolveEventCategoryKey,
    resolveEventColors,
    scheduleHydratedRef,
    scheduleResourceFilter,
    scheduleRows,
    selectableServiceCategories,
    serviceOrderDraft,
    setAppliedDesign,
    setBookingRules,
    setDateOverrides,
    setDesignDraft,
    setEditAvailabilityDraft,
    setEditAvailabilityOpen,
    setPublicBusinessHoursDraft,
    setScheduleResourceFilter,
    setScheduleRows,
    setServiceOrderDraft,
  };
}
