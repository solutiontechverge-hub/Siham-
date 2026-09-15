import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingNotificationEvent } from "../../../../store/services/businessApi";
import {
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { canDiscardEbr } from "../bookingRequestNegotiation";
import { canCheckoutProtectiveFee } from "../bookingGroupAddOns";
import { clearBookingAckDetails } from "../bookingAcknowledgment";
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

/** Action-menu select handler (ponytail: subdomain of bookingActions; keep monolithic). */
export function useProfessionalFixedLocationCalendarBookingActionsSelect(
  args: UseProfessionalFixedLocationCalendarBookingActionsArgs & {
    persistEventStatus: PersistEventStatus;
  },
) {
  const {
    events,
    viewingBookingEvent,
    editingEventId,
    showLateCancellation,
    lateCancellationFeeAmount,
    showNoShowFee,
    noShowFeeAmount,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    noShowFeePercent,
    noShowFeePercentCeiling,
    cancellationFeeAt,
    exceededCancellationWindow,
    beginExistingBookingEdit,
    onUpdateBookingStatus,
    persistEventStatus,
    showSnackbar,
    setBookingActionAnchor,
    setDiscardErOpen,
    setDiscardEbrOpen,
    setDiscardBrOpen,
    setNoShowModalOpen,
    setCancelModalOpen,
    setEvents,
    setCancellationFeeAt,
    setSlotDrawerTab,
    setBookingCheckoutOpen,
    setSlotStatus,
    setEditingEventId,
    setSlotDrawerOpen,
    setIsEditingExisting,
    setAllowDrawerTimeSelection,
    setSlotCalendarOpen,
    setSlotCalendarTouched,
    setSlotClientAdded,
    setPendingBookingAction,
  } = args;

  const handleBookingActionSelect = React.useCallback(
    async (
      action:
        | "edit"
        | "in_progress"
        | "no_show"
        | "cancel"
        | "checkout"
        | "delete"
        | "rebook"
        | "ok"
        | "discard",
    ) => {
      setBookingActionAnchor(null);
      if (!editingEventId) return;

      if (action === "discard") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        if (
          current?.status === "Confirmed" &&
          current.bookingScenario === "ER"
        ) {
          setDiscardErOpen(true);
          return;
        }
        if (canDiscardEbr(current)) {
          setDiscardEbrOpen(true);
          return;
        }
        setDiscardBrOpen(true);
        return;
      }

      if (action === "edit") {
        if (
          viewingBookingEvent?.status === "Cancelled" ||
          viewingBookingEvent?.status === "Invalid"
        ) {
          return;
        }
        // Confirmed (and other editable statuses): edit directly — no ER note step.
        beginExistingBookingEdit();
        return;
      }

      if (action === "no_show") {
        setNoShowModalOpen(true);
        return;
      }

      if (action === "cancel") {
        setCancelModalOpen(true);
        return;
      }

      if (action === "checkout") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        const status = current?.status;
        const feeCheckout = canCheckoutProtectiveFee({
          status,
          showLateCancellation,
          lateCancellationFeeAmount,
          showNoShowFee,
          noShowFeeAmount,
        });

        // Cancelled / No Show: invoice protective fee only — keep status, open Sales.
        if (
          feeCheckout &&
          (status === "Cancelled" || status === "No Show")
        ) {
          const feeAmount =
            status === "Cancelled"
              ? lateCancellationFeeAmount
              : noShowFeeAmount;
          const nextDetails = {
            ...(current?.details ?? {}),
            showLateCancellation:
              status === "Cancelled"
                ? showLateCancellation
                : current?.details?.showLateCancellation,
            lateCancellationFeePercent:
              status === "Cancelled"
                ? lateCancellationFeePercent
                : current?.details?.lateCancellationFeePercent,
            lateCancellationFeePercentCeiling:
              status === "Cancelled"
                ? lateCancellationFeePercentCeiling
                : current?.details?.lateCancellationFeePercentCeiling,
            showNoShowFee:
              status === "No Show"
                ? showNoShowFee
                : current?.details?.showNoShowFee,
            noShowFeePercent:
              status === "No Show"
                ? noShowFeePercent
                : current?.details?.noShowFeePercent,
            noShowFeePercentCeiling:
              status === "No Show"
                ? noShowFeePercentCeiling
                : current?.details?.noShowFeePercentCeiling,
            cancellationFeeAt:
              cancellationFeeAt ?? new Date().toISOString(),
            ...(typeof exceededCancellationWindow === "boolean"
              ? { exceededCancellationWindow }
              : {}),
            waitingForPayment: feeAmount > 0,
            invoiceDueDate: new Date().toISOString().slice(0, 10),
          };
          const nextNotes = serializeCalendarEntryNotes(
            nextDetails.internalNote ?? "",
            nextDetails,
            parseStoredEbrFromNotes(current?.notes),
            parseStoredErFromNotes(current?.notes),
          );
          try {
            await persistEventStatus(editingEventId, status, {
              notes: nextNotes,
              total_price: feeAmount,
            });
            setEvents((prev) =>
              prev.map((event) =>
                event.id === editingEventId
                  ? {
                      ...event,
                      notes: nextNotes,
                      details: nextDetails,
                    }
                  : event,
              ),
            );
            setCancellationFeeAt(nextDetails.cancellationFeeAt);
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to send fee checkout.",
            });
            return;
          }
          setSlotDrawerTab("sales");
          showSnackbar({
            severity: "success",
            message:
              status === "Cancelled"
                ? "Cancellation fee checkout opened in Sales."
                : "No-show fee checkout opened in Sales.",
          });
          return;
        }

        setBookingCheckoutOpen(true);
        setSlotDrawerTab("booking");
        return;
      }

      if (action === "ok") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        const nextDetails = clearBookingAckDetails({
          ...(current?.details ?? {}),
        });
        const nextNotes = serializeCalendarEntryNotes(
          nextDetails.internalNote ?? "",
          nextDetails,
          parseStoredEbrFromNotes(current?.notes),
          parseStoredErFromNotes(current?.notes),
        );
        const parsed = parseApiCalendarEventId(editingEventId);
        try {
          if (parsed?.kind === "booking" && onUpdateBookingStatus) {
            await onUpdateBookingStatus(parsed.id, "confirmed", {
              notes: nextNotes ?? undefined,
            });
          } else {
            await persistEventStatus(editingEventId, "Confirmed", {
              notes: nextNotes,
            });
          }
        } catch {
          showSnackbar({
            severity: "error",
            message: "Unable to acknowledge booking.",
          });
          return;
        }
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? {
                  ...event,
                  status: "Confirmed",
                  bookingScenario: undefined,
                  notes: nextNotes,
                  details: nextDetails,
                }
              : event,
          ),
        );
        setSlotStatus("Confirmed");
        showSnackbar({
          severity: "success",
          message: "Booking request acknowledged.",
        });
        return;
      }

      if (action === "delete") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        const nextDetails = {
          ...(current?.details ?? {}),
          hiddenForProfessional: true,
          hiddenForCustomer: true,
        };
        const nextNotes = serializeCalendarEntryNotes(
          nextDetails.internalNote ?? "",
          nextDetails,
          parseStoredEbrFromNotes(current?.notes),
          parseStoredErFromNotes(current?.notes),
        );
        try {
          await persistEventStatus(editingEventId, current?.status ?? "Cancelled", {
            notes: nextNotes,
          });
        } catch {
          showSnackbar({
            severity: "error",
            message: "Unable to remove booking from calendar.",
          });
          return;
        }
        const removedCode = String(current?.bookingCode ?? "").trim();
        setEvents((prev) =>
          prev.filter((event) => {
            if (event.id === editingEventId) return false;
            if (
              removedCode &&
              String(event.bookingCode ?? "").trim() === removedCode
            ) {
              return false;
            }
            return true;
          }),
        );
        setEditingEventId(null);
        setSlotDrawerOpen(false);
        showSnackbar({
          severity: "success",
          message: "Booking removed from calendar.",
        });
        return;
      }

      if (action === "rebook") {
        setEditingEventId(null);
        setIsEditingExisting(false);
        setSlotStatus("Confirmed");
        setAllowDrawerTimeSelection(true);
        setSlotCalendarOpen(true);
        setSlotCalendarTouched(false);
        setSlotDrawerTab("booking");
        setSlotClientAdded(true);
        showSnackbar({
          severity: "info",
          message: "Rebook started — pick a new date/time and save.",
        });
        return;
      }

      setPendingBookingAction(action);
    },
    [beginExistingBookingEdit, editingEventId, events, onUpdateBookingStatus, persistEventStatus, showSnackbar, viewingBookingEvent, showLateCancellation, lateCancellationFeeAmount, showNoShowFee, noShowFeeAmount, lateCancellationFeePercent, lateCancellationFeePercentCeiling, noShowFeePercent, noShowFeePercentCeiling, cancellationFeeAt, exceededCancellationWindow, setBookingActionAnchor, setDiscardErOpen, setDiscardEbrOpen, setDiscardBrOpen, setNoShowModalOpen, setCancelModalOpen, setEvents, setCancellationFeeAt, setSlotDrawerTab, setBookingCheckoutOpen, setSlotStatus, setEditingEventId, setSlotDrawerOpen, setIsEditingExisting, setAllowDrawerTimeSelection, setSlotCalendarOpen, setSlotCalendarTouched, setSlotClientAdded, setPendingBookingAction],
  );

  return { handleBookingActionSelect };
}
