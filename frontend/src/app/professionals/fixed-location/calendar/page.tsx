"use client";

import * as React from "react";
import ProfessionalFixedLocationCalendar from "../../../../components/common/ProfessionalFixedLocationCalendar";
import {
  type CalendarBlock,
  type CalendarBookingLocation,
  type CalendarEvent,
  type CalendarResource,
} from "./calendar.data";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { parseCalendarSettings } from "../../../../components/common/calendar/calendar-settings.types";
import { mergeCalendarOverviewEvents } from "../../../../components/common/calendar/calendar-overview.mappers";
import {
  getCalendarQueryDateRange,
  toIsoLocalDate,
  wallClockDateFromDateTime,
  wallClockTimeFromDateTime,
} from "../../../../components/common/calendar/calendar.utils";
import {
  useCreateCalendarEntryMutation,
  useDeleteCalendarEntryMutation,
  useGetBusinessSetupQuery,
  useGetCalendarOverviewQuery,
  useGetMollureClientDirectoryQuery,
  useGetProfessionalClientsQuery,
  useUpdateBookingStatusMutation,
  useUpdateCalendarEntryStatusMutation,
  useUpsertCalendarSettingsMutation,
  type BusinessServiceDetail,
  type CalendarOverviewQuery,
} from "../../../../store/services/businessApi";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import { useBookingRealtimeSync } from "../../../../hooks/useBookingRealtimeSync";

const DEFAULT_TIME_GRID = { startHour: 8, endHour: 22, stepMinutes: 15 } as const;

const timeFromApi = (value?: string | null) => wallClockTimeFromDateTime(value) ?? "08:00";

const dateFromApi = (value?: string | null) =>
  wallClockDateFromDateTime(value) ?? new Date().toISOString().slice(0, 10);

const parseServiceDurationMins = (label?: string | null) => {
  if (!label) return 30;
  const hours = label.match(/(\d+)\s*h/i);
  const mins = label.match(/(\d+)\s*m(?:in)?/i);
  let total = 0;
  if (hours) total += Number(hours[1]) * 60;
  if (mins) total += Number(mins[1]);
  if (total > 0) return total;
  const fallback = label.match(/(\d+)/);
  return fallback ? Number(fallback[1]) : 30;
};

const mapSetupServicesToCatalog = (services: readonly BusinessServiceDetail[] | undefined): BookingCatalogService[] =>
  (services ?? []).map((service) => ({
    id: String(service.service_id || service.id),
    name: service.service_title,
    durationMins: parseServiceDurationMins(service.duration_label),
    price: Number(service.price) || 0,
  }));

export default function FixedLocationCalendarPage() {
  const { data: setupData } = useGetBusinessSetupQuery();
  const businessSetupId = setupData?.data?.id ?? "";
  useBookingRealtimeSync({ businessSetupId: businessSetupId || undefined });
  const [overviewQuery, setOverviewQuery] = React.useState<CalendarOverviewQuery>(() =>
    getCalendarQueryDateRange(toIsoLocalDate(new Date()), "day"),
  );
  const handleOverviewDateRangeChange = React.useCallback((range: CalendarOverviewQuery) => {
    setOverviewQuery((prev) =>
      prev.startDate === range.startDate && prev.endDate === range.endDate ? prev : range,
    );
  }, []);
  const { data: calendarOverviewData } = useGetCalendarOverviewQuery(overviewQuery, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const { data: professionalClientsData } = useGetProfessionalClientsQuery();
  const { data: mollureDirectoryData } = useGetMollureClientDirectoryQuery();
  const [createCalendarEntry, { isLoading: isCreatingCalendarEntry }] = useCreateCalendarEntryMutation();
  const [deleteCalendarEntry, { isLoading: isDeletingCalendarEntry }] = useDeleteCalendarEntryMutation();
  const [upsertCalendarSettings, { isLoading: isSavingCalendarSettings }] = useUpsertCalendarSettingsMutation();
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const [updateCalendarEntryStatus] = useUpdateCalendarEntryStatusMutation();
  const { showSnackbar } = useSnackbar();

  const calendarData = React.useMemo(() => {
    const businessSetup = setupData?.data ?? null;
    const overview = calendarOverviewData?.data ?? null;
    const resources: CalendarResource[] =
      businessSetup?.team_members?.map((member, index) => ({
        id: String(member.id ?? `team-${index + 1}`),
        name: member.full_name?.trim() || `Team Member ${index + 1}`,
        avatarText: member.full_name?.trim()?.[0]?.toUpperCase() || "T",
      })) ?? [];

    if (!resources.length) {
      resources.push({ id: "unassigned", name: "Unassigned", avatarText: "U" });
    }

    const supportedLocations: CalendarBookingLocation[] =
      businessSetup?.location_mode === "fixed"
        ? ["FL"]
        : businessSetup?.location_mode === "desired"
          ? ["DL"]
          : ["FL", "DL"];

    const fallbackResourceId = resources[0]?.id ?? "unassigned";
    const apiEvents: CalendarEvent[] = mergeCalendarOverviewEvents(
      overview?.entries ?? [],
      overview?.bookings ?? [],
      fallbackResourceId,
    );

    const apiBlocks: CalendarBlock[] = (overview?.entries ?? [])
      .filter((entry) => entry.status === "blocked")
      .map((entry) => ({
        id: `blk-${entry.id}`,
        resourceId: String(entry.team_member_id ?? resources[0]?.id ?? ""),
        date: dateFromApi(entry.date || entry.blocked_time_start || entry.start_date),
        start: entry.start || timeFromApi(entry.blocked_time_start),
        end: entry.end || timeFromApi(entry.blocked_time_end),
        title: entry.title,
        kind: "unavailable" as const,
      }));

    const calendarLocations = Array.from(
      new Set<CalendarBookingLocation>([...supportedLocations, ...apiEvents.map((event) => event.location)]),
    );

    return {
      subTabs: ["Overview", "Schedule", "Settings"] as const,
      initialSubTab: "Overview" as const,
      initialView: "day" as const,
      initialDate: toIsoLocalDate(new Date()),
      resources,
      supportedLocations: calendarLocations,
      availability: [],
      timeGrid: DEFAULT_TIME_GRID,
      events: apiEvents,
      blocks: apiBlocks,
      scheduleAvailability: [],
      scheduleBlocked: [],
    };
  }, [calendarOverviewData, setupData]);

  const calendarSettings = React.useMemo(
    () => parseCalendarSettings(calendarOverviewData?.data?.settings?.availability, calendarOverviewData?.data?.settings?.design),
    [calendarOverviewData],
  );

  const serviceCatalog = React.useMemo(
    () => mapSetupServicesToCatalog(setupData?.data?.service_details),
    [setupData],
  );

  const serviceOptions = React.useMemo(() => serviceCatalog.map((service) => service.name), [serviceCatalog]);

  const serviceOrderDefaults = React.useMemo(() => {
    const setup = setupData?.data;
    const categories = Array.from(
      new Set(setup?.service_details?.map((service) => service.category_title).filter(Boolean) ?? []),
    );
    if (!categories.length) {
      return { categories: [], servicesByCategory: {} };
    }
    const servicesByCategory: Record<string, string[]> = {};
    for (const category of categories) {
      servicesByCategory[category] =
        setup?.service_details
          ?.filter((service) => service.category_title === category)
          .map((service) => service.service_title)
          .filter(Boolean) ?? [];
    }
    return { categories, servicesByCategory };
  }, [setupData]);

  const clientOptions = React.useMemo(
    () =>
      (professionalClientsData?.data ?? []).map((client) => ({
        name: client.display_name,
        email: client.email,
      })),
    [professionalClientsData],
  );

  const platformClientOptions = React.useMemo(
    () =>
      (mollureDirectoryData?.data ?? []).map((client) => ({
        name: client.name,
        email: client.email,
      })),
    [mollureDirectoryData],
  );

  return (
    <ProfessionalFixedLocationCalendar
      data={calendarData}
      onDateRangeChange={handleOverviewDateRangeChange}
      calendarSettings={calendarSettings}
      serviceOptions={serviceOptions}
      serviceCatalog={serviceCatalog}
      serviceOrderDefaults={serviceOrderDefaults}
      clientOptions={clientOptions}
      platformClientOptions={platformClientOptions}
      fixedLocationAddress={setupData?.data?.fixed_location_address || setupData?.data?.salon_name || undefined}
      lateRescheduleFeePercentDefault={
        setupData?.data?.late_reschedule_fee_percentage != null
          ? String(setupData.data.late_reschedule_fee_percentage)
          : undefined
      }
      isSaving={isCreatingCalendarEntry || isSavingCalendarSettings || isDeletingCalendarEntry}
      onCreateCalendarEntry={async (payload) => {
        try {
          const response = await createCalendarEntry(payload).unwrap();
          return response.data;
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to save calendar entry."),
          });
          throw error;
        }
      }}
      onDeleteCalendarEntry={async (id) => {
        try {
          await deleteCalendarEntry(id).unwrap();
          showSnackbar({ severity: "success", message: "Calendar entry deleted." });
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to delete calendar entry."),
          });
          throw error;
        }
      }}
      onSaveCalendarSettings={async (payload) => {
        try {
          await upsertCalendarSettings(payload).unwrap();
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to save calendar settings."),
          });
          throw error;
        }
      }}
      onUpdateBookingStatus={async (id, status) => {
        await updateBookingStatus({ id, status }).unwrap();
      }}
      onUpdateCalendarEntryStatus={async (id, status) => {
        await updateCalendarEntryStatus({ id, status }).unwrap();
      }}
    />
  );
}
