import type * as React from "react";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  buildBookingDetailsSnapshot,
  parseApiCalendarEventId,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { buildResponseDeadline } from "../bookingResponseDeadline";
import {
  detectProductLineChanges,
  detectServiceLineChanges,
  flattenBookingServices,
} from "../bookingRequestNegotiation";
import { professionalSuggestBookingChanges } from "../../client-booking/bookingEditRequest";
import type { SelectedSlot } from "../calendar.utils";
import type { ProfessionalFixedLocationCalendarProps } from "./useProfessionalFixedLocationCalendar.types";
import {
  buildCurrentServicesForDiff,
  buildSuggestedProductsForEbr,
  buildSuggestedServicesForEbr,
  type PersistBookingGuest,
} from "./useProfessionalFixedLocationCalendar.persistBookingFromDrawer.helpers";

type ShowSnackbar = (input: {
  severity: "error" | "success" | "warning" | "info";
  message: string;
}) => void;

/** Incoming-request edit → outgoing EBR (pure-ish orchestrator; same save semantics). */
export async function persistIncomingEbrFromDrawer(input: {
  selectedSlot: SelectedSlot;
  editingEventId: string;
  existingEvent: CalendarEvent;
  guestsForPersist: PersistBookingGuest[];
  originalServicesSnapshot: BookingServiceLineItem[];
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingProductLineItem[];
  selectedClient: {
    name: string;
    email: string;
    mollureUserId?: string | null;
    clientKind?: "individual" | "company";
    isGuest?: boolean;
    isMollure?: boolean;
  } | null;
  addClientSource: "" | "client-list" | "mollure-platform" | "non-mollure" | "guest";
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  desiredLocationDraft: Parameters<
    typeof buildBookingDetailsSnapshot
  >[0]["desiredLocationDraft"];
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling: string;
  showNoShowFee: boolean;
  noShowFeePercent: string;
  noShowFeePercentCeiling: string;
  cancellationFeeAt: string | null | undefined;
  exceededCancellationWindow: boolean | undefined;
  showInternalNote: boolean;
  bookingInternalNote: string;
  bookingTotalDiscount: Parameters<
    typeof buildBookingDetailsSnapshot
  >[0]["bookingTotalDiscount"];
  persistDesiredLocationKm: boolean;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: { eurPerKm: string; totalKilometer: string };
  bookingTotalForSave: number;
  businessResponseWindowInput: { hours?: number | null; minutes?: number | null };
  resourceNameById: Map<string, string>;
  onUpdateBookingStatus: ProfessionalFixedLocationCalendarProps["onUpdateBookingStatus"];
  showSnackbar: ShowSnackbar;
  dispatchBookingEventIfApi: (
    eventId: string | null | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    opts?: { initiated_by?: "client" | "professional"; message?: string },
  ) => void | Promise<void>;
  setEvents: React.Dispatch<React.SetStateAction<readonly CalendarEvent[]>>;
  setIncomingRequestEditMode: (v: boolean) => void;
  setIsEditingExisting: (v: boolean) => void;
  setSlotStatus: (v: CalendarEvent["status"]) => void;
  setSlotSaveAttempted: (v: boolean) => void;
  setActiveDateIso: (v: string) => void;
}): Promise<boolean> {
  const {
    selectedSlot,
    editingEventId,
    existingEvent,
    guestsForPersist,
    originalServicesSnapshot,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    selectedClient,
    addClientSource,
    bookingPhoneDraft,
    desiredLocationDraft,
    showPrepayment,
    prepaymentPercent,
    paymentMethod,
    showLateCancellation,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    showLateRescheduling,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    showNoShowFee,
    noShowFeePercent,
    noShowFeePercentCeiling,
    cancellationFeeAt,
    exceededCancellationWindow,
    showInternalNote,
    bookingInternalNote,
    bookingTotalDiscount,
    persistDesiredLocationKm,
    showKilometerAllowance,
    kilometerAllowanceDraft,
    bookingTotalForSave,
    businessResponseWindowInput,
    resourceNameById,
    onUpdateBookingStatus,
    showSnackbar,
    dispatchBookingEventIfApi,
    setEvents,
    setIncomingRequestEditMode,
    setIsEditingExisting,
    setSlotStatus,
    setSlotSaveAttempted,
    setActiveDateIso,
  } = input;

  const originalServicesRaw =
    existingEvent.details?.originalServices ?? originalServicesSnapshot;
  const originalServices = flattenBookingServices({
    services: originalServicesRaw,
    guests:
      existingEvent.details?.originalGuests ?? existingEvent.details?.guests,
  });
  const currentServicesForDiff = buildCurrentServicesForDiff(
    selectedServices,
    guestsForPersist,
  );
  const lineChanges = detectServiceLineChanges(
    originalServices.length ? originalServices : originalServicesRaw,
    currentServicesForDiff,
  );
  const scheduleChanged =
    existingEvent.date !== selectedSlot.date ||
    existingEvent.start !== selectedSlot.start ||
    existingEvent.end !== selectedSlot.end;
  const nextDetails = buildBookingDetailsSnapshot({
    selectedClient,
    isGuest:
      addClientSource === "guest" ||
      Boolean(selectedClient?.isGuest) ||
      Boolean(existingEvent.details?.isGuest),
    selectedServices,
    selectedProducts,
    bookingGuests: guestsForPersist,
    bookingPhoneDraft,
    desiredLocationDraft,
    showPrepayment,
    prepaymentPercent,
    paymentMethod,
    showLateCancellation,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    showLateRescheduling,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    showNoShowFee,
    noShowFeePercent,
    noShowFeePercentCeiling,
    cancellationFeeAt: cancellationFeeAt ?? undefined,
    exceededCancellationWindow,
    showInternalNote,
    bookingInternalNote,
    bookingTotalDiscount,
    showKilometerAllowance: persistDesiredLocationKm && showKilometerAllowance,
    kilometerAllowanceDraft: persistDesiredLocationKm
      ? kilometerAllowanceDraft
      : { eurPerKm: "", totalKilometer: "" },
    clientNote: existingEvent.details?.clientNote,
    // Persist as outgoing EBR so Discard EBR and client EBR pill stay in sync.
    requestDirection: "outgoing",
    originalServices,
    editedServiceIds: lineChanges.edited,
    addedServiceIds: lineChanges.added,
    cancelledServiceIds: lineChanges.cancelled,
    clientEditedServiceIds: [],
    lastEditedBy: "professional",
  });
  nextDetails.responseStatus = "suggestion_for_change";
  if (scheduleChanged) nextDetails.scheduleEdited = true;
  const responseDeadline = buildResponseDeadline(businessResponseWindowInput);
  if (responseDeadline) {
    Object.assign(nextDetails, responseDeadline);
  }
  // Keep client project/people snapshot so client EBR view stays on Continue layout.
  if (existingEvent.details?.clientSnapshot) {
    nextDetails.clientSnapshot = existingEvent.details.clientSnapshot;
  }
  nextDetails.silentUpdateSnapshot =
    existingEvent.details?.silentUpdateSnapshot ?? {
      phoneCode: existingEvent.details?.phoneCode,
      phoneNumber: existingEvent.details?.phoneNumber,
      guests: existingEvent.details?.guests,
      services: existingEvent.details?.services,
      products: existingEvent.details?.products,
      people: existingEvent.details?.clientSnapshot?.people,
      desiredLocation: existingEvent.details?.desiredLocation,
    };
  nextDetails.originalGuests = existingEvent.details?.originalGuests?.length
    ? existingEvent.details.originalGuests
    : existingEvent.details?.guests;

  const snapshotServices = existingEvent.details?.clientSnapshot?.services ?? [];
  const suggestedServices = buildSuggestedServicesForEbr(
    selectedServices,
    guestsForPersist,
    snapshotServices,
  );
  const suggestedProducts = buildSuggestedProductsForEbr(
    selectedProducts,
    bookingUniqueItems,
    guestsForPersist,
  );
  const productChanges = detectProductLineChanges(
    existingEvent.details?.products ?? [],
    suggestedProducts,
  );
  nextDetails.editedProductIds = productChanges.edited;
  nextDetails.addedProductIds = productChanges.added;
  nextDetails.cancelledProductIds = productChanges.cancelled;
  const bookingRef = existingEvent.bookingCode ?? editingEventId;
  const ebrTotal = bookingTotalForSave;
  if (nextDetails.clientSnapshot) {
    nextDetails.clientSnapshot = {
      ...nextDetails.clientSnapshot,
      services: suggestedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMins: service.durationMins,
        startTime: service.startTime,
        endTime: service.endTime,
        guestId: service.guestId ?? null,
        teamMemberId: service.teamMemberId ?? service.staffResourceId ?? null,
      })),
    };
  }
  const humanNote = bookingInternalNote.trim();
  const persistedNotes = serializeCalendarEntryNotes(humanNote, nextDetails, {
    status: "suggested",
    suggestedAt: new Date().toISOString(),
    professionalNote: bookingInternalNote.trim() || undefined,
    editedServiceIds: lineChanges.edited,
    addedServiceIds: lineChanges.added,
    cancelledServiceIds: lineChanges.cancelled,
    editedProductIds: productChanges.edited,
    addedProductIds: productChanges.added,
    cancelledProductIds: productChanges.cancelled,
    suggestedServices,
    suggestedProducts,
    suggestedDateISO: selectedSlot.date,
    suggestedTime: selectedSlot.start,
    suggestedStart: selectedSlot.start,
    suggestedEnd: selectedSlot.end,
    originalDateISO: existingEvent.date,
    originalTime: existingEvent.start,
    responseStatus: "suggestion_for_change",
    requestDirection: "outgoing",
    lastEditedBy: "professional",
  });

  const parsedBooking = parseApiCalendarEventId(editingEventId);
  if (parsedBooking?.kind === "booking" && onUpdateBookingStatus) {
    try {
      await onUpdateBookingStatus(parsedBooking.id, "requested", {
        notes: persistedNotes,
        total_price: ebrTotal,
        booking_date: selectedSlot.date,
        start_time: `${selectedSlot.date}T${selectedSlot.start}:00`,
        end_time: `${selectedSlot.date}T${selectedSlot.end}:00`,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to send edited booking request.",
      });
      return false;
    }
  }

  setEvents((prev) =>
    prev.map((event) =>
      event.id === editingEventId
        ? {
            ...event,
            status: "Requested",
            bookingScenario: "EBR",
            date: selectedSlot.date,
            start: selectedSlot.start,
            end: selectedSlot.end,
            title: selectedServices[0]?.name ?? event.title,
            details: {
              ...event.details,
              ...nextDetails,
              prepaymentStatus: event.details?.prepaymentStatus,
              responseStatus: "suggestion_for_change",
            },
          }
        : event,
    ),
  );
  professionalSuggestBookingChanges(bookingRef, {
    professionalNote: bookingInternalNote.trim() || undefined,
    editedServiceIds: lineChanges.edited,
    addedServiceIds: lineChanges.added,
    cancelledServiceIds: lineChanges.cancelled,
    editedProductIds: productChanges.edited,
    addedProductIds: productChanges.added,
    cancelledProductIds: productChanges.cancelled,
    suggestedServices: suggestedServices.map((service) => ({
      id: service.id,
      name: service.name,
      durationMins: service.durationMins,
      price: service.price,
      teamMemberId: service.staffResourceId ?? null,
      teamMemberName: service.staffResourceId
        ? resourceNameById.get(service.staffResourceId)
        : undefined,
      guestId: service.guestId ?? null,
      startTime: service.startTime,
      endTime: service.endTime,
    })),
    suggestedProducts: suggestedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
    })),
    suggestedDateISO: selectedSlot.date,
    suggestedTime: selectedSlot.start,
    originalDateISO: existingEvent.date,
    originalTime: existingEvent.start,
  });
  setIncomingRequestEditMode(false);
  setIsEditingExisting(false);
  setSlotStatus("Requested");
  showSnackbar({
    severity: "success",
    message: "Edited booking request sent to client.",
  });
  void dispatchBookingEventIfApi(editingEventId, "suggest_for_change", {
    initiated_by: "professional",
  });
  setSlotSaveAttempted(false);
  setActiveDateIso(selectedSlot.date);
  return true;
}
