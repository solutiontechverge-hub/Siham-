import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingNotificationEvent } from "../../../../store/services/businessApi";
import { parseApiCalendarEventId } from "../bookingEventDetails";
import { isAllowedStatusForBookingType } from "../bookingStatus";
import type { UseProfessionalFixedLocationCalendarBookingActionsArgs } from "./useProfessionalFixedLocationCalendar.bookingActions";

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
      if (
        current &&
        !isAllowedStatusForBookingType(status, current.bookingType)
      ) {
        showSnackbar({
          severity: "warning",
          message: "This status is not allowed for offline bookings.",
        });
        return;
      }
      const parsed = parseApiCalendarEventId(eventId);
      if (!parsed) return;
      const apiStatus =
        status === "Requested"
          ? "requested"
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
        if (onUpdateBookingStatus) {
          await onUpdateBookingStatus(parsed.id, apiStatus, options);
        }
        return;
      }
      if (onUpdateCalendarEntryStatus) {
        await onUpdateCalendarEntryStatus(parsed.id, apiStatus);
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
