import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  formatBookingRejectReasonNote,
  type CancelBookingPayload,
} from "../CalendarCancelBookingModal";
import {
  hydrateBookingDrawerFromEvent,
  markClientEbrRejectedInNotes,
  parseApiCalendarEventId,
  parseCalendarEntryNotes,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { resolveOriginalServices } from "../bookingRequestNegotiation";
import type { UseProfessionalFixedLocationCalendarBookingPersistArgs } from "./useProfessionalFixedLocationCalendar.bookingPersist";

export function useProfessionalFixedLocationCalendarBookingPersistIncomingReject(
  args: UseProfessionalFixedLocationCalendarBookingPersistArgs,
) {
  const {
    editingEventId,
    viewingBookingEvent,
    onUpdateBookingStatus,
    persistEventStatus,
    restoreIncomingActions,
    showSnackbar,
    setEvents,
    setSlotStatus,
    setIncomingRequestEditMode,
    setIsEditingExisting,
    setAllowDrawerTimeSelection,
    setOriginalServicesSnapshot,
  } = args;

  const handleRejectIncomingRequest = React.useCallback(
    async (payload?: CancelBookingPayload) => {
      if (!editingEventId || !viewingBookingEvent) return;
      const reasonNote = payload
        ? formatBookingRejectReasonNote(payload)
        : "";
      const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
      const isClientEbr =
        viewingBookingEvent.bookingScenario === "EBR" &&
        ebr != null &&
        (ebr.status === "pending" || ebr.status === "suggested") &&
        (ebr.lastEditedBy === "client" ||
          viewingBookingEvent.details?.lastEditedBy === "client");

      // Client change request: keep original booking confirmed; keep rejected proposal for client UI.
      if (isClientEbr) {
        const parsed = parseApiCalendarEventId(editingEventId);
        if (!parsed || parsed.kind !== "booking" || !onUpdateBookingStatus) {
          restoreIncomingActions();
          showSnackbar({
            severity: "error",
            message: "Unable to reject booking request.",
          });
          throw new Error("Unable to reject booking request.");
        }
        try {
          // Keep EBR + Edited tags until the client OKs the rejection outcome.
          const rejectedBase = markClientEbrRejectedInNotes(
            viewingBookingEvent.notes,
          );
          const prior = parseCalendarEntryNotes(rejectedBase) ?? {};
          const ackDetails = {
            ...prior,
            needsOk: true as const,
            ackRecipient: "client" as const,
            ackScenario: "EBR" as const,
            ...(reasonNote ? { cancellationReason: reasonNote } : {}),
          };
          const rejectedNotes = serializeCalendarEntryNotes(
            ackDetails.internalNote ?? "",
            ackDetails,
            parseStoredEbrFromNotes(rejectedBase),
            parseStoredErFromNotes(rejectedBase),
          );
          await onUpdateBookingStatus(parsed.id, "confirmed", {
            notes: rejectedNotes,
          });
          setEvents((prev) =>
            prev.map((event) =>
              event.id === editingEventId
                ? {
                    ...event,
                    status: "Confirmed" as const,
                    bookingScenario: "EBR",
                    notes: rejectedNotes,
                    details: {
                      ...event.details,
                      ...ackDetails,
                      responseStatus: undefined,
                    },
                  }
                : event,
            ),
          );
          setSlotStatus("Confirmed");
          setIncomingRequestEditMode(false);
          setIsEditingExisting(false);
        } catch (error) {
          restoreIncomingActions();
          const message = getApiErrorMessage(
            error,
            "Unable to reject booking request.",
          );
          showSnackbar({ severity: "error", message });
          // RTK errors are plain objects — rethrowing them → Next overlay "[object Object]".
          throw new Error(message || "Unable to reject booking request.");
        }
        return;
      }

      try {
        const prior = parseCalendarEntryNotes(viewingBookingEvent.notes) ?? {};
        const nextDetails = {
          ...prior,
          ...(reasonNote ? { cancellationReason: reasonNote } : {}),
        };
        const nextNotes = reasonNote
          ? serializeCalendarEntryNotes(
              nextDetails.internalNote ?? "",
              nextDetails,
              parseStoredEbrFromNotes(viewingBookingEvent.notes),
              parseStoredErFromNotes(viewingBookingEvent.notes),
            )
          : undefined;
        const parsed = parseApiCalendarEventId(editingEventId);
        if (parsed?.kind === "booking" && onUpdateBookingStatus) {
          await onUpdateBookingStatus(parsed.id, "invalid", {
            ...(nextNotes ? { notes: nextNotes } : {}),
          });
        } else {
          await persistEventStatus(editingEventId, "Invalid", {
            ...(nextNotes ? { notes: nextNotes } : {}),
          });
        }
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? {
                  ...event,
                  status: "Invalid",
                  ...(nextNotes ? { notes: nextNotes } : {}),
                  ...(reasonNote
                    ? {
                        details: {
                          ...event.details,
                          cancellationReason: reasonNote,
                        },
                      }
                    : {}),
                }
              : event,
          ),
        );
      } catch (error) {
        restoreIncomingActions();
        const message = getApiErrorMessage(
          error,
          "Unable to reject booking request.",
        );
        showSnackbar({ severity: "error", message });
        throw new Error(message || "Unable to reject booking request.");
      }
      setSlotStatus("Invalid");
      setIncomingRequestEditMode(false);
      setIsEditingExisting(false);
    },
    [
      editingEventId,
      onUpdateBookingStatus,
      persistEventStatus,
      restoreIncomingActions,
      showSnackbar,
      viewingBookingEvent,
      setEvents,
      setSlotStatus,
      setIncomingRequestEditMode,
      setIsEditingExisting,
    ],
  );

  const handleStartIncomingEdit = React.useCallback(() => {
    if (!viewingBookingEvent) return;
    const hydration = hydrateBookingDrawerFromEvent(viewingBookingEvent);
    setOriginalServicesSnapshot([
      ...resolveOriginalServices(viewingBookingEvent, hydration.services),
      ...hydration.guests.flatMap((guest) => guest.services),
    ]);
    setIncomingRequestEditMode(true);
    setAllowDrawerTimeSelection(true);
    setIsEditingExisting(true);
  }, [viewingBookingEvent]);

  return {
    handleRejectIncomingRequest,
    handleStartIncomingEdit,
  };
}
