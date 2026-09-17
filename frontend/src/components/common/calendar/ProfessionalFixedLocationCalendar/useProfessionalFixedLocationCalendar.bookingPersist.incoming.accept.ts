import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  markClientEbrAcceptedInNotes,
  parseApiCalendarEventId,
  parseCalendarEntryNotes,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { detectServiceLineChanges } from "../bookingRequestNegotiation";
import { buildAcceptAckDetails } from "../bookingAcknowledgment";
import { recalculateServiceStartEndTimes } from "../../../../data/bookingServiceEdit.data";
import type { CalendarBookingServiceItem } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { UseProfessionalFixedLocationCalendarBookingPersistArgs } from "./useProfessionalFixedLocationCalendar.bookingPersist";

export function useProfessionalFixedLocationCalendarBookingPersistIncomingAccept(
  args: UseProfessionalFixedLocationCalendarBookingPersistArgs,
) {
  const {
    editingEventId,
    viewingBookingEvent,
    selectedSlot,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    bookingGuests,
    showPrepayment,
    prepaymentPercent,
    prepaymentAmount,
    isDrawerPrepaymentPaid,
    drawerPaymentIsOffline,
    bookingTotalForSave,
    onUpdateBookingStatus,
    persistEventStatus,
    restoreIncomingActions,
    showSnackbar,
    setEvents,
    setSlotStatus,
    setIncomingRequestEditMode,
    setIsEditingExisting,
    setSelectedSlot,
  } = args;

  const handleAcceptIncomingRequest = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    const prepayRequired =
      showPrepayment &&
      ((Number(prepaymentPercent) || 0) > 0 || prepaymentAmount > 0);
    const prepayPaid = isDrawerPrepaymentPaid || drawerPaymentIsOffline;
    const ackScenario =
      viewingBookingEvent.bookingScenario === "EBR" ? "EBR" : "BR";
    const ackDetails = buildAcceptAckDetails({
      prepayRequired,
      prepayPaid,
      requestDirection: viewingBookingEvent.details?.requestDirection ?? "incoming",
      ackScenario,
      base: viewingBookingEvent.details,
    });

    if (!parsed || parsed.kind !== "booking" || !onUpdateBookingStatus) {
      const nextNotes = serializeCalendarEntryNotes(
        ackDetails.internalNote ?? "",
        ackDetails,
        parseStoredEbrFromNotes(viewingBookingEvent.notes),
        parseStoredErFromNotes(viewingBookingEvent.notes),
      );
      try {
        await persistEventStatus(editingEventId, "BR Accepted", {
          notes: nextNotes,
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to accept booking request.",
          ),
        });
        restoreIncomingActions();
        throw error;
      }
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "BR Accepted",
                bookingScenario: ackDetails.needsOk ? ackScenario : undefined,
                notes: nextNotes,
                details: ackDetails,
              }
            : event,
        ),
      );
      setSlotStatus("BR Accepted");
      setIncomingRequestEditMode(false);
      setIsEditingExisting(false);
      return;
    }

    try {
      const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
      const isClientEbr =
        viewingBookingEvent.bookingScenario === "EBR" &&
        ebr != null &&
        (ebr.status === "pending" || ebr.status === "suggested") &&
        (ebr.lastEditedBy === "client" ||
          viewingBookingEvent.details?.lastEditedBy === "client");

      const drawerServiceLines: CalendarBookingServiceItem[] = [
        ...selectedServices.map((service) => ({
          ...service,
          staffResourceId: service.staffResourceId,
          teamMemberId: service.staffResourceId,
          guestId: null as string | null,
        })),
        ...bookingGuests.flatMap((guest) =>
          guest.services.map((service) => ({
            ...service,
            staffResourceId: service.staffResourceId,
            teamMemberId: service.staffResourceId,
            guestId: guest.id,
          })),
        ),
      ];
      const drawerProductLines = [
        ...selectedProducts.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          unitPrice: product.unitPrice ?? product.price,
          guestId: null as string | null,
        })),
        ...bookingUniqueItems.map((product) => ({
          ...product,
          guestId: null as string | null,
        })),
        ...bookingGuests.flatMap((guest) =>
          guest.products.map((product) => ({
            ...product,
            guestId: guest.id,
          })),
        ),
      ];
      const suggestedServices = drawerServiceLines.length
        ? drawerServiceLines
        : ebr?.suggestedServices?.length
          ? ebr.suggestedServices
          : viewingBookingEvent.details?.services;
      const suggestedProducts = drawerProductLines.length
        ? drawerProductLines
        : ebr?.suggestedProducts?.length
          ? ebr.suggestedProducts
          : viewingBookingEvent.details?.products;
      const suggestedTotal =
        (suggestedServices ?? []).reduce(
          (sum, s) => sum + (Number(s.price) || 0),
          0,
        ) +
        (suggestedProducts ?? []).reduce(
          (sum, p) => sum + (Number(p.price) || 0) * (p.quantity || 1),
          0,
        );
      const suggestedProject = ebr?.suggestedProjectDetails;
      const suggestedDate = ebr?.suggestedDateISO;
      const suggestedStart = ebr?.suggestedStart;
      const suggestedEnd = ebr?.suggestedEnd;
      // Suggested schedule wins: re-sequence the lines from the accepted start.
      const resolvedSuggestedServices =
        suggestedStart && suggestedServices?.length
          ? recalculateServiceStartEndTimes(suggestedServices, suggestedStart)
          : suggestedServices;
      const originalServices =
        viewingBookingEvent.details?.originalServices ??
        viewingBookingEvent.details?.services ??
        [];
      const lineChanges = detectServiceLineChanges(
        originalServices,
        resolvedSuggestedServices ?? [],
      );
      const ebrSuggestedIds = new Set(
        (ebr?.suggestedServices ?? []).map((service) => service.id),
      );
      const professionalAddedLines = drawerServiceLines.some(
        (service) => !ebrSuggestedIds.has(service.id),
      );

      let nextNotes: string | null | undefined;
      let scheduleExtras: {
        booking_date?: string;
        start_time?: string;
        end_time?: string;
      } = {};

      // Client change request: apply suggested + any drawer additions so they
      // persist on the client booking after Accept.
      if (isClientEbr) {
        const appliedNote = (
          ebr?.clientNote ||
          viewingBookingEvent.details?.internalNote ||
          ""
        ).trim();
        nextNotes = markClientEbrAcceptedInNotes(viewingBookingEvent.notes, {
          internalNote: appliedNote,
          services: resolvedSuggestedServices,
          products: suggestedProducts,
          lastEditedBy: professionalAddedLines
            ? "professional"
            : (ebr?.lastEditedBy ?? "client"),
          editedServiceIds: [
            ...(ebr?.editedServiceIds ?? []),
            ...lineChanges.added,
            ...lineChanges.edited,
          ],
          addedServiceIds: lineChanges.added,
          cancelledServiceIds: lineChanges.cancelled,
          clientSnapshot: {
            ...(viewingBookingEvent.details?.clientSnapshot ?? {}),
            ...(resolvedSuggestedServices?.length
              ? {
                  services: resolvedSuggestedServices.map((s) => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    durationMins: s.durationMins,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    guestId: s.guestId,
                    teamMemberId: s.teamMemberId ?? s.staffResourceId,
                  })),
                }
              : {}),
            ...(suggestedProject ? { projectDetails: suggestedProject } : {}),
          },
          requestDirection: "incoming",
        });
        if (
          suggestedDate &&
          suggestedStart &&
          suggestedEnd &&
          /^\d{2}:\d{2}$/.test(suggestedStart) &&
          /^\d{2}:\d{2}$/.test(suggestedEnd)
        ) {
          scheduleExtras = {
            booking_date: suggestedDate,
            start_time: `${suggestedDate}T${suggestedStart}:00`,
            end_time: `${suggestedDate}T${suggestedEnd}:00`,
          };
        }
        const parsedAccepted = parseCalendarEntryNotes(nextNotes);
        nextNotes = serializeCalendarEntryNotes(
          parsedAccepted?.internalNote ?? appliedNote,
          {
            ...(parsedAccepted ?? {}),
            needsOk: true,
            ackRecipient: "client",
            ackScenario: "EBR",
          },
          parseStoredEbrFromNotes(nextNotes),
          parseStoredErFromNotes(nextNotes),
        );
      } else {
        nextNotes = serializeCalendarEntryNotes(
          ackDetails.internalNote ?? "",
          ackDetails,
          parseStoredEbrFromNotes(viewingBookingEvent.notes),
          parseStoredErFromNotes(viewingBookingEvent.notes),
        );
      }

      const nextApiStatus = isClientEbr ? "confirmed" : "br_accepted";
      const nextLocalStatus = isClientEbr
        ? ("Confirmed" as const)
        : ("BR Accepted" as const);

      await onUpdateBookingStatus(parsed.id, nextApiStatus, {
        ...(nextNotes !== undefined ? { notes: nextNotes } : {}),
        ...(isClientEbr || professionalAddedLines
          ? { total_price: bookingTotalForSave }
          : {}),
        ...scheduleExtras,
      });

      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== editingEventId) return event;
          return {
            ...event,
            status: nextLocalStatus,
            bookingScenario: isClientEbr
              ? undefined
              : ackDetails.needsOk
                ? ackScenario
                : undefined,
            notes: nextNotes ?? event.notes,
            ...(scheduleExtras.booking_date
              ? {
                  date: scheduleExtras.booking_date,
                  start: suggestedStart || event.start,
                  end: suggestedEnd || event.end,
                }
              : {}),
            details: {
              ...(isClientEbr
                ? {
                    ...event.details,
                    needsOk: true,
                    ackRecipient: "client" as const,
                    ackScenario: "EBR" as const,
                  }
                : ackDetails),
              responseStatus: undefined,
              lastEditedBy: professionalAddedLines
                ? "professional"
                : event.details?.lastEditedBy,
              editedServiceIds: [
                ...((event.details?.editedServiceIds ?? []).filter(Boolean)),
                ...lineChanges.added,
                ...lineChanges.edited,
              ],
              addedServiceIds: lineChanges.added,
              cancelledServiceIds: lineChanges.cancelled,
              ...(resolvedSuggestedServices?.length
                ? { services: resolvedSuggestedServices }
                : {}),
              ...(suggestedProducts?.length
                ? { products: suggestedProducts }
                : {}),
            },
          };
        }),
      );
      if (scheduleExtras.booking_date && selectedSlot) {
        setSelectedSlot({
          ...selectedSlot,
          date: scheduleExtras.booking_date,
          start: suggestedStart || selectedSlot.start,
          end: suggestedEnd || selectedSlot.end,
        });
      }
      setSlotStatus(nextLocalStatus);
      setIncomingRequestEditMode(false);
      setIsEditingExisting(false);
    } catch (error) {
      restoreIncomingActions();
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to accept booking request."),
      });
      throw error;
    }
  }, [
    bookingGuests,
    bookingUniqueItems,
    drawerPaymentIsOffline,
    editingEventId,
    isDrawerPrepaymentPaid,
    onUpdateBookingStatus,
    persistEventStatus,
    prepaymentAmount,
    prepaymentPercent,
    restoreIncomingActions,
    selectedProducts,
    selectedServices,
    selectedSlot,
    showPrepayment,
    showSnackbar,
    viewingBookingEvent,
  ]);

  return { handleAcceptIncomingRequest };
}
