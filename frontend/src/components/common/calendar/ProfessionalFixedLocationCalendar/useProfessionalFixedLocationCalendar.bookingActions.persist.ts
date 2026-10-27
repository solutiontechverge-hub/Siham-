import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingNotificationEvent } from "../../../../store/services/businessApi";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { parseApiCalendarEventId } from "../bookingEventDetails";
import { isAllowedStatusForBookingType } from "../bookingStatus";
import type { UseProfessionalFixedLocationCalendarBookingActionsArgs } from "./useProfessionalFixedLocationCalendar.bookingActions";

/** RTK/fetch rejections are plain objects — Next overlay shows "[object Object]". */
function rethrowAsError(error: unknown, fallback: string): never {
  if (error instanceof Error) throw error;
  throw new Error(getApiErrorMessage(error, fallback) || fallback);
}

/** Status API persist + notification dispatch (ponytail: subdomain of bookingActions). */
export function useProfessionalFixedLocationCalendarBookingActionsPersist(
  args: UseProfessionalFixedLocationCalendarBookingActionsArgs,
) {
  const {
    events,
    viewingBookingEvent,
    onUpdateBookingStatus,
    onUpdateCalendarEntryStatus,
    onDispatchBookingNotification,
    showSnackbar,
  } = args;

  const persistEventStatus = React.useCallback(
    async (
      eventId: string,
      status: CalendarEvent["status"],
      options?: {
        notification_event?: BookingNotificationEvent;
        notify_incoming_er?: boolean;
        initiated_by?: "client" | "professional";
        notes?: string | null;
        total_price?: number | null;
        booking_date?: string | null;
        start_time?: string | null;
        end_time?: string | null;
      },
    ) => {
      const current =
        events.find((event) => event.id === eventId) ?? viewingBookingEvent;
      // Discard/reject Requested BR → Invalid must work even if bookingType looks Offline.
      const allowInvalidFromRequest =
        status === "Invalid" &&
        (current?.status === "Requested" || current?.status === "BR Accepted");
      if (
        current &&
        !allowInvalidFromRequest &&
        !isAllowedStatusForBookingType(status, current.bookingType)
      ) {
        showSnackbar({
          severity: "warning",
          message: "This status is not allowed for offline bookings.",
        });
        throw new Error("This status is not allowed for offline bookings.");
      }
      const parsed = parseApiCalendarEventId(eventId);
      if (!parsed) {
        throw new Error("Unable to resolve booking id for status update.");
      }
      const apiStatus =
        status === "Requested"
          ? "requested"
          : status === "BR Accepted"
            ? "br_accepted"
            : status === "Confirmed"
              ? "confirmed"
              : status === "In Progress"
                ? "in_progress"
                : status === "Completed"
                  ? "completed"
                  : status === "No Show"
                    ? "no_show"
                    : status === "Invalid"
                      ? "invalid"
                      : "cancelled";
      if (parsed.kind === "booking") {
        if (!onUpdateBookingStatus) {
          throw new Error("Booking status update is unavailable.");
        }
        try {
          await onUpdateBookingStatus(parsed.id, apiStatus, options);
        } catch (error) {
          rethrowAsError(error, "Unable to update booking status.");
        }
        return;
      }
      if (!onUpdateCalendarEntryStatus) {
        throw new Error("Calendar entry status update is unavailable.");
      }
      try {
        await onUpdateCalendarEntryStatus(parsed.id, apiStatus);
      } catch (error) {
        rethrowAsError(error, "Unable to update booking status.");
      }
    },
    [
      events,
      onUpdateBookingStatus,
      onUpdateCalendarEntryStatus,
      showSnackbar,
      viewingBookingEvent,
    ],
  );

  const dispatchBookingEventIfApi = React.useCallback(
    async (
      eventId: string | null | undefined,
      event: BookingNotificationEvent,
      options?: { initiated_by?: "client" | "professional"; message?: string },
    ) => {
      const parsed = eventId ? parseApiCalendarEventId(eventId) : null;
      if (parsed?.kind === "booking" && onDispatchBookingNotification) {
        await onDispatchBookingNotification(parsed.id, event, options);
      }
    },
    [onDispatchBookingNotification],
  );

  return { persistEventStatus, dispatchBookingEventIfApi };
}
