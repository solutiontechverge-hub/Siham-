"use client";

import * as React from "react";
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
  useDispatchBookingNotificationMutation,
  useUpdateCalendarEntryStatusMutation,
  useUpsertCalendarSettingsMutation,
  useUpsertBusinessSetupMutation,
  type BookingNotificationEvent,
  type BusinessServiceDetail,
  type BusinessSetup,
  type CalendarOverviewQuery,
  type UpsertBusinessSetupRequest,
} from "../../../../store/services/businessApi";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import { useBookingRealtimeSync } from "../../../../hooks/useBookingRealtimeSync";
import { applyServiceOrderToServiceCategories } from "../../../../components/common/calendar/serviceOrder.utils";
import type { ServiceOrderSettings } from "../../../../components/common/calendar/calendar-settings.types";

const DEFAULT_TIME_GRID = {
  startHour: 8,
  endHour: 22,
  stepMinutes: 15,
} as const;

const timeFromApi = (value?: string | null) =>
  wallClockTimeFromDateTime(value) ?? "08:00";

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

const mapSetupServicesToCatalog = (
  services: readonly BusinessServiceDetail[] | undefined,
): BookingCatalogService[] =>
  (services ?? []).map((service) => ({
    id: String(service.service_id || service.id),
    name: service.service_title,
    durationMins: parseServiceDurationMins(service.duration_label),
    price: Number(service.price) || 0,
    category: service.category_title || undefined,
  }));

function buildUpsertPayloadFromSetup(
  setup: BusinessSetup,
  serviceCategories: UpsertBusinessSetupRequest["service_categories"],
): UpsertBusinessSetupRequest {
  return {
    location_mode: setup.location_mode,
    business_name: setup.business_name ?? undefined,
    business_about: setup.business_about ?? undefined,
    business_keywords: setup.business_keywords,
    business_media: setup.business_media,
    salon_name: setup.salon_name ?? undefined,
    fixed_location_address: setup.fixed_location_address ?? undefined,
    fixed_location_street_number:
      setup.fixed_location_street_number ?? undefined,
    fixed_location_postal_code: setup.fixed_location_postal_code ?? undefined,
    fixed_location_province: setup.fixed_location_province ?? undefined,
    fixed_location_municipality: setup.fixed_location_municipality ?? undefined,
    service_for: setup.service_for,
    service_categories: serviceCategories,
    project: setup.project ?? undefined,
    book_service_notes: setup.book_service_notes ?? undefined,
    book_service_combinations: setup.book_service_combinations,
    additional_notes: setup.additional_notes ?? undefined,
    price_range: setup.price_range ?? undefined,
    prepayment_percentage:
      setup.prepayment_percentage != null
        ? Number(setup.prepayment_percentage)
        : null,
    prepayment_instruction: setup.prepayment_instruction ?? undefined,
    kilometer_allowance:
      setup.kilometer_allowance != null
        ? Number(setup.kilometer_allowance)
        : null,
    kilometer_allowance_instruction:
      setup.kilometer_allowance_instruction ?? undefined,
    response_time_hours: setup.response_time_hours,
    response_time_minutes: setup.response_time_minutes,
    policy_custom_instruction: setup.policy_custom_instruction ?? undefined,
    appointment_before_hours: setup.appointment_before_hours,
    appointment_before_minutes: setup.appointment_before_minutes,
    late_reschedule_fee_percentage:
      setup.late_reschedule_fee_percentage != null
        ? Number(setup.late_reschedule_fee_percentage)
        : null,
    late_reschedule_policy_instruction:
      setup.late_reschedule_policy_instruction ?? undefined,
    cancellation_before_hours: setup.cancellation_before_hours,
    cancellation_before_minutes: setup.cancellation_before_minutes,
    late_cancellation_fee_percentage:
      setup.late_cancellation_fee_percentage != null
        ? Number(setup.late_cancellation_fee_percentage)
        : null,
    cancellation_policy_instruction:
      setup.cancellation_policy_instruction ?? undefined,
    no_show_fee_percentage:
      setup.no_show_fee_percentage != null
        ? Number(setup.no_show_fee_percentage)
        : null,
    no_show_fee_instruction: setup.no_show_fee_instruction ?? undefined,
    desired_location_area: setup.desired_location_area ?? undefined,
    desired_location_province: setup.desired_location_province ?? undefined,
    desired_location_services: setup.desired_location_services,
    section_sync_settings: setup.section_sync_settings ?? undefined,
    team_members: setup.team_members,
  };
}

export function useFixedLocationCalendarPage() {
  const { data: setupData } = useGetBusinessSetupQuery();
  const businessSetupId = setupData?.data?.id ?? "";
  useBookingRealtimeSync({ businessSetupId: businessSetupId || undefined });
  const [overviewQuery, setOverviewQuery] =
    React.useState<CalendarOverviewQuery>(() =>
      getCalendarQueryDateRange(toIsoLocalDate(new Date()), "day"),
    );
  const handleOverviewDateRangeChange = React.useCallback(
    (range: CalendarOverviewQuery) => {
      setOverviewQuery((prev) =>
        prev.startDate === range.startDate && prev.endDate === range.endDate
          ? prev
          : range,
      );
    },
    [],
  );
  const { data: calendarOverviewData } = useGetCalendarOverviewQuery(
    overviewQuery,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const { data: professionalClientsData } = useGetProfessionalClientsQuery();
  const { data: mollureDirectoryData } = useGetMollureClientDirectoryQuery();
  const [createCalendarEntry, { isLoading: isCreatingCalendarEntry }] =
    useCreateCalendarEntryMutation();
  const [deleteCalendarEntry, { isLoading: isDeletingCalendarEntry }] =
    useDeleteCalendarEntryMutation();
  const [upsertCalendarSettings, { isLoading: isSavingCalendarSettings }] =
    useUpsertCalendarSettingsMutation();
  const [upsertBusinessSetup] = useUpsertBusinessSetupMutation();
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const [dispatchBookingNotification] =
    useDispatchBookingNotificationMutation();
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
        date: dateFromApi(
          entry.date || entry.blocked_time_start || entry.start_date,
        ),
        start: entry.start || timeFromApi(entry.blocked_time_start),
        end: entry.end || timeFromApi(entry.blocked_time_end),
        title: entry.title,
        kind: "unavailable" as const,
      }));

    const calendarLocations = Array.from(
      new Set<CalendarBookingLocation>([
        ...supportedLocations,
        ...apiEvents.map((event) => event.location),
      ]),
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
    () =>
      parseCalendarSettings(
        calendarOverviewData?.data?.settings?.availability,
        calendarOverviewData?.data?.settings?.design,
      ),
    [calendarOverviewData],
  );

  const serviceCatalog = React.useMemo(
    () => mapSetupServicesToCatalog(setupData?.data?.service_details),
    [setupData],
  );

  const serviceOptions = React.useMemo(
    () => serviceCatalog.map((service) => service.name),
    [serviceCatalog],
  );

  const serviceOrderDefaults = React.useMemo(() => {
    const setup = setupData?.data;
    const categories = Array.from(
      new Set(
        setup?.service_details
          ?.map((service) => service.category_title)
          .filter(Boolean) ?? [],
      ),
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

  const fixedLocationAddress =
    setupData?.data?.fixed_location_address ||
    setupData?.data?.salon_name ||
    undefined;

  const lateRescheduleFeePercentDefault =
    setupData?.data?.late_reschedule_fee_percentage != null
      ? String(setupData.data.late_reschedule_fee_percentage)
      : undefined;

  const isSaving =
    isCreatingCalendarEntry ||
    isSavingCalendarSettings ||
    isDeletingCalendarEntry;

  const onCreateCalendarEntry = async (
    payload: Parameters<typeof createCalendarEntry>[0],
  ) => {
    const response = await createCalendarEntry(payload).unwrap();
    return response.data;
  };

  const onDeleteCalendarEntry = async (id: string) => {
    try {
      await deleteCalendarEntry(id).unwrap();
      showSnackbar({
        severity: "success",
        message: "Calendar entry deleted.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to delete calendar entry.",
        ),
      });
      throw error;
    }
  };

  const onSaveCalendarSettings = async (
    payload: Parameters<typeof upsertCalendarSettings>[0],
  ) => {
    try {
      await upsertCalendarSettings(payload).unwrap();
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to save calendar settings.",
        ),
      });
      throw error;
    }
  };

  const onSyncServiceOrderToSetup = async (
    serviceOrder: ServiceOrderSettings,
  ) => {
    const setup = setupData?.data;
    if (!setup) return;

    const fromCategories = (setup.service_categories ?? []).map((entry) => {
      const detail = setup.service_details?.find(
        (item) => String(item.service_id) === String(entry.service_id),
      );
      return {
        ...entry,
        category_title:
          entry.category_title || detail?.category_title || null,
        service_title: entry.service_title || detail?.service_title || null,
      };
    });

    const source =
      fromCategories.length > 0
        ? fromCategories
        : (setup.service_details ?? []).map((detail) => ({
            category_id: String(detail.category_id),
            service_id: String(detail.service_id),
            category_title: detail.category_title,
            service_title: detail.service_title,
            amount: Number(detail.price) || 0,
            duration_label: detail.duration_label ?? null,
            parent_service_id: detail.parent_service_id ?? null,
            is_visible: detail.is_visible !== false,
          }));

    if (!source.length) return;

    const nextCategories = applyServiceOrderToServiceCategories(
      source,
      serviceOrder,
    );
    try {
      await upsertBusinessSetup(
        buildUpsertPayloadFromSetup(setup, nextCategories),
      ).unwrap();
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Service order saved, but business setup sync failed.",
        ),
      });
      throw error;
    }
  };

  const onUpdateBookingStatus = async (
    id: string,
    status: Parameters<typeof updateBookingStatus>[0]["status"],
    options?: Omit<Parameters<typeof updateBookingStatus>[0], "id" | "status">,
  ) => {
    await updateBookingStatus({ id, status, ...options }).unwrap();
  };

  const onDispatchBookingNotification = async (
    id: string,
    event: BookingNotificationEvent,
    options?: Omit<
      Parameters<typeof dispatchBookingNotification>[0],
      "id" | "event"
    >,
  ) => {
    await dispatchBookingNotification({
      id,
      event,
      ...options,
    }).unwrap();
  };

  const onUpdateCalendarEntryStatus = async (
    id: string,
    status: Parameters<typeof updateCalendarEntryStatus>[0]["status"],
  ) => {
    await updateCalendarEntryStatus({ id, status }).unwrap();
  };

  return {
    calendarData,
    handleOverviewDateRangeChange,
    calendarSettings,
    serviceOptions,
    serviceCatalog,
    serviceOrderDefaults,
    clientOptions,
    platformClientOptions,
    fixedLocationAddress,
    lateRescheduleFeePercentDefault,
    isSaving,
    onCreateCalendarEntry,
    onDeleteCalendarEntry,
    onSaveCalendarSettings,
    onSyncServiceOrderToSetup,
    onUpdateBookingStatus,
    onDispatchBookingNotification,
    onUpdateCalendarEntryStatus,
  };
}
