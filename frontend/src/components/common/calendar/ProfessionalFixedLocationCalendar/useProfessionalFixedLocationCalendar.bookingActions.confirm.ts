import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingNotificationEvent } from "../../../../store/services/businessApi";
import type { UseProfessionalFixedLocationCalendarBookingActionsArgs } from "./useProfessionalFixedLocationCalendar.bookingActions";

type PersistEventStatus = (
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
) => Promise<void>;

/** Cancel / confirm-dialog / no-show confirm handlers (ponytail: subdomain of bookingActions). */
export function useProfessionalFixedLocationCalendarBookingActionsConfirm(
  args: UseProfessionalFixedLocationCalendarBookingActionsArgs & {
    persistEventStatus: PersistEventStatus;
  },
) {
  const {
    editingEventId,
    pendingBookingAction,
    persistEventStatus,
    showSnackbar,
    setCancelModalOpen,
    setNoShowModalOpen,
    setPendingBookingAction,
    setIsEditingExisting,
    setEvents,
  } = args;

  const handleConfirmCancel = React.useCallback(async () => {
    setCancelModalOpen(false);
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Cancelled");
      setIsEditingExisting(false);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? { ...event, status: "Cancelled" }
            : event,
        ),
      );
      showSnackbar({ severity: "success", message: "Booking cancelled." });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to update booking status."),
      });
    }
  }, [editingEventId, persistEventStatus, showSnackbar, setCancelModalOpen, setIsEditingExisting, setEvents]);

  const handleConfirmBookingAction = React.useCallback(async () => {
    const action = pendingBookingAction;
    setPendingBookingAction(null);
    if (!action || !editingEventId) return;

    const nextStatus: CalendarEvent["status"] =
      action === "in_progress" ? "In Progress" : "Cancelled";
    const successMessage =
      action === "in_progress"
        ? "Booking marked in progress."
        : "Booking cancelled.";
    try {
      await persistEventStatus(editingEventId, nextStatus);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? { ...event, status: nextStatus }
            : event,
        ),
      );
      showSnackbar({ severity: "success", message: successMessage });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to update booking status."),
      });
    }
  }, [editingEventId, pendingBookingAction, persistEventStatus, showSnackbar, setPendingBookingAction, setEvents]);

  const handleConfirmNoShow = React.useCallback(
    async (selectedIds: string[]) => {
      setNoShowModalOpen(false);
      if (!editingEventId) return;
      // Booking-level status only: require at least one person selected.
      // Partial selection still marks the booking no-show (client booked, did not attend).
      if (!selectedIds.length) return;
      try {
        await persistEventStatus(editingEventId, "No Show");
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? { ...event, status: "No Show" }
              : event,
          ),
        );
        showSnackbar({
          severity: "success",
          message: "Booking marked as no show.",
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to update booking status.",
          ),
        });
      }
    },
    [editingEventId, persistEventStatus, showSnackbar, setNoShowModalOpen, setEvents],
  );

  return {
    handleConfirmCancel,
    handleConfirmBookingAction,
    handleConfirmNoShow,
  };
}
