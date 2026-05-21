"use client";

import * as React from "react";
import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";
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

    const events: CalendarEvent[] = [
      ...(overview?.entries ?? [])
        .filter((entry) => entry.status !== "blocked")
        .map((entry) => ({
          id: `ce-${entry.id}`,
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

    const blocks: CalendarBlock[] = (overview?.entries ?? [])
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

    const availability = professionalFixedLocationCalendarData.availability.map((item, index) => ({
      ...item,
      resourceId: resources[index]?.id ?? item.resourceId,
    }));

    return {
      ...professionalFixedLocationCalendarData,
      resources,
      supportedLocations,
      availability,
      events,
      blocks,
    };
  }, [calendarOverviewData, setupData]);

  return (
    <FixedLocationPageScaffold activeTopTab="Calendar" topTabs={fixedLocationTopTabs}>
      <ProfessionalFixedLocationCalendar
        data={calendarData}
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
    </FixedLocationPageScaffold>
  );
}

