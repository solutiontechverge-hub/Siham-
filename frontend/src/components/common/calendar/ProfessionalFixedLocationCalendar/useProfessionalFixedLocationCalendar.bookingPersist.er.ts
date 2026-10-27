import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { buildEditRequestAckDetails } from "../bookingAcknowledgment";
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
    onUpdateBookingStatus,
    restoreIncomingActions,
    showSnackbar,
    setEvents,
  } = args;

  const persistErAckNotes = React.useCallback(
    async (
      bookingId: string,
      ackDetails: ReturnType<typeof buildEditRequestAckDetails>,
    ) => {
      if (!viewingBookingEvent || !onUpdateBookingStatus) return null;
      const nextNotes = serializeCalendarEntryNotes(
        ackDetails.internalNote ?? "",
        ackDetails,
        parseStoredEbrFromNotes(viewingBookingEvent.notes),
        parseStoredErFromNotes(viewingBookingEvent.notes),
      );
      await onUpdateBookingStatus(bookingId, "confirmed", {
        notes: nextNotes,
      });
      return nextNotes;
    },
    [onUpdateBookingStatus, viewingBookingEvent],
  );

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
      const er = result.data?.edit_request;
      syncEditRequestFromBookingApi(bookingRef, er);
      const initiatedBy =
        er?.initiated_by === "professional" ? "professional" : "client";
      const ackDetails = buildEditRequestAckDetails({
        initiatedBy,
        editRequestStatus: "approved",
        base: viewingBookingEvent.details,
      });
      const nextNotes = await persistErAckNotes(parsed.id, ackDetails);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Confirmed" as const,
                bookingScenario: "ER",
                ...(nextNotes != null ? { notes: nextNotes } : {}),
                details: ackDetails,
              }
            : event,
        ),
      );
    } catch (error) {
      restoreIncomingActions();
      const message = getApiErrorMessage(error, "Unable to accept edit request.");
      showSnackbar({ severity: "error", message });
      throw new Error(message || "Unable to accept edit request.");
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    persistErAckNotes,
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
      const er = result.data?.edit_request;
      syncEditRequestFromBookingApi(bookingRef, er);
      const initiatedBy =
        er?.initiated_by === "professional" ? "professional" : "client";
      const ackDetails = buildEditRequestAckDetails({
        initiatedBy,
        editRequestStatus: "rejected",
        base: {
          ...(viewingBookingEvent.details ?? {}),
          editRequestNote: er?.note ?? viewingBookingEvent.details?.editRequestNote,
          editRequestInitiatedBy:
            er?.initiated_by ?? viewingBookingEvent.details?.editRequestInitiatedBy,
        },
      });
      const nextNotes = await persistErAckNotes(parsed.id, ackDetails);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Confirmed" as const,
                bookingScenario: "ER",
                ...(nextNotes != null ? { notes: nextNotes } : {}),
                details: ackDetails,
              }
            : event,
        ),
      );
    } catch (error) {
      restoreIncomingActions();
      const message = getApiErrorMessage(error, "Unable to reject edit request.");
      showSnackbar({ severity: "error", message });
      throw new Error(message || "Unable to reject edit request.");
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    persistErAckNotes,
    restoreIncomingActions,
    showSnackbar,
    viewingBookingEvent,
  ]);

  return {
    handleAcceptConfirmedEr,
    handleRejectConfirmedEr,
  };
}
