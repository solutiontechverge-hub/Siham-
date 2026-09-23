import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingNotificationEvent } from "../../../../store/services/businessApi";
import type { UseProfessionalFixedLocationCalendarBookingActionsArgs } from "./useProfessionalFixedLocationCalendar.bookingActions";
import { listNoShowParticipantOptions } from "./useProfessionalFixedLocationCalendar.noShowParticipants";
import { serializeCalendarEntryNotes } from "../bookingEventDetails";

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
    events,
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
      if (!selectedIds.length) return;
      const current = events.find((event) => event.id === editingEventId);
      const selectable = listNoShowParticipantOptions(current);
      const selected = new Set(selectedIds.map((id) => String(id)));
      // All selectable participants → booking-level No Show. Partial → keep
      // shell status; store ids so divergent blocks can show their own badge.
      const markBookingNoShow =
        selectable.length > 0 &&
        selectable.every((person) => selected.has(person.id));
      const nextStatus: CalendarEvent["status"] = markBookingNoShow
        ? "No Show"
        : (current?.status ?? "Confirmed");
      const nextDetails = {
        ...current?.details,
        noShowParticipantIds: selectedIds,
      };
      // ponytail: notes meta carries ids across reload when status API accepts notes.
      const nextNotes = serializeCalendarEntryNotes(
        current?.details?.internalNote ?? "",
        nextDetails,
      );
      try {
        await persistEventStatus(editingEventId, nextStatus, {
          ...(nextNotes ? { notes: nextNotes } : {}),
        });
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? {
                  ...event,
                  status: nextStatus,
                  details: nextDetails,
                  ...(nextNotes ? { notes: nextNotes } : {}),
                }
              : event,
          ),
        );
        showSnackbar({
          severity: "success",
          message: markBookingNoShow
            ? "Booking marked as no show."
            : "Selected participants marked as no show.",
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
    [
      editingEventId,
      events,
      persistEventStatus,
      showSnackbar,
      setNoShowModalOpen,
      setEvents,
    ],
  );

  return {
    handleConfirmCancel,
    handleConfirmBookingAction,
    handleConfirmNoShow,
  };
}
