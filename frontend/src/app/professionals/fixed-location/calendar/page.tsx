"use client";

import * as React from "react";
import ProfessionalFixedLocationCalendar from "../../../../components/common/ProfessionalFixedLocationCalendar";
import {
  type CalendarBlock,
  type CalendarBookingLocation,
  type CalendarBookingStatus,
  type CalendarBookingType,
  type CalendarEvent,
  professionalFixedLocationCalendarData,
} from "./calendar.data";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { parseCalendarSettings } from "../../../../components/common/calendar/calendar-settings.types";
import { mergeCalendarOverviewEvents } from "../../../../components/common/calendar/calendar-overview.mappers";
import {
  useCreateCalendarEntryMutation,
  useDeleteCalendarEntryMutation,
  useGetBusinessSetupQuery,
  useGetCalendarOverviewQuery,
  useUpsertCalendarSettingsMutation,
} from "../../../../store/services/businessApi";

const statusMap: Record<string, CalendarBookingStatus> = {
  requested: "Requested",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No Show",
  "no show": "No Show",
  invalid: "Invalid",
};

const bookingTypeMap: Record<string, CalendarBookingType> = {
  online: "Online",
  offline: "Offline",
  project: "Project",
  request: "Requests",
};

const locationMap: Record<string, CalendarBookingLocation> = {
  fixed: "FL",
  desired: "DL",
};

const timeFromIso = (value?: string | null) => {
  if (!value) return "08:00";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "08:00";
  return parsed.toISOString().slice(11, 16);
};

const dateFromValue = (value?: string | null) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const buildTodayDemoEvents = (
  resources: readonly { id: string; name: string; avatarText: string }[],
  todayIso: string,
  supportedLocations: readonly CalendarBookingLocation[],
): CalendarEvent[] => {
  const first = resources[0]?.id ?? "";
  const second = resources[1]?.id ?? first;
  const third = resources[2]?.id ?? first;
  const canShowDesired = supportedLocations.includes("DL");
  const desiredOrFixed = canShowDesired ? "DL" : "FL";

  return [
    {
      id: "demo-today-34009-a",
      bookingCode: "34009",
      resourceId: first,
      date: todayIso,
      start: "08:00",
      end: "08:15",
      title: "Hot stone full body massage",
      status: "Requested",
      location: "FL",
      bookingType: "Requests",
      bookingScenario: "BR",
      showClientName: "Lissa J",
      details: {
        showPrepayment: true,
        prepaymentPercent: "50",
        prepaymentStatus: "pending",
      },
    },
    {
      id: "demo-today-34009-b",
      bookingCode: "34009",
      resourceId: first,
      date: todayIso,
      start: "08:15",
      end: "08:30",
      title: "Hair Cut",
      status: "Cancelled",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Lissa J",
      details: {
        showPrepayment: true,
        prepaymentPercent: "50",
        prepaymentStatus: "canceled",
      },
    },
    {
      id: "demo-today-34009-c",
      bookingCode: "34009",
      resourceId: first,
      date: todayIso,
      start: "09:00",
      end: "09:15",
      title: "Hair Cut",
      status: "Confirmed",
      location: desiredOrFixed,
      bookingType: "Online",
      bookingScenario: "ER",
      showClientName: "Lissa J",
      details: {
        showPrepayment: true,
        prepaymentPercent: "50",
        prepaymentStatus: "pending",
        responseStatus: "overdue_response",
      },
    },
    {
      id: "demo-today-34009-d",
      bookingCode: "34009",
      resourceId: first,
      date: todayIso,
      start: "09:15",
      end: "09:30",
      title: "Hair Cut",
      status: "Completed",
      location: desiredOrFixed,
      bookingType: "Project",
      showClientName: "Lissa J",
    },
    {
      id: "demo-today-44001-a",
      bookingCode: "44001",
      resourceId: second,
      date: todayIso,
      start: "09:00",
      end: "09:30",
      title: "Make-up",
      status: "Confirmed",
      location: "FL",
      bookingType: "Online",
      showClientName: "Ava K",
    },
    {
      id: "demo-today-55002-a",
      bookingCode: "55002",
      resourceId: third,
      date: todayIso,
      start: "08:30",
      end: "09:00",
      title: "Lashes",
      status: "Completed",
      location: "FL",
      bookingType: "Project",
      showClientName: "Emma S",
    },
  ];
};

export default function FixedLocationCalendarPage() {
  const { data: setupData } = useGetBusinessSetupQuery();
  const { data: calendarOverviewData } = useGetCalendarOverviewQuery();
  const [createCalendarEntry, { isLoading: isCreatingCalendarEntry }] = useCreateCalendarEntryMutation();
  const [deleteCalendarEntry, { isLoading: isDeletingCalendarEntry }] = useDeleteCalendarEntryMutation();
  const [upsertCalendarSettings, { isLoading: isSavingCalendarSettings }] = useUpsertCalendarSettingsMutation();
  const { showSnackbar } = useSnackbar();

  const calendarData = React.useMemo(() => {
    const businessSetup = setupData?.data ?? null;
    const overview = calendarOverviewData?.data ?? null;
    const resources =
      businessSetup?.team_members?.length
        ? businessSetup.team_members.map((member, index) => ({
            id: String(member.id ?? index + 1),
            name: member.full_name,
            avatarText: member.full_name?.trim()?.[0]?.toUpperCase() || "T",
          }))
        : professionalFixedLocationCalendarData.resources;
    const supportedLocations: CalendarBookingLocation[] =
      businessSetup?.location_mode === "fixed"
        ? ["FL"]
        : businessSetup?.location_mode === "desired"
          ? ["DL"]
          : ["FL", "DL"];

    const fallbackResourceId = resources[0]?.id ?? "";
    const apiEvents = mergeCalendarOverviewEvents(
      overview?.entries ?? [],
      overview?.bookings ?? [],
      fallbackResourceId,
    );

    const apiBlocks: CalendarBlock[] = (overview?.entries ?? [])
      .filter((entry) => entry.status === "blocked")
      .map((entry) => ({
        id: `blk-${entry.id}`,
        resourceId: String(entry.team_member_id ?? resources[0]?.id ?? ""),
        date: dateFromValue(entry.date || entry.blocked_time_start || entry.start_date),
        start: entry.start || timeFromIso(entry.blocked_time_start),
        end: entry.end || timeFromIso(entry.blocked_time_end),
        title: entry.title,
        kind: "unavailable" as const,
      }));

    const calendarLocations = Array.from(
      new Set<CalendarBookingLocation>([...supportedLocations, ...apiEvents.map((event) => event.location)]),
    );

    const availability = professionalFixedLocationCalendarData.availability.map((item, index) => ({
      ...item,
      resourceId: resources[index]?.id ?? item.resourceId,
    }));

    const scheduleAvailability = professionalFixedLocationCalendarData.scheduleAvailability.map((item, index) => ({
      ...item,
      resourceId: resources.find((resource) => resource.id === item.resourceId)?.id
        ?? resources[index % resources.length]?.id
        ?? item.resourceId,
    }));

    const scheduleBlocked = professionalFixedLocationCalendarData.scheduleBlocked.map((item, index) => ({
      ...item,
      resourceId: resources.find((resource) => resource.id === item.resourceId)?.id
        ?? resources[index % resources.length]?.id
        ?? item.resourceId,
    }));

    return {
      ...professionalFixedLocationCalendarData,
      initialDate: new Date().toISOString().slice(0, 10),
      resources,
      supportedLocations: calendarLocations,
      availability,
      scheduleAvailability,
      scheduleBlocked,
      events: apiEvents,
      blocks: apiBlocks,
    };
  }, [calendarOverviewData, setupData]);

  const calendarSettings = React.useMemo(
    () => parseCalendarSettings(calendarOverviewData?.data?.settings?.availability, calendarOverviewData?.data?.settings?.design),
    [calendarOverviewData],
  );

  const serviceOptions = React.useMemo(() => {
    const setup = setupData?.data;
    if (!setup?.service_details?.length) {
      return ["Haircut", "Hair Color", "Hair Styling", "Manicure", "Facial"];
    }
    return setup.service_details.map((service) => service.service_title).filter(Boolean);
  }, [setupData]);

  const serviceOrderDefaults = React.useMemo(() => {
    const setup = setupData?.data;
    const categories = Array.from(
      new Set(setup?.service_details?.map((service) => service.category_title).filter(Boolean) ?? []),
    );
    if (!categories.length) {
      return {
        categories: ["Hair", "Nails", "Face treatments", "Body treatments"],
        servicesByCategory: {},
      };
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

  return (
    <ProfessionalFixedLocationCalendar
      data={calendarData}
      calendarSettings={calendarSettings}
      serviceOptions={serviceOptions}
      serviceOrderDefaults={serviceOrderDefaults}
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
    />
  );
}
