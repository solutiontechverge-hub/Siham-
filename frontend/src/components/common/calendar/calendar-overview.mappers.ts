import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarBooking, CalendarEntry } from "../../../store/services/businessApi";

const statusFromApi: Record<string, CalendarBookingStatus> = {
  requested: "Requested",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No Show",
  "no show": "No Show",
  invalid: "Invalid",
};

const bookingTypeFromApi: Record<string, CalendarBookingType> = {
  online: "Online",
  offline: "Offline",
  project: "Project",
  request: "Requests",
};

const locationFromApi: Record<string, CalendarBookingLocation> = {
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

const bookingDurationMins = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(15, eh * 60 + em - (sh * 60 + sm));
};

export function mapCalendarEntryToOverviewEvent(
  entry: CalendarEntry,
  fallbackResourceId: string,
): CalendarEvent {
  const status = statusFromApi[entry.status] ?? "Confirmed";
  const isRequested = status === "Requested";

  return {
    id: `ce-${entry.id}`,
    bookingCode: entry.unique_code || String(entry.id),
    resourceId: String(entry.team_member_id ?? fallbackResourceId),
    date: dateFromValue(entry.date || entry.start_time || entry.start_date),
    start: entry.start || timeFromIso(entry.start_time),
    end: entry.end || timeFromIso(entry.end_time),
    title: entry.title,
    status,
    location: entry.location_type ? (locationFromApi[entry.location_type] ?? "FL") : "FL",
    bookingType: entry.booking_type
      ? (bookingTypeFromApi[entry.booking_type] ?? "Offline")
      : isRequested
        ? "Requests"
        : "Offline",
    bookingScenario: isRequested ? "BR" : undefined,
    showClientName: entry.client_name ?? undefined,
    details: entry.notes
      ? {
          internalNote: entry.notes,
          showInternalNote: true,
        }
      : undefined,
  };
}

export function mapCalendarBookingToEvent(
  booking: CalendarBooking,
  fallbackResourceId: string,
): CalendarEvent {
  const status = statusFromApi[booking.status] ?? "Requested";
  const isRequested = status === "Requested";
  const start = booking.start || timeFromIso(booking.start_time);
  const end = booking.end || timeFromIso(booking.end_time);
  const title = booking.service_title || "Booking";
  const clientName = booking.customer_name || booking.client_name || undefined;

  return {
    id: `b-${booking.id}`,
    bookingCode: booking.unique_code || String(booking.id),
    resourceId: String(booking.team_member_id ?? fallbackResourceId),
    date: dateFromValue(booking.date || booking.booking_date || booking.start_time),
    start,
    end,
    title,
    status,
    location: booking.location_type ? (locationFromApi[booking.location_type] ?? "FL") : "FL",
    bookingType: booking.booking_type
      ? (bookingTypeFromApi[booking.booking_type] ?? "Online")
      : isRequested
        ? "Requests"
        : "Online",
    bookingScenario: isRequested ? "BR" : undefined,
    showClientName: clientName,
    details: {
      clientEmail: "",
      requestDirection: "incoming",
      services: [
        {
          id: booking.service_id || `svc-b-${booking.id}`,
          name: title,
          durationMins: bookingDurationMins(start, end),
          price: Number(booking.total_price) || 0,
        },
      ],
      ...(booking.notes
        ? {
            internalNote: booking.notes,
            showInternalNote: true,
          }
        : {}),
    },
  };
}

export function mergeCalendarOverviewEvents(
  entries: readonly CalendarEntry[],
  bookings: readonly CalendarBooking[],
  fallbackResourceId: string,
): CalendarEvent[] {
  const entryEvents = entries
    .filter((entry) => entry.status !== "blocked")
    .map((entry) => mapCalendarEntryToOverviewEvent(entry, fallbackResourceId));

  const bookingEvents = bookings.map((booking) => mapCalendarBookingToEvent(booking, fallbackResourceId));

  const bookingKeys = new Set(
    bookingEvents.map((event) => `${event.date}|${event.start}|${event.end}|${event.resourceId}`),
  );

  const dedupedEntries = entryEvents.filter(
    (event) => !bookingKeys.has(`${event.date}|${event.start}|${event.end}|${event.resourceId}`),
  );

  return [...dedupedEntries, ...bookingEvents];
}
