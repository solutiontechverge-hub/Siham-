import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarEntry, CreateCalendarEntryRequest } from "../../../store/services/businessApi";
import type { SelectedSlot } from "./calendar.utils";
import { parseCalendarEntryNotes, serializeCalendarEntryNotes } from "./bookingEventDetails";
import type { CalendarBookingDetails } from "../../../app/professionals/fixed-location/calendar/calendar.data";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function filterUuidServiceIds(ids: readonly string[]): string[] {
  return ids.filter((id) => UUID_RE.test(id));
}

const toDateTimeInput = (date: string, time: string) => `${date}T${time}:00`;

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
