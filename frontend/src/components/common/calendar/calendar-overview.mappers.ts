import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarBooking, CalendarEntry } from "../../../store/services/businessApi";
import { wallClockDateFromDateTime, wallClockTimeFromDateTime } from "./calendar.utils";
import { parseCalendarEntryNotes, parseStoredEbrFromNotes } from "./bookingEventDetails";

const statusFromApi: Record<string, CalendarBookingStatus> = {
  requested: "Requested",
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
  return wallClockTimeFromDateTime(value) ?? "08:00";
};

const dateFromValue = (value?: string | null) => {
  return wallClockDateFromDateTime(value) ?? new Date().toISOString().slice(0, 10);
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
    details: parseCalendarEntryNotes(entry.notes),
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
  const parsedNotes = parseCalendarEntryNotes(booking.notes);
  const ebrServices = parsedNotes?.services?.length ? parsedNotes.services : null;
  const title = ebrServices?.[0]?.name || booking.service_title || "Booking";
  const clientName = booking.customer_name || booking.client_name || undefined;
  const isRequestBooking =
    isRequested || booking.booking_type === "request" || booking.status?.toLowerCase() === "requested";
  const teamMemberId =
    booking.team_member_id != null && String(booking.team_member_id).trim()
      ? String(booking.team_member_id)
      : fallbackResourceId || "unassigned";
  const ebrMeta = status === "Cancelled" ? null : parseStoredEbrFromNotes(booking.notes);
  const isOutgoingEbr =
    status !== "Cancelled" &&
    parsedNotes?.lastEditedBy === "professional" &&
    (parsedNotes?.requestDirection === "outgoing" || parsedNotes?.responseStatus === "suggestion_for_change");
  const isIncomingClientEbr =
    status !== "Cancelled" &&
    Boolean(ebrMeta) &&
    (ebrMeta!.status === "pending" || ebrMeta!.status === "suggested") &&
    (ebrMeta!.lastEditedBy === "client" ||
      Boolean(ebrMeta!.clientNote) ||
      parsedNotes?.lastEditedBy === "client");
  const clientNote = ebrMeta?.clientNote?.trim() || "";
  const noteText = clientNote || parsedNotes?.internalNote?.trim() || "";

  return {
    id: `b-${booking.id}`,
    bookingCode: booking.unique_code || String(booking.id),
    resourceId: teamMemberId,
    // Prefer normalized `date` from overview API; raw booking_date used to be a
    // timezone-shifted Date ISO string (e.g. 2026-07-09 -> 2026-07-08T19:00:00.000Z).
    date: dateFromValue(booking.date || booking.booking_date || booking.start_time),
    start,
    end,
    title,
    status,
    location: booking.location_type ? (locationFromApi[booking.location_type] ?? "FL") : "FL",
    bookingType: isRequestBooking
      ? "Requests"
      : booking.booking_type
        ? (bookingTypeFromApi[booking.booking_type] ?? "Online")
        : "Online",
    bookingScenario: isIncomingClientEbr ? "EBR" : isRequestBooking ? "BR" : undefined,
    showClientName: clientName,
    notes: booking.notes ?? null,
    details: {
      clientEmail: booking.customer_email ?? "",
      requestDirection: isOutgoingEbr ? "outgoing" : "incoming",
      services: ebrServices ?? [
        {
          id: booking.service_id || `svc-b-${booking.id}`,
          name: title,
          durationMins: bookingDurationMins(start, end),
          price: Number(booking.total_price) || 0,
        },
      ],
      ...(parsedNotes?.products?.length ? { products: parsedNotes.products } : {}),
      ...(parsedNotes?.editedServiceIds?.length ? { editedServiceIds: parsedNotes.editedServiceIds } : {}),
      ...(isIncomingClientEbr
        ? { lastEditedBy: "client" as const, responseStatus: "suggestion_for_change" as const }
        : parsedNotes?.lastEditedBy
          ? { lastEditedBy: parsedNotes.lastEditedBy }
          : {}),
      ...(!isIncomingClientEbr && parsedNotes?.responseStatus
        ? { responseStatus: parsedNotes.responseStatus }
        : {}),
      phoneNumber: booking.contact_number ?? "",
      showPrepayment: String(booking.prepayment_status ?? "").toLowerCase() === "paid"
        || String(booking.prepayment_status ?? "").toLowerCase() === "required",
      ...(noteText
        ? {
            internalNote: noteText,
            showInternalNote: true,
          }
        : {}),
      ...(parsedNotes
        ? {
            showLateRescheduling: parsedNotes.showLateRescheduling,
            lateRescheduleFeePercent: parsedNotes.lateRescheduleFeePercent,
            showLateCancellation: parsedNotes.showLateCancellation,
            lateCancellationFeePercent: parsedNotes.lateCancellationFeePercent,
            showPrepayment: parsedNotes.showPrepayment || String(booking.prepayment_status ?? "").toLowerCase() === "paid"
              || String(booking.prepayment_status ?? "").toLowerCase() === "required",
            prepaymentPercent: parsedNotes.prepaymentPercent,
            paymentMethod: parsedNotes.paymentMethod,
            showKilometerAllowance: parsedNotes.showKilometerAllowance,
            ...(parsedNotes.cancellationReason ? { cancellationReason: parsedNotes.cancellationReason } : {}),
            ...(parsedNotes.clientSnapshot ? { clientSnapshot: parsedNotes.clientSnapshot } : {}),
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
