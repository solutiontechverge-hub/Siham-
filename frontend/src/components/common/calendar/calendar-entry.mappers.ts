import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarEntry, CreateCalendarEntryRequest } from "../../../store/services/businessApi";
import {
  type SelectedSlot,
  wallClockDateFromDateTime,
  wallClockTimeFromDateTime,
} from "./calendar.utils";
import { parseCalendarEntryNotes, serializeCalendarEntryNotes } from "./bookingEventDetails";
import type { CalendarBookingDetails } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { UUID_RE } from "../../../lib/uuid";

const statusToApi: Record<CalendarBookingStatus, CreateCalendarEntryRequest["status"]> = {
  Confirmed: "confirmed",
  Requested: "requested",
  "BR Accepted": "br_accepted",
  "In Progress": "in_progress",
  Invalid: "invalid",
  "No Show": "no_show",
  Completed: "completed",
  Cancelled: "cancelled",
};

const statusFromApi: Record<string, CalendarBookingStatus> = {
  requested: "Requested",
  br_accepted: "BR Accepted",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  "in progress": "In Progress",
  completed: "Completed",
  no_show: "No Show",
  "no show": "No Show",
  invalid: "Invalid",
};

const bookingTypeToApi: Record<CalendarBookingType, NonNullable<CreateCalendarEntryRequest["booking_type"]>> = {
  Online: "online",
  Offline: "offline",
  Project: "project",
};

const bookingTypeFromApi: Record<string, CalendarBookingType> = {
  online: "Online",
  offline: "Offline",
  project: "Project",
  request: "Online",
};

const locationToApi = (location: CalendarBookingLocation) => (location === "DL" ? "desired" : "fixed");

const locationFromApi: Record<string, CalendarBookingLocation> = {
  fixed: "FL",
  desired: "DL",
};

export function filterUuidServiceIds(ids: readonly string[]): string[] {
  return ids.filter((id) => UUID_RE.test(id));
}

const toDateTimeInput = (date: string, time: string) => {
  const hhmm = wallClockTimeFromDateTime(time) ?? time.slice(0, 5);
  return `${date}T${hhmm}:00`;
};

const timeFromIso = (value?: string | null) =>
  wallClockTimeFromDateTime(value) ?? "08:00";

const dateFromValue = (value?: string | null) =>
  wallClockDateFromDateTime(value) ?? new Date().toISOString().slice(0, 10);

export function buildCreateCalendarEntryPayload(input: {
  selectedSlot: SelectedSlot;
  title: string;
  clientName: string;
  status: CalendarBookingStatus;
  bookingType: CalendarBookingType;
  location: CalendarBookingLocation;
  serviceIds?: readonly string[];
  notes?: string | null;
  details?: CalendarBookingDetails;
}): CreateCalendarEntryRequest {
  const { selectedSlot, title, clientName, status, bookingType, location, serviceIds, notes, details } = input;

  const teamMemberId = selectedSlot.resourceId?.trim() || "";
  return {
    team_member_id: UUID_RE.test(teamMemberId) ? teamMemberId : null,
    status: statusToApi[status],
    title,
    start_time: toDateTimeInput(selectedSlot.date, selectedSlot.start),
    end_time: toDateTimeInput(selectedSlot.date, selectedSlot.end),
    start_date: selectedSlot.date,
    end_date: selectedSlot.date,
    location_type: locationToApi(location),
    booking_type: bookingTypeToApi[bookingType],
    client_name: clientName,
    notes: notes ?? serializeCalendarEntryNotes(details?.internalNote ?? "", details),
    service_ids: filterUuidServiceIds(serviceIds ?? []),
  };
}

export function mapCalendarEntryToEvent(entry: CalendarEntry, fallbackResourceId: string): CalendarEvent {
  return {
    id: `ce-${entry.id}`,
    bookingCode: entry.unique_code || String(entry.id),
    resourceId: String(entry.team_member_id ?? fallbackResourceId),
    date: dateFromValue(entry.date || entry.start_time || entry.start_date),
    start: entry.start || timeFromIso(entry.start_time),
    end: entry.end || timeFromIso(entry.end_time),
    title: entry.title,
    status: statusFromApi[entry.status] ?? "Confirmed",
    location: entry.location_type ? (locationFromApi[entry.location_type] ?? "FL") : "FL",
    bookingType: entry.booking_type
      ? (bookingTypeFromApi[entry.booking_type] ?? "Offline")
      : "Offline",
    bookingScenario: statusFromApi[entry.status] === "Requested" ? "BR" : undefined,
    showClientName: entry.client_name ?? undefined,
    details: parseCalendarEntryNotes(entry.notes),
  };
}

export function isApiCalendarEventId(eventId: string | null | undefined): boolean {
  return Boolean(eventId?.startsWith("ce-"));
}
