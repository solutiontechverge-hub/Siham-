import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { parseApiCalendarEventId } from "../bookingEventDetails";
import { syncEditRequestFromBookingApi } from "../../client-booking/syncEditRequestFromApi";
import { extractBookingId } from "../calendar.utils";
import type { UseProfessionalFixedLocationCalendarBookingPersistArgs } from "./useProfessionalFixedLocationCalendar.bookingPersist";

export function useProfessionalFixedLocationCalendarBookingPersistEr(
  args: UseProfessionalFixedLocationCalendarBookingPersistArgs,
) {
  const {
    editingEventId,
    viewingBookingEvent,
    manageBookingEditRequest,
    restoreIncomingActions,
    showSnackbar,
    setEvents,
  } = args;

  const handleAcceptConfirmedEr = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    if (parsed?.kind !== "booking") return;
    const bookingRef =
      viewingBookingEvent.bookingCode ?? extractBookingId(editingEventId);
    try {
      const result = await manageBookingEditRequest({
        id: parsed.id,
        action: "accept",
      }).unwrap();
      syncEditRequestFromBookingApi(bookingRef, result.data?.edit_request);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                bookingScenario: undefined,
              }
            : event,
        ),
      );
    } catch (error) {
      restoreIncomingActions();
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to accept edit request."),
      });
      throw error;
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    restoreIncomingActions,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleRejectConfirmedEr = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    if (parsed?.kind !== "booking") return;
    const bookingRef =
      viewingBookingEvent.bookingCode ?? extractBookingId(editingEventId);
    try {
      const result = await manageBookingEditRequest({
        id: parsed.id,
        action: "reject",
      }).unwrap();
      syncEditRequestFromBookingApi(bookingRef, result.data?.edit_request);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Confirmed",
                bookingScenario: undefined,
              }
            : event,
        ),
      );
    } catch (error) {
      restoreIncomingActions();
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to reject edit request."),
      });
      throw error;
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    restoreIncomingActions,
    showSnackbar,
    viewingBookingEvent,
  ]);

  return {
    handleAcceptConfirmedEr,
    handleRejectConfirmedEr,
  };
}
