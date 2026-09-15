import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { restartResponseDeadline } from "../bookingResponseDeadline";
import { syncEditRequestFromBookingApi } from "../../client-booking/syncEditRequestFromApi";
import { extractBookingId } from "../calendar.utils";
import type { UseProfessionalFixedLocationCalendarBookingPersistArgs } from "./useProfessionalFixedLocationCalendar.bookingPersist";

export function useProfessionalFixedLocationCalendarBookingPersistDiscard(
  args: UseProfessionalFixedLocationCalendarBookingPersistArgs,
) {
  const {
    editingEventId,
    viewingBookingEvent,
    businessResponseWindowInput,
    manageBookingEditRequest,
    persistEventStatus,
    showSnackbar,
    setEvents,
    setSlotStatus,
    setIncomingRequestEditMode,
  } = args;

  const handleDiscardBr = React.useCallback(async () => {
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Invalid");
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to discard booking request.",
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId
          ? { ...event, status: "Invalid", bookingScenario: undefined }
          : event,
      ),
    );
    setSlotStatus("Invalid");
    showSnackbar({
      severity: "success",
      message: "Booking request discarded.",
    });
  }, [editingEventId, persistEventStatus, showSnackbar]);

  const handleDiscardConfirmedEr = React.useCallback(async () => {
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
      const details = { ...(viewingBookingEvent.details ?? {}) };
      delete details.requestDirection;
      const nextNotes = serializeCalendarEntryNotes(
        details.internalNote ?? "",
        details,
        parseStoredEbrFromNotes(viewingBookingEvent.notes),
        null,
      );
      await persistEventStatus(editingEventId, "Confirmed", {
        notes: nextNotes,
      });
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Confirmed",
                bookingScenario: undefined,
                notes: nextNotes,
                details,
              }
            : event,
        ),
      );
      showSnackbar({
        severity: "success",
        message: "Edit request discarded.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to discard edit request."),
      });
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    persistEventStatus,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleRestartResponseTime = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const details = viewingBookingEvent.details ?? {};
    const deadline = restartResponseDeadline(
      details,
      businessResponseWindowInput,
    );
    const nextDetails = {
      ...details,
      ...deadline,
      responseStatus: undefined,
    };
    const nextNotes = serializeCalendarEntryNotes(
      details.internalNote ?? "",
      nextDetails,
      parseStoredEbrFromNotes(viewingBookingEvent.notes),
      parseStoredErFromNotes(viewingBookingEvent.notes),
    );
    try {
      await persistEventStatus(editingEventId, viewingBookingEvent.status, {
        notes: nextNotes,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to restart response time.",
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId
          ? {
              ...event,
              notes: nextNotes,
              details: {
                ...(event.details ?? {}),
                ...deadline,
                responseStatus: undefined,
              },
            }
          : event,
      ),
    );
    showSnackbar({
      severity: "success",
      message: "Response time restarted.",
    });
  }, [
    businessResponseWindowInput,
    editingEventId,
    persistEventStatus,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleDiscardEbr = React.useCallback(async () => {
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Invalid", {
        notification_event: "ebr_discarded",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to discard edited booking request.",
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId
          ? { ...event, status: "Invalid", bookingScenario: undefined }
          : event,
      ),
    );
    setSlotStatus("Invalid");
    setIncomingRequestEditMode(false);
    showSnackbar({
      severity: "success",
      message: "Edited booking request discarded.",
    });
  }, [editingEventId, persistEventStatus, showSnackbar]);

  return {
    handleDiscardBr,
    handleDiscardConfirmedEr,
    handleRestartResponseTime,
    handleDiscardEbr,
  };
}
