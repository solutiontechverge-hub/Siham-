import type {
  CalendarBookingDetails,
  CalendarBookingGuestItem,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { ensureGroupedServiceStartEndTimes } from "../../../data/bookingServiceEdit.data";
import { normalizeServiceLinePricing } from "../../../data/bookingLinePricing";
import { splitContactPhone } from "../../../lib/phone-validation";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";
import {
  assignedLinesForPerson,
  filterMainClientAssignedLines,
  guestFromSnapshotPerson,
  isDisplayableSnapshotPerson,
  mainDrawerServicesFromClientSnapshot,
  normalizeAssignmentId,
  requesterPersonIds,
} from "./bookingEventDetails.guestScope";
import {
  resolveEventKilometerAllowance,
  sanitizeInternalNoteText,
} from "./bookingEventDetails";
export type BookingDrawerHydration = {
  clientEmail: string;
  services: NonNullable<CalendarBookingDetails["services"]>;
  products: NonNullable<CalendarBookingDetails["products"]>;
  guests: NonNullable<CalendarBookingDetails["guests"]>;
  phoneCode: string;
  phoneNumber: string;
  desiredLocation: NonNullable<CalendarBookingDetails["desiredLocation"]>;
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
  showInternalNote: boolean;
  internalNote: string;
  totalDiscount: ManualEntryDiscount | null;
  showKilometerAllowance: boolean;
  kilometerAllowance: NonNullable<CalendarBookingDetails["kilometerAllowance"]>;
};

export const emptyDesiredLocation = () => ({
  street: "",
  number: "",
  postalCode: "",
  province: "",
  municipality: "",
});

export function resolveBookingDetailsFromEvent(ev: CalendarEvent): CalendarBookingDetails {
  const km = resolveEventKilometerAllowance(ev.details, ev.notes);
  if (ev.details) {
    return {
      ...ev.details,
      showKilometerAllowance: km.showKilometerAllowance,
      kilometerAllowance: km.kilometerAllowance,
    };
  }

  return {
    services: [],
    products: [],
    clientEmail: "",
    phoneCode: "",
    phoneNumber: "",
    showKilometerAllowance: km.showKilometerAllowance,
    kilometerAllowance: km.kilometerAllowance,
    ...(ev.location === "DL"
      ? {
          desiredLocation: {
            street: "",
            number: "",
            postalCode: "",
            province: "",
            municipality: "",
          },
        }
      : {}),
  };
}

export function hydrateBookingDrawerFromEvent(ev: CalendarEvent): BookingDrawerHydration {
  const details = resolveBookingDetailsFromEvent(ev);

  const splitPhone = splitContactPhone(
    details.phoneNumber ?? "",
    details.phoneCode,
  );

  const snapshotPeople = details.clientSnapshot?.people ?? [];
  const snapshotServices = details.clientSnapshot?.services ?? [];
  const guestsFromNotes = details.guests ?? [];
  const guests: CalendarBookingGuestItem[] =
    guestsFromNotes.length > 0
      ? guestsFromNotes.map((guest) => {
          const person = snapshotPeople.find(
            (p) => normalizeAssignmentId(p.id) === normalizeAssignmentId(guest.id),
          );
          return {
            ...guest,
            email: guest.email || person?.email || "",
            phoneCode: guest.phoneCode || person?.phoneCode || "",
            phoneNumber: guest.phoneNumber || person?.phoneNumber || "",
            participantType:
              guest.participantType ?? person?.participantType ?? "guest",
            planningActivity: guest.planningActivity || person?.planningActivity,
            planningDuration: guest.planningDuration || person?.planningDuration,
            planningStartTime: guest.planningStartTime || person?.planningStartTime,
            planningEndTime: guest.planningEndTime || person?.planningEndTime,
            bufferTeamMemberId:
              guest.bufferTeamMemberId || person?.bufferTeamMemberId,
            bufferStartTime: guest.bufferStartTime || person?.bufferStartTime,
            bufferEndTime: guest.bufferEndTime || person?.bufferEndTime,
            services: assignedLinesForPerson(
              guest.services,
              details.services,
              guest.id,
            ),
            products: assignedLinesForPerson(
              guest.products,
              details.products,
              guest.id,
            ),
          };
        })
      : snapshotPeople
          .filter(isDisplayableSnapshotPerson)
          .map((person) =>
            guestFromSnapshotPerson(person, snapshotServices, details),
          );

  if (guestsFromNotes.length > 0) {
    const existingIds = new Set(
      guests.map((guest) => normalizeAssignmentId(guest.id)),
    );
    const existingPlanningKeys = new Set(
      guests
        .filter(
          (guest) =>
            guest.participantType === "planning" || guest.name === "Planning",
        )
        .map((guest) =>
          [
            (guest.planningActivity ?? "").trim().toLowerCase(),
            (guest.planningStartTime ?? "").trim(),
            (guest.planningEndTime ?? "").trim(),
            (guest.planningDuration ?? "").trim().toLowerCase(),
          ].join("|"),
        ),
    );
    for (const person of snapshotPeople) {
      if (!isDisplayableSnapshotPerson(person)) continue;
      if (existingIds.has(normalizeAssignmentId(person.id))) continue;
      const isPlanning =
        person.participantType === "planning" || person.name === "Planning";
      if (isPlanning) {
        const fingerprint = [
          (person.planningActivity ?? "").trim().toLowerCase(),
          (person.planningStartTime ?? "").trim(),
          (person.planningEndTime ?? "").trim(),
          (person.planningDuration ?? "").trim().toLowerCase(),
        ].join("|");
        if (existingPlanningKeys.has(fingerprint)) continue;
        existingPlanningKeys.add(fingerprint);
      }
      guests.push(guestFromSnapshotPerson(person, snapshotServices, details));
    }
  }

  const requesterIds = requesterPersonIds(details.clientSnapshot);
  // The flat `details.services` field can be a legacy single-service mirror of
  // the booking row. Always merge it with the durable client snapshot so a
  // client-added service is never silently dropped from the drawer.
  const snapshotMainServices = mainDrawerServicesFromClientSnapshot(
    details.clientSnapshot,
  ) ?? [];
  const rawServices = [
    ...snapshotMainServices,
    ...filterMainClientAssignedLines(details.services, requesterIds),
  ]
    .filter((service, index, all) =>
      all.findIndex((candidate) => String(candidate.id) === String(service.id)) ===
      index,
    )
    .map((service) => ({ ...service, ...normalizeServiceLinePricing(service) }));
  const rawProducts = filterMainClientAssignedLines(
    details.products ?? [],
    requesterIds,
  );

  // One shared timeline: client lines first, then each guest's lines.
  const [services, ...guestServiceGroups] = ensureGroupedServiceStartEndTimes(
    [
      rawServices,
      ...guests.map((guest) =>
        guest.services.map((service) => ({
          ...service,
          ...normalizeServiceLinePricing(service),
        })),
      ),
    ],
    ev.start,
  );
  const guestsWithTimes = guests.map((guest, index) => ({
    ...guest,
    services: guestServiceGroups[index] ?? [],
  }));

  return {
    clientEmail: details.clientEmail ?? "",
    services,
    products: rawProducts,
    guests: guestsWithTimes,
    phoneCode: splitPhone.countryCode,
    phoneNumber: splitPhone.phone,
    desiredLocation: details.desiredLocation ?? emptyDesiredLocation(),
    showPrepayment:
      Boolean(details.showPrepayment) ||
      details.prepaymentStatus === "confirmed" ||
      details.prepaymentStatus === "pending" ||
      (Number(details.prepaymentPercent) || 0) > 0,
    // Client notes may store percent as a number — keep drawer state as string.
    prepaymentPercent:
      details.prepaymentPercent != null &&
      String(details.prepaymentPercent).trim() !== ""
        ? String(details.prepaymentPercent).trim()
        : "",
    paymentMethod: details.paymentMethod ?? "online",
    showLateCancellation: Boolean(details.showLateCancellation),
    lateCancellationFeePercent: details.lateCancellationFeePercent ?? "",
    lateCancellationFeePercentCeiling:
      details.lateCancellationFeePercentCeiling ??
      details.lateCancellationFeePercent ??
      "",
    showLateRescheduling: Boolean(details.showLateRescheduling),
    lateRescheduleFeePercent: details.lateRescheduleFeePercent ?? "",
    lateRescheduleFeePercentCeiling:
      details.lateRescheduleFeePercentCeiling ??
      details.lateRescheduleFeePercent ??
      "",
    showNoShowFee: Boolean(details.showNoShowFee),
    noShowFeePercent: details.noShowFeePercent ?? "",
    noShowFeePercentCeiling:
      details.noShowFeePercentCeiling ?? details.noShowFeePercent ?? "",
    showInternalNote: Boolean(sanitizeInternalNoteText(details.internalNote)),
    internalNote: sanitizeInternalNoteText(details.internalNote),
    totalDiscount: details.totalDiscount ?? null,
    showKilometerAllowance: Boolean(details.showKilometerAllowance),
    kilometerAllowance: details.kilometerAllowance ?? { eurPerKm: "", totalKilometer: "" },
  };
}

export function buildBookingDetailsSnapshot(input: {
  selectedClient: {
    name: string;
    email: string;
    clientKind?: "individual" | "company";
    mollureUserId?: string | null;
    isGuest?: boolean;
  } | null;
  isGuest?: boolean;
  selectedServices: BookingDrawerHydration["services"];
  selectedProducts: BookingDrawerHydration["products"];
  bookingGuests: BookingDrawerHydration["guests"];
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  desiredLocationDraft: BookingDrawerHydration["desiredLocation"];
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling?: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling?: string;
  showNoShowFee?: boolean;
  noShowFeePercent?: string;
  noShowFeePercentCeiling?: string;
  cancellationFeeAt?: string;
  exceededCancellationWindow?: boolean;
  showInternalNote: boolean;
  bookingInternalNote: string;
  bookingTotalDiscount: ManualEntryDiscount | null;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: BookingDrawerHydration["kilometerAllowance"];
  requestDirection?: CalendarBookingDetails["requestDirection"];
  originalServices?: CalendarBookingDetails["originalServices"];
  originalGuests?: CalendarBookingDetails["originalGuests"];
  editedServiceIds?: CalendarBookingDetails["editedServiceIds"];
  addedServiceIds?: CalendarBookingDetails["addedServiceIds"];
  cancelledServiceIds?: CalendarBookingDetails["cancelledServiceIds"];
  editedProductIds?: CalendarBookingDetails["editedProductIds"];
  addedProductIds?: CalendarBookingDetails["addedProductIds"];
  cancelledProductIds?: CalendarBookingDetails["cancelledProductIds"];
  clientEditedServiceIds?: CalendarBookingDetails["clientEditedServiceIds"];
  lastEditedBy?: CalendarBookingDetails["lastEditedBy"];
  clientNote?: string;
}): CalendarBookingDetails {
  const mollureId = String(input.selectedClient?.mollureUserId ?? "").trim();
  const customerId =
    mollureId && mollureId !== "platform" ? mollureId : undefined;
  const isGuest =
    Boolean(input.isGuest) || Boolean(input.selectedClient?.isGuest);
  return {
    clientEmail: input.selectedClient?.email ?? "",
    ...(customerId && !isGuest ? { customerId } : {}),
    ...(isGuest
      ? { isGuest: true }
      : input.selectedClient?.clientKind
        ? { clientKind: input.selectedClient.clientKind }
        : {}),
    services: input.selectedServices,
    products: input.selectedProducts,
    guests: input.bookingGuests,
    phoneCode: input.bookingPhoneDraft.phoneCode,
    phoneNumber: input.bookingPhoneDraft.phoneNumber,
    desiredLocation: input.desiredLocationDraft,
    showPrepayment: input.showPrepayment,
    prepaymentPercent: input.prepaymentPercent,
    paymentMethod: input.paymentMethod,
    showLateCancellation: input.showLateCancellation,
    lateCancellationFeePercent: input.lateCancellationFeePercent,
    ...(input.lateCancellationFeePercentCeiling
      ? {
          lateCancellationFeePercentCeiling:
            input.lateCancellationFeePercentCeiling,
        }
      : {}),
    showLateRescheduling: input.showLateRescheduling,
    lateRescheduleFeePercent: input.lateRescheduleFeePercent,
    ...(input.lateRescheduleFeePercentCeiling
      ? {
          lateRescheduleFeePercentCeiling: input.lateRescheduleFeePercentCeiling,
        }
      : {}),
    showNoShowFee: Boolean(input.showNoShowFee),
    noShowFeePercent: input.noShowFeePercent ?? "",
    ...(input.noShowFeePercentCeiling
      ? { noShowFeePercentCeiling: input.noShowFeePercentCeiling }
      : {}),
    ...(input.cancellationFeeAt
      ? { cancellationFeeAt: input.cancellationFeeAt }
      : {}),
    ...(typeof input.exceededCancellationWindow === "boolean"
      ? { exceededCancellationWindow: input.exceededCancellationWindow }
      : {}),
    showInternalNote: input.showInternalNote || Boolean(input.bookingInternalNote.trim()),
    internalNote: input.bookingInternalNote,
    ...(input.clientNote?.trim() ? { clientNote: input.clientNote.trim() } : {}),
    totalDiscount: input.bookingTotalDiscount,
    showKilometerAllowance: input.showKilometerAllowance,
    kilometerAllowance: input.kilometerAllowanceDraft,
    ...(input.requestDirection ? { requestDirection: input.requestDirection } : {}),
    ...(input.originalServices ? { originalServices: input.originalServices } : {}),
    ...(input.originalGuests?.length ? { originalGuests: input.originalGuests } : {}),
    ...(input.editedServiceIds ? { editedServiceIds: input.editedServiceIds } : {}),
    ...(input.addedServiceIds?.length ? { addedServiceIds: input.addedServiceIds } : {}),
    ...(input.cancelledServiceIds?.length
      ? { cancelledServiceIds: input.cancelledServiceIds }
      : {}),
    ...(input.editedProductIds?.length ? { editedProductIds: input.editedProductIds } : {}),
    ...(input.addedProductIds?.length ? { addedProductIds: input.addedProductIds } : {}),
    ...(input.cancelledProductIds?.length
      ? { cancelledProductIds: input.cancelledProductIds }
      : {}),
    ...(input.clientEditedServiceIds ? { clientEditedServiceIds: input.clientEditedServiceIds } : {}),
    ...(input.lastEditedBy ? { lastEditedBy: input.lastEditedBy } : {}),
  };
}

