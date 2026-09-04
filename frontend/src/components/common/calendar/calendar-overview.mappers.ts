import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarBooking, CalendarEntry } from "../../../store/services/businessApi";
import { wallClockDateFromDateTime, wallClockTimeFromDateTime } from "./calendar.utils";
import { mainDrawerServicesFromClientSnapshot, parseCalendarEntryNotes, parseStoredEbrFromNotes, parseStoredErFromNotes, sanitizeInternalNoteText } from "./bookingEventDetails";
import { syncEditRequestFromBookingApi } from "../client-booking/syncEditRequestFromApi";
import { mapApiPrepaymentStatus } from "./prepaymentStatus";
import { splitContactPhone } from "../../../lib/phone-validation";
import { buildMultiServiceBookingTitle } from "./calendar-overlap.utils";

const statusFromApi: Record<string, CalendarBookingStatus> = {
  requested: "Requested",
  br_accepted: "BR Accepted",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  "in progress": "In Progress",
  completed: "Completed",
  no_show: "No Show",
  "no show": "No Show",
  invalid: "Invalid",
};

const bookingTypeFromApi: Record<string, CalendarBookingType> = {
  online: "Online",
  offline: "Offline",
  project: "Project",
  request: "Online",
};

const locationFromApi: Record<string, CalendarBookingLocation> = {
  fixed: "FL",
  desired: "DL",
};

function resolveEventClientKind(input: {
  apiClientKind?: string | null;
  notesClientKind?: "individual" | "company";
  locationDetailsKind?: unknown;
}): CalendarEvent["clientKind"] {
  const fromLocation =
    input.locationDetailsKind === "company" || input.locationDetailsKind === "individual"
      ? input.locationDetailsKind
      : undefined;
  if (
    input.apiClientKind === "company" ||
    input.notesClientKind === "company" ||
    fromLocation === "company"
  ) {
    return "company";
  }
  if (
    input.apiClientKind === "individual" ||
    input.notesClientKind === "individual" ||
    fromLocation === "individual"
  ) {
    return "individual";
  }
  return undefined;
}

export function applyProfessionalClientKind(
  event: CalendarEvent,
  clients: readonly { email: string; client_kind?: "individual" | "company" }[],
): CalendarEvent {
  if (event.clientKind === "company" || event.details?.clientKind === "company") {
    return {
      ...event,
      clientKind: "company",
      details: { ...event.details, clientKind: "company" },
    };
  }
  const email = event.details?.clientEmail?.trim().toLowerCase();
  if (!email) return event;
  const match = clients.find(
    (client) => client.email.trim().toLowerCase() === email,
  );
  if (match?.client_kind !== "company") return event;
  return {
    ...event,
    clientKind: "company",
    details: { ...event.details, clientKind: "company" },
  };
}

const timeFromIso = (value?: string | null) => {
  return wallClockTimeFromDateTime(value) ?? "08:00";
};

const dateFromValue = (value?: string | null) => {
  return wallClockDateFromDateTime(value) ?? new Date().toISOString().slice(0, 10);
};

const bookingDurationMins = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(15, eh * 60 + em - (sh * 60 + sm));
};

export function mapCalendarEntryToOverviewEvent(
  entry: CalendarEntry,
  fallbackResourceId: string,
): CalendarEvent {
  const status = statusFromApi[entry.status] ?? "Confirmed";
  const isRequested = status === "Requested";
  const details = parseCalendarEntryNotes(entry.notes);
  const clientKind = resolveEventClientKind({
    notesClientKind: details?.clientKind,
  });

  return {
    id: `ce-${entry.id}`,
    bookingCode: entry.unique_code || String(entry.id),
    resourceId: String(entry.team_member_id ?? fallbackResourceId),
    date: dateFromValue(entry.date || entry.start_time || entry.start_date),
    start: entry.start || timeFromIso(entry.start_time),
    end: entry.end || timeFromIso(entry.end_time),
    title: entry.title,
    status,
    location: entry.location_type ? (locationFromApi[entry.location_type] ?? "FL") : "FL",
    bookingType: entry.booking_type
      ? (bookingTypeFromApi[entry.booking_type] ?? "Offline")
      : "Offline",
    bookingScenario: isRequested ? "BR" : undefined,
    showClientName: entry.client_name ?? undefined,
    details: clientKind
      ? { ...details, clientKind }
      : details,
    clientKind,
  };
}

export function mapCalendarBookingToEvent(
  booking: CalendarBooking,
  fallbackResourceId: string,
): CalendarEvent {
  const status = statusFromApi[booking.status] ?? "Requested";
  const isRequested = status === "Requested";
  const parsedNotes = parseCalendarEntryNotes(booking.notes);
  const ebrMeta = status === "Cancelled" ? null : parseStoredEbrFromNotes(booking.notes);
  const pendingEbr =
    ebrMeta && (ebrMeta.status === "pending" || ebrMeta.status === "suggested")
      ? ebrMeta
      : null;
  const snapshotMainServices = mainDrawerServicesFromClientSnapshot(parsedNotes?.clientSnapshot);
  const ebrServices = pendingEbr?.suggestedServices?.length
    ? pendingEbr.suggestedServices
    : parsedNotes?.services?.length
      ? parsedNotes.services
      : snapshotMainServices?.length
        ? snapshotMainServices
        : null;
  const guestOnlyNames = (parsedNotes?.guests ?? []).flatMap((guest) =>
    (guest.services ?? []).map((service) => service.name),
  );
  const snapshotGuestNames = (parsedNotes?.clientSnapshot?.services ?? [])
    .filter((service) => Boolean(service.guestId))
    .map((service) => service.name);
  // Flat notes.services already includes guest lines; otherwise merge main + guest names.
  const title =
    ebrServices?.length &&
    (pendingEbr?.suggestedServices?.length || parsedNotes?.services?.length)
      ? buildMultiServiceBookingTitle(
          ebrServices.map((service) => service.name),
          booking.service_title || "Booking",
        )
      : buildMultiServiceBookingTitle(
          [
            ...(ebrServices?.map((service) => service.name) ?? []),
            ...(guestOnlyNames.length ? guestOnlyNames : snapshotGuestNames),
          ],
          booking.service_title || "Booking",
        );
  const start =
    pendingEbr?.suggestedStart ||
    booking.start ||
    timeFromIso(booking.start_time);
  const end =
    pendingEbr?.suggestedEnd ||
    booking.end ||
    timeFromIso(booking.end_time);
  const clientName = booking.customer_name || booking.client_name || undefined;
  const apiPrepay = String(booking.prepayment_status ?? "").toLowerCase();
  const mappedPrepayStatus = mapApiPrepaymentStatus(booking.prepayment_status);
  const showPrepaymentFromApi = apiPrepay === "paid" || apiPrepay === "required" || apiPrepay === "pending";
  const isRequestBooking =
    isRequested || booking.booking_type === "request" || booking.status?.toLowerCase() === "requested";
  const teamMemberId =
    booking.team_member_id != null && String(booking.team_member_id).trim()
      ? String(booking.team_member_id)
      : fallbackResourceId || "unassigned";
  const splitPhone = splitContactPhone(
    booking.contact_number || parsedNotes?.phoneNumber || "",
    parsedNotes?.phoneCode,
  );
  const apiEr = status === "Confirmed" ? booking.edit_request : null;
  const notesEr = status === "Confirmed" ? parseStoredErFromNotes(booking.notes) : null;
  const erMeta = apiEr
    ? {
        status: apiEr.status,
        note: apiEr.note,
        initiatedBy: apiEr.initiated_by,
        requestedAt: apiEr.requested_at ?? undefined,
        approvedAt:
          apiEr.status === "approved" ? (apiEr.responded_at ?? undefined) : undefined,
        editGrantActive: Boolean(apiEr.edit_grant_active),
      }
    : notesEr;
  const isErPending = Boolean(erMeta && erMeta.status === "pending");
  const bookingRef = booking.unique_code || String(booking.id);
  if (status === "Confirmed") {
    syncEditRequestFromBookingApi(bookingRef, apiEr ?? null);
  }
  // Notes requestDirection is the source of truth (pro POV). Do not require
  // lastEditedBy — plain pro-sent BRs only store requestDirection: "outgoing".
  const isOutgoingRequest =
    status !== "Cancelled" &&
    (parsedNotes?.requestDirection === "outgoing" ||
      (parsedNotes?.lastEditedBy === "professional" &&
        parsedNotes?.responseStatus === "suggestion_for_change"));
  const isIncomingClientEbr =
    status !== "Cancelled" &&
    Boolean(ebrMeta) &&
    (ebrMeta!.status === "pending" || ebrMeta!.status === "suggested") &&
    (ebrMeta!.lastEditedBy === "client" ||
      Boolean(ebrMeta!.clientNote) ||
      parsedNotes?.lastEditedBy === "client");
  const isOutgoingProfessionalEbr =
    status !== "Cancelled" &&
    isRequested &&
    Boolean(ebrMeta) &&
    (ebrMeta!.status === "pending" || ebrMeta!.status === "suggested") &&
    (ebrMeta!.lastEditedBy === "professional" ||
      parsedNotes?.lastEditedBy === "professional" ||
      parsedNotes?.requestDirection === "outgoing") &&
    !isIncomingClientEbr;
  const clientNote = sanitizeInternalNoteText(ebrMeta?.clientNote);
  const incomingCreateNote =
    !clientNote &&
    (parsedNotes?.requestDirection === "incoming" || isRequestBooking)
      ? sanitizeInternalNoteText(parsedNotes?.clientNote || parsedNotes?.internalNote)
      : sanitizeInternalNoteText(parsedNotes?.clientNote);
  const displayClientNote = clientNote || incomingCreateNote;
  const internalNoteText = sanitizeInternalNoteText(parsedNotes?.internalNote);
  const professionalInternalNote =
    internalNoteText && internalNoteText !== displayClientNote ? internalNoteText : "";
  const erRequestDirection: "outgoing" | "incoming" | undefined = isErPending
    ? erMeta?.initiatedBy === "professional"
      ? "outgoing"
      : "incoming"
    : undefined;
  const resolvedRequestDirection: "outgoing" | "incoming" =
    erRequestDirection ??
    (parsedNotes?.requestDirection === "outgoing"
      ? "outgoing"
      : parsedNotes?.requestDirection === "incoming"
        ? "incoming"
        : isOutgoingRequest
          ? "outgoing"
          : "incoming");

  const locationDetails =
    booking.location_details && typeof booking.location_details === "object"
      ? (booking.location_details as {
          clientKind?: "individual" | "company";
          desiredLocation?: {
            street?: string;
            number?: string;
            postalCode?: string;
            province?: string;
            municipality?: string;
          };
        })
      : null;
  const desiredFromColumns =
    booking.location_type === "desired" &&
    (booking.street_address ||
      booking.street_number ||
      booking.postal_code ||
      booking.province ||
      booking.municipality)
      ? {
          street: String(booking.street_address ?? "").trim(),
          number: String(booking.street_number ?? "").trim(),
          postalCode: String(booking.postal_code ?? "").trim(),
          province: String(booking.province ?? "").trim(),
          municipality: String(booking.municipality ?? "").trim(),
        }
      : null;
  const desiredFromDetails = locationDetails?.desiredLocation
    ? {
        street: String(locationDetails.desiredLocation.street ?? "").trim(),
        number: String(locationDetails.desiredLocation.number ?? "").trim(),
        postalCode: String(locationDetails.desiredLocation.postalCode ?? "").trim(),
        province: String(locationDetails.desiredLocation.province ?? "").trim(),
        municipality: String(
          locationDetails.desiredLocation.municipality ?? "",
        ).trim(),
      }
    : null;
  const desiredFromNotes = parsedNotes?.desiredLocation
    ? {
        street: String(parsedNotes.desiredLocation.street ?? "").trim(),
        number: String(parsedNotes.desiredLocation.number ?? "").trim(),
        postalCode: String(parsedNotes.desiredLocation.postalCode ?? "").trim(),
        province: String(parsedNotes.desiredLocation.province ?? "").trim(),
        municipality: String(parsedNotes.desiredLocation.municipality ?? "").trim(),
      }
    : null;
  const resolvedDesiredLocation =
    desiredFromNotes ?? desiredFromDetails ?? desiredFromColumns;
  const clientKind = resolveEventClientKind({
    apiClientKind: booking.client_kind,
    notesClientKind: parsedNotes?.clientKind,
    locationDetailsKind: locationDetails?.clientKind,
  });

  return {
    id: `b-${booking.id}`,
    bookingCode: booking.unique_code || String(booking.id),
    resourceId: teamMemberId,
    // Prefer normalized `date` from overview API; raw booking_date used to be a
    // timezone-shifted Date ISO string (e.g. 2026-07-09 -> 2026-07-08T19:00:00.000Z).
    date: pendingEbr?.suggestedDateISO ||
      dateFromValue(booking.date || booking.booking_date || booking.start_time),
    start,
    end,
    title,
    status,
    location: booking.location_type ? (locationFromApi[booking.location_type] ?? "FL") : "FL",
    bookingType: booking.booking_type
      ? (bookingTypeFromApi[booking.booking_type] ?? "Online")
      : "Online",
    // BR/EBR only while the request is still pending — hide after accept/reject.
    // Scenario E = Confirmed Edit after ER grant save or accepted EBR (FL + DL).
    bookingScenario: parsedNotes?.needsOk && parsedNotes.ackScenario
      ? parsedNotes.ackScenario
      : isIncomingClientEbr || isOutgoingProfessionalEbr
      ? "EBR"
      : isErPending
        ? "ER"
        : isRequested
          ? "BR"
          : status === "Confirmed" &&
              !isErPending &&
              !parsedNotes?.silentUpdated &&
              (parsedNotes?.scheduleEdited ||
                parsedNotes?.lastEditedBy === "client" ||
                parsedNotes?.lastEditedBy === "professional" ||
                ebrMeta?.status === "accepted")
            ? "E"
            : undefined,
    showClientName: clientName,
    notes: booking.notes ?? null,
    updatedAt: booking.updated_at ?? booking.created_at ?? null,
    clientKind,
    details: {
      clientEmail: booking.customer_email ?? "",
      customerId: booking.customer_id ?? null,
      ...(clientKind ? { clientKind } : {}),
      requestDirection: resolvedRequestDirection,
      ...(resolvedDesiredLocation &&
      (resolvedDesiredLocation.street ||
        resolvedDesiredLocation.number ||
        resolvedDesiredLocation.postalCode ||
        resolvedDesiredLocation.province ||
        resolvedDesiredLocation.municipality)
        ? { desiredLocation: resolvedDesiredLocation }
        : {}),
      services: ebrServices ?? [
        {
          id: booking.service_id || `svc-b-${booking.id}`,
          name: title,
          durationMins: bookingDurationMins(start, end),
          price: Number(booking.total_price) || 0,
        },
      ],
      ...(pendingEbr?.suggestedProducts?.length
        ? { products: pendingEbr.suggestedProducts }
        : parsedNotes?.products?.length
          ? { products: parsedNotes.products }
          : {}),
      ...(pendingEbr?.editedServiceIds?.length || parsedNotes?.editedServiceIds?.length
        ? {
            editedServiceIds:
              pendingEbr?.editedServiceIds?.length
                ? pendingEbr.editedServiceIds
                : parsedNotes?.editedServiceIds,
          }
        : {}),
      ...(pendingEbr?.editedProductIds?.length || parsedNotes?.editedProductIds?.length
        ? {
            editedProductIds:
              pendingEbr?.editedProductIds?.length
                ? pendingEbr.editedProductIds
                : parsedNotes?.editedProductIds,
          }
        : {}),
      ...(isIncomingClientEbr && ebrMeta?.editedServiceIds?.length
        ? { clientEditedServiceIds: ebrMeta.editedServiceIds }
        : parsedNotes?.clientEditedServiceIds?.length
          ? { clientEditedServiceIds: parsedNotes.clientEditedServiceIds }
          : {}),
      // Do not invent lastEditedBy for a first-time BR — that falsely shows "Updated".
      // Only surface it for real edits (EBR / ER / notes that already recorded an editor).
      ...(isIncomingClientEbr
        ? { lastEditedBy: "client" as const, responseStatus: "suggestion_for_change" as const }
        : isErPending && erMeta?.initiatedBy
          ? { lastEditedBy: erMeta.initiatedBy }
          : parsedNotes?.lastEditedBy
            ? { lastEditedBy: parsedNotes.lastEditedBy }
            : {}),
      ...(!isIncomingClientEbr && parsedNotes?.responseStatus
        ? { responseStatus: parsedNotes.responseStatus }
        : {}),
      ...(parsedNotes?.needsOk ? { needsOk: true, ackScenario: parsedNotes.ackScenario } : {}),
      ...(parsedNotes?.ackRecipient ? { ackRecipient: parsedNotes.ackRecipient } : {}),
      ...(parsedNotes?.hiddenForProfessional ? { hiddenForProfessional: true } : {}),
      ...(parsedNotes?.hiddenForCustomer ? { hiddenForCustomer: true } : {}),
      ...(parsedNotes?.addedServiceIds?.length
        ? { addedServiceIds: parsedNotes.addedServiceIds }
        : {}),
      ...(parsedNotes?.cancelledServiceIds?.length
        ? { cancelledServiceIds: parsedNotes.cancelledServiceIds }
        : {}),
      ...(parsedNotes?.silentUpdated ? { silentUpdated: true } : {}),
      ...(parsedNotes?.silentUpdateSnapshot
        ? { silentUpdateSnapshot: parsedNotes.silentUpdateSnapshot }
        : {}),
      ...(parsedNotes?.scheduleEdited ? { scheduleEdited: true } : {}),
      ...(parsedNotes?.refunded ? { refunded: true } : {}),
      ...(parsedNotes?.waitingForPayment ? { waitingForPayment: true } : {}),
      ...(parsedNotes?.invoiceDueDate
        ? { invoiceDueDate: parsedNotes.invoiceDueDate }
        : {}),
      phoneCode: splitPhone.countryCode,
      phoneNumber: splitPhone.phone,
      showPrepayment: showPrepaymentFromApi || Boolean(parsedNotes?.showPrepayment),
      ...(mappedPrepayStatus ? { prepaymentStatus: mappedPrepayStatus } : {}),
      ...(displayClientNote ? { clientNote: displayClientNote } : {}),
      ...(professionalInternalNote
        ? {
            internalNote: professionalInternalNote,
            showInternalNote: true,
          }
        : {}),
      ...(isErPending && erMeta?.note
        ? {
            editRequestNote: erMeta.note,
            editRequestInitiatedBy: erMeta.initiatedBy,
          }
        : {}),
      ...(parsedNotes
        ? {
            showLateRescheduling: parsedNotes.showLateRescheduling,
            lateRescheduleFeePercent: parsedNotes.lateRescheduleFeePercent,
            ...(parsedNotes.lateRescheduleFeePercentCeiling
              ? {
                  lateRescheduleFeePercentCeiling:
                    parsedNotes.lateRescheduleFeePercentCeiling,
                }
              : {}),
            showLateCancellation: parsedNotes.showLateCancellation,
            lateCancellationFeePercent: parsedNotes.lateCancellationFeePercent,
            ...(parsedNotes.lateCancellationFeePercentCeiling
              ? {
                  lateCancellationFeePercentCeiling:
                    parsedNotes.lateCancellationFeePercentCeiling,
                }
              : {}),
            showNoShowFee: parsedNotes.showNoShowFee,
            noShowFeePercent: parsedNotes.noShowFeePercent,
            ...(parsedNotes.noShowFeePercentCeiling
              ? {
                  noShowFeePercentCeiling: parsedNotes.noShowFeePercentCeiling,
                }
              : {}),
            ...(parsedNotes.cancellationFeeAt
              ? { cancellationFeeAt: parsedNotes.cancellationFeeAt }
              : {}),
            ...(typeof parsedNotes.exceededCancellationWindow === "boolean"
              ? {
                  exceededCancellationWindow:
                    parsedNotes.exceededCancellationWindow,
                }
              : {}),
            prepaymentPercent: parsedNotes.prepaymentPercent,
            ...(mappedPrepayStatus
              ? { prepaymentStatus: mappedPrepayStatus }
              : parsedNotes.prepaymentStatus
                ? { prepaymentStatus: parsedNotes.prepaymentStatus }
                : {}),
            paymentMethod: parsedNotes.paymentMethod,
            showKilometerAllowance: parsedNotes.showKilometerAllowance,
            ...(parsedNotes.cancellationReason ? { cancellationReason: parsedNotes.cancellationReason } : {}),
            ...(parsedNotes.clientSnapshot ? { clientSnapshot: parsedNotes.clientSnapshot } : {}),
            ...(parsedNotes.guests?.length
              ? { guests: parsedNotes.guests }
              : (() => {
                  const snapshot = parsedNotes.clientSnapshot;
                  if (!snapshot?.people?.length || !snapshot.services?.length) return {};
                  const guests = snapshot.people
                    .filter(
                      (person) =>
                        !person.isRequester &&
                        person.participantType !== "planning" &&
                        person.participantType !== "notes" &&
                        person.name?.trim() !== "Planning" &&
                        person.name?.trim().toLowerCase() !== "notes",
                    )
                    .map((person) => {
                      const personId = String(person.id);
                      const services = (snapshot.services ?? [])
                        .filter((service) => String(service.guestId ?? "") === personId)
                        .map((service) => ({
                          id: String(service.id),
                          name: service.name,
                          price: Number(service.price) || 0,
                          durationMins: Math.max(15, Number(service.durationMins) || 15),
                          ...(service.startTime
                            ? { startTime: service.startTime }
                            : {}),
                          ...(service.endTime
                            ? { endTime: service.endTime }
                            : {}),
                          ...(service.teamMemberId
                            ? { staffResourceId: String(service.teamMemberId) }
                            : {}),
                        }));
                      return {
                        id: personId,
                        name: person.name,
                        email: person.email,
                        phoneCode: person.phoneCode,
                        phoneNumber: person.phoneNumber,
                        participantType:
                          person.participantType === "model"
                            ? ("model" as const)
                            : ("guest" as const),
                        services,
                        products: [] as Array<{
                          id: string;
                          name: string;
                          price: number;
                          quantity: number;
                          unitPrice: number;
                        }>,
                      };
                    })
                    .filter((guest) => guest.services.length > 0);
                  return guests.length ? { guests } : {};
                })()),
          }
        : {}),
    },
  };
}

export function mergeCalendarOverviewEvents(
  entries: readonly CalendarEntry[],
  bookings: readonly CalendarBooking[],
  fallbackResourceId: string,
): CalendarEvent[] {
  const entryEvents = entries
    .filter((entry) => entry.status !== "blocked")
    .map((entry) => mapCalendarEntryToOverviewEvent(entry, fallbackResourceId));

  const bookingEvents = bookings
    .map((booking) => mapCalendarBookingToEvent(booking, fallbackResourceId))
    .filter((event) => !event.details?.hiddenForProfessional);

  const bookingCodes = new Set(
    bookingEvents
      .map((event) => String(event.bookingCode ?? "").trim())
      .filter(Boolean),
  );
  const bookingKeys = new Set(
    bookingEvents.map(
      (event) => `${event.date}|${event.start}|${event.end}|${event.resourceId}`,
    ),
  );

  // Prefer booking rows over mirrored calendar entries (same OF123 / same slot).
  const dedupedEntries = entryEvents.filter((event) => {
    const code = String(event.bookingCode ?? "").trim();
    if (code && bookingCodes.has(code)) return false;
    return !bookingKeys.has(
      `${event.date}|${event.start}|${event.end}|${event.resourceId}`,
    );
  });

  return [...dedupedEntries, ...bookingEvents];
}
