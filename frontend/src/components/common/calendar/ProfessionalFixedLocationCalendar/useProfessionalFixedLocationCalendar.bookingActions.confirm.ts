import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingNotificationEvent } from "../../../../store/services/businessApi";
import type { UseProfessionalFixedLocationCalendarBookingActionsArgs } from "./useProfessionalFixedLocationCalendar.bookingActions";
import { listNoShowParticipantOptions } from "./useProfessionalFixedLocationCalendar.noShowParticipants";
import { serializeCalendarEntryNotes } from "../bookingEventDetails";
import {
  buildProtectiveFeeActivation,
  shouldTriggerLateCancellationFee,
  shouldTriggerNoShowFee,
} from "../bookingFeeTriggers";

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

function appointmentStartMsFromEvent(event: CalendarEvent | undefined): number | null {
  if (!event) return null;
  const ms = Date.parse(`${event.date}T${event.start}:00`);
  return Number.isFinite(ms) ? ms : null;
}

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
    showLateCancellation,
    showNoShowFee,
    lateCancellationFeePercentDefault,
    noShowFeePercentDefault,
    cancellationBeforeHours,
    cancellationBeforeMinutes,
    setShowLateCancellation,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setShowNoShowFee,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setCancellationFeeAt,
    setExceededCancellationWindow,
  } = args;

  const handleConfirmCancel = React.useCallback(async () => {
    setCancelModalOpen(false);
    if (!editingEventId) return;
    const current = events.find((event) => event.id === editingEventId);
    const startMs = appointmentStartMsFromEvent(current);
    const lateCancel =
      !showLateCancellation &&
      shouldTriggerLateCancellationFee({
        policyPercent: lateCancellationFeePercentDefault,
        status: "Cancelled",
        appointmentStartMs: startMs,
        noticeHours: cancellationBeforeHours,
        noticeMinutes: cancellationBeforeMinutes,
      });
    const activation = lateCancel
      ? buildProtectiveFeeActivation(lateCancellationFeePercentDefault, {
          kind: "lateCancellation",
          cancellationFeeAt: new Date().toISOString(),
          exceededCancellationWindow: true,
        })
      : null;

    const nextDetails = {
      ...current?.details,
      ...(activation
        ? {
            showLateCancellation: true,
            lateCancellationFeePercent: activation.percent,
            lateCancellationFeePercentCeiling: activation.ceiling,
            cancellationFeeAt: activation.cancellationFeeAt,
            exceededCancellationWindow: true,
          }
        : {}),
    };
    const nextNotes = activation
      ? serializeCalendarEntryNotes(
          current?.details?.internalNote ?? "",
          nextDetails,
        )
      : undefined;

    try {
      await persistEventStatus(editingEventId, "Cancelled", {
        ...(nextNotes ? { notes: nextNotes } : {}),
      });
      if (activation) {
        setShowLateCancellation(true);
        setLateCancellationFeePercent(activation.percent);
        setLateCancellationFeePercentCeiling(activation.ceiling);
        setCancellationFeeAt(activation.cancellationFeeAt);
        setExceededCancellationWindow(true);
      }
      setIsEditingExisting(false);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Cancelled",
                ...(activation
                  ? { details: nextDetails, ...(nextNotes ? { notes: nextNotes } : {}) }
                  : {}),
              }
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
  }, [
    editingEventId,
    events,
    persistEventStatus,
    showSnackbar,
    setCancelModalOpen,
    setIsEditingExisting,
    setEvents,
    showLateCancellation,
    lateCancellationFeePercentDefault,
    cancellationBeforeHours,
    cancellationBeforeMinutes,
    setShowLateCancellation,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setCancellationFeeAt,
    setExceededCancellationWindow,
  ]);

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

      const noShowFee =
        markBookingNoShow &&
        !showNoShowFee &&
        shouldTriggerNoShowFee({
          policyPercent: noShowFeePercentDefault,
          status: "No Show",
        });
      const activation = noShowFee
        ? buildProtectiveFeeActivation(noShowFeePercentDefault, {
            kind: "noShow",
          })
        : null;

      const nextDetails = {
        ...current?.details,
        noShowParticipantIds: selectedIds,
        ...(activation
          ? {
              showNoShowFee: true,
              noShowFeePercent: activation.percent,
              noShowFeePercentCeiling: activation.ceiling,
            }
          : {}),
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
        if (activation) {
          setShowNoShowFee(true);
          setNoShowFeePercent(activation.percent);
          setNoShowFeePercentCeiling(activation.ceiling);
        }
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
      showNoShowFee,
      noShowFeePercentDefault,
      setShowNoShowFee,
      setNoShowFeePercent,
      setNoShowFeePercentCeiling,
    ],
  );

  return {
    handleConfirmCancel,
    handleConfirmBookingAction,
    handleConfirmNoShow,
  };
}
