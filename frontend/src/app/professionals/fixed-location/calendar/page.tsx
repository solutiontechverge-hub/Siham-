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
import {
  useCreateCalendarEntryMutation,
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

    const apiEvents: CalendarEvent[] = [
      ...(overview?.entries ?? [])
        .filter((entry) => entry.status !== "blocked")
        .map((entry) => ({
          id: `ce-${entry.id}`,
          bookingCode: String(entry.id),
          resourceId: String(entry.team_member_id ?? resources[0]?.id ?? ""),
          date: dateFromValue(entry.date || entry.start_time),
          start: entry.start || timeFromIso(entry.start_time),
          end: entry.end || timeFromIso(entry.end_time),
          title: entry.title,
          status: statusMap[entry.status] ?? "Confirmed",
          location: entry.location_type ? locationMap[entry.location_type] ?? "FL" : "FL",
          bookingType: (entry.booking_type ? bookingTypeMap[entry.booking_type] ?? "Offline" : "Offline") as CalendarBookingType,
          showClientName: entry.client_name ?? undefined,
        })),
      ...(overview?.bookings ?? []).map((booking) => ({
        id: `b-${booking.id}`,
        bookingCode: String(booking.id),
        resourceId: String(booking.team_member_id ?? resources[0]?.id ?? ""),
        date: dateFromValue(booking.date || booking.booking_date || booking.start_time),
        start: booking.start || timeFromIso(booking.start_time),
        end: booking.end || timeFromIso(booking.end_time),
        title: booking.service_title || "Booking",
        status: statusMap[booking.status] ?? "Requested",
        location: booking.location_type ? locationMap[booking.location_type] ?? "FL" : "FL",
        bookingType: (
          booking.booking_type ? bookingTypeMap[booking.booking_type] ?? "Online" : booking.status === "requested" ? "Requests" : "Online"
        ) as CalendarBookingType,
        showClientName: booking.unique_code || booking.notes || undefined,
      })),
    ];
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayDemoEvents = buildTodayDemoEvents(resources, todayIso, supportedLocations);
    const apiEventKeys = new Set(apiEvents.map((event) => `${event.resourceId}-${event.date}-${event.start}-${event.end}-${event.title}`));
    const events = [
      ...todayDemoEvents.filter((event) => !apiEventKeys.has(`${event.resourceId}-${event.date}-${event.start}-${event.end}-${event.title}`)),
      ...apiEvents,
    ];

    const apiBlocks: CalendarBlock[] = (overview?.entries ?? [])
      .filter((entry) => entry.status === "blocked")
      .map((entry) => ({
        id: `blk-${entry.id}`,
        resourceId: String(entry.team_member_id ?? resources[0]?.id ?? ""),
        date: dateFromValue(entry.date || entry.blocked_time_start || entry.start_date),
        start: entry.start || timeFromIso(entry.blocked_time_start),
        end: entry.end || timeFromIso(entry.blocked_time_end),
        title: entry.title,
        kind: "unavailable",
      }));
    const blocks = [
      ...(apiBlocks.some((block) => block.date === todayIso && block.resourceId === (resources[0]?.id ?? ""))
        ? []
        : [
            {
              id: "demo-block-today-1",
              resourceId: resources[0]?.id ?? "",
              date: todayIso,
              start: "08:45",
              end: "09:00",
              title: "Lunch Break",
              kind: "break" as const,
            },
          ]),
      ...apiBlocks,
    ];
    const calendarLocations = Array.from(
      new Set<CalendarBookingLocation>([...supportedLocations, ...events.map((event) => event.location)]),
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
      initialDate: todayIso,
      resources,
      supportedLocations: calendarLocations,
      availability,
      scheduleAvailability,
      scheduleBlocked,
      events,
      blocks,
    };
  }, [calendarOverviewData, setupData]);

  return (
    <ProfessionalFixedLocationCalendar
      data={calendarData}
      initialCalendarSettings={calendarOverviewData?.data?.settings ?? null}
      isSaving={isCreatingCalendarEntry || isSavingCalendarSettings}
      onCreateCalendarEntry={async (payload) => {
        try {
          await createCalendarEntry(payload).unwrap();
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to save calendar entry."),
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

