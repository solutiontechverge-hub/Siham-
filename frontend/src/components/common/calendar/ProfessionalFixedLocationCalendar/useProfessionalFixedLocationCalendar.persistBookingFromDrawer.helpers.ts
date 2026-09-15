import { persistLinePricing } from "../../../../data/bookingLinePricing";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type {
  CalendarBookingServiceItem,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  detectEditedServiceIds,
  detectProductLineChanges,
  detectServiceLineChanges,
  flattenBookingServices,
  hasServiceReorderOnly,
  isSilentSafeBookingChange,
} from "../bookingRequestNegotiation";
import {
  findExternalStaffBookingOverlaps,
  findInternalStaffServiceOverlaps,
  type StaffServiceInterval,
} from "../calendar-overlap.utils";
import { mergeBookingTeamMembers } from "../../client-booking/buildBookingSummarySections";
import { clockHm } from "./useProfessionalFixedLocationCalendar.helpers";

export type PersistBookingGuest = {
  id: string;
  name: string;
  email?: string;
  phoneCode?: string;
  phoneNumber?: string;
  services: BookingServiceLineItem[];
  products: BookingProductLineItem[];
  participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
  planningActivity?: string;
  planningDuration?: string;
  planningStartTime?: string;
  planningEndTime?: string;
  bufferTeamMemberId?: string;
  bufferStartTime?: string;
  bufferEndTime?: string;
};

export function buildCurrentServicesForDiff(
  selectedServices: BookingServiceLineItem[],
  guestsForPersist: PersistBookingGuest[],
) {
  return [
    ...selectedServices.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      durationMins: service.durationMins,
      startTime: service.startTime,
      endTime: service.endTime,
      staffResourceId: service.staffResourceId,
      guestId: service.guestId,
    })),
    ...guestsForPersist.flatMap((guest) =>
      guest.services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMins: service.durationMins,
        startTime: service.startTime,
        endTime: service.endTime,
        staffResourceId: service.staffResourceId,
        guestId: guest.id,
      })),
    ),
  ];
}

export function buildSuggestedServicesForEbr(
  selectedServices: BookingServiceLineItem[],
  guestsForPersist: PersistBookingGuest[],
  snapshotServices: CalendarBookingServiceItem[],
): CalendarBookingServiceItem[] {
  return [
    ...selectedServices.map((service) => {
      const fromSnapshot =
        snapshotServices.find((row) => row.id === service.id) ??
        snapshotServices.find((row) => row.name === service.name);
      return {
        ...service,
        staffResourceId: service.staffResourceId,
        teamMemberId: service.staffResourceId,
        guestId: fromSnapshot?.guestId ?? null,
      };
    }),
    ...guestsForPersist.flatMap((guest) =>
      guest.services.map((service) => ({
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        staffResourceId: service.staffResourceId,
        teamMemberId: service.staffResourceId,
        startTime: service.startTime,
        endTime: service.endTime,
        guestId: guest.id,
      })),
    ),
  ];
}

export function buildSuggestedProductsForEbr(
  selectedProducts: BookingProductLineItem[],
  bookingUniqueItems: BookingProductLineItem[],
  guestsForPersist: PersistBookingGuest[],
) {
  return [
    ...selectedProducts.map((product) => ({
      ...product,
      guestId: null as string | null,
    })),
    ...bookingUniqueItems.map((product) => ({
      ...product,
      guestId: null as string | null,
    })),
    ...guestsForPersist.flatMap((guest) =>
      guest.products.map((product) => ({
        ...product,
        guestId: guest.id,
      })),
    ),
  ];
}

export function buildStaffServiceIntervals(input: {
  selectedServices: BookingServiceLineItem[];
  guestsForPersist: PersistBookingGuest[];
  selectedSlot: { resourceId: string; start: string; end: string };
}): StaffServiceInterval[] {
  const { selectedServices, guestsForPersist, selectedSlot } = input;
  const slotStart = selectedSlot.start.slice(0, 5);
  const slotEnd = selectedSlot.end.slice(0, 5);
  return [
    ...selectedServices.map((service) => ({
      id: service.id,
      name: service.name,
      staffId: service.staffResourceId || selectedSlot.resourceId,
      start: (service.startTime || slotStart).slice(0, 5),
      end: (service.endTime || slotEnd).slice(0, 5),
    })),
    ...guestsForPersist.flatMap((guest) =>
      guest.services.map((service) => ({
        id: `${guest.id}-${service.id}`,
        name: service.name,
        staffId: service.staffResourceId || selectedSlot.resourceId,
        start: (service.startTime || slotStart).slice(0, 5),
        end: (service.endTime || slotEnd).slice(0, 5),
      })),
    ),
    ...guestsForPersist
      .filter(
        (guest) =>
          guest.participantType === "buffer" &&
          Boolean(guest.bufferStartTime) &&
          Boolean(guest.bufferEndTime),
      )
      .map((guest) => ({
        id: guest.id,
        name: guest.name || "Buffer",
        staffId: guest.bufferTeamMemberId || selectedSlot.resourceId,
        start: guest.bufferStartTime!.slice(0, 5),
        end: guest.bufferEndTime!.slice(0, 5),
      })),
  ];
}

export function resolveStaffConflictMessage(input: {
  staffIntervals: StaffServiceInterval[];
  editingEventId: string | null;
  selectedSlotDate: string;
  events: readonly CalendarEvent[];
}): string | null {
  const { staffIntervals, editingEventId, selectedSlotDate, events } = input;
  const internalOverlaps = findInternalStaffServiceOverlaps(staffIntervals);
  const externalOverlaps = findExternalStaffBookingOverlaps({
    bookingId: editingEventId,
    date: selectedSlotDate,
    services: staffIntervals,
    events,
  });
  if (!internalOverlaps.length && !externalOverlaps.length) return null;
  const parts: string[] = [];
  if (internalOverlaps.length) {
    parts.push(
      `Same team member has overlapping services (${internalOverlaps
        .map(({ a, b }) => `${a.name} & ${b.name}`)
        .join(", ")})`,
    );
  }
  if (externalOverlaps.length) {
    parts.push(
      `Overlaps another booking (${externalOverlaps
        .map(({ service, event }) => `${service.name} / ${event.title}`)
        .slice(0, 3)
        .join(", ")})`,
    );
  }
  return `${parts.join(". ")}. You can still save this booking.`;
}

export function resolvePersistClientName(input: {
  selectedClientName?: string | null;
  guestDraft: { firstName: string; lastName: string };
  nonMollureDraft: { firstName: string; lastName: string };
}): string {
  return (
    input.selectedClientName?.trim() ||
    `${input.guestDraft.firstName} ${input.guestDraft.lastName}`.trim() ||
    `${input.nonMollureDraft.firstName} ${input.nonMollureDraft.lastName}`.trim() ||
    "Client"
  );
}

export function buildGuestServiceLines(
  guestsForPersist: PersistBookingGuest[],
  resourceNameById: Map<string, string>,
): CalendarBookingServiceItem[] {
  return guestsForPersist.flatMap((guest) =>
    guest.services.map((service) => {
      const staffId = service.staffResourceId;
      const staffName = staffId ? resourceNameById.get(staffId) : undefined;
      return {
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        staffResourceId: staffId,
        teamMemberId: staffId,
        teamMemberName: staffName,
        startTime: service.startTime,
        endTime: service.endTime,
        guestId: guest.id,
        ...persistLinePricing(service),
      };
    }),
  );
}

export function buildPersistServiceLines(
  selectedServices: BookingServiceLineItem[],
  guestServiceLines: CalendarBookingServiceItem[],
  resourceNameById: Map<string, string>,
) {
  return [
    ...selectedServices.map((service) => {
      const staffId = service.staffResourceId;
      const staffName = staffId ? resourceNameById.get(staffId) : undefined;
      return {
        ...service,
        guestId: null as string | null,
        teamMemberId: staffId ?? service.teamMemberId ?? null,
        teamMemberName: staffName,
        ...persistLinePricing(service),
      };
    }),
    ...guestServiceLines,
  ];
}

export function buildPersistProductLines(
  selectedProducts: BookingProductLineItem[],
  bookingUniqueItems: BookingProductLineItem[],
  guestsForPersist: PersistBookingGuest[],
) {
  return [
    ...selectedProducts.map((product) => ({
      ...product,
      guestId: null as string | null,
      ...persistLinePricing(product),
    })),
    ...bookingUniqueItems.map((product) => ({
      ...product,
      guestId: null as string | null,
      ...persistLinePricing(product),
    })),
    ...guestsForPersist.flatMap((guest) =>
      guest.products.map((product) => ({
        ...product,
        guestId: guest.id,
        ...persistLinePricing(product),
      })),
    ),
  ];
}

type EditableBookingDetails = NonNullable<CalendarEvent["details"]> & {
  // ponytail: mutable persist bag; keep loose to avoid snapshot union fights
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function applyExistingBookingEditLabels(input: {
  details: EditableBookingDetails;
  existingEvent: CalendarEvent;
  selectedSlot: { date: string; start: string; end: string };
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingProductLineItem[];
  guestsForPersist: PersistBookingGuest[];
  originalServicesSnapshot: BookingServiceLineItem[];
  silentBaseline: {
    services: BookingServiceLineItem[];
    guests: PersistBookingGuest[];
    products: BookingProductLineItem[];
    uniqueItems: BookingProductLineItem[];
    phoneCode: string;
    phoneNumber: string;
  } | null;
}): void {
  const {
    details,
    existingEvent,
    selectedSlot,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    guestsForPersist,
    originalServicesSnapshot,
    silentBaseline,
  } = input;

  const originalServices =
    existingEvent.details?.originalServices?.length
      ? existingEvent.details.originalServices
      : originalServicesSnapshot.length
        ? originalServicesSnapshot
        : selectedServices;
  const originalGuests =
    existingEvent.details?.originalGuests?.length
      ? existingEvent.details.originalGuests
      : silentBaseline?.guests ?? existingEvent.details?.guests;
  if (originalGuests?.length) details.originalGuests = originalGuests;
  const originalComparable = flattenBookingServices({
    services: originalServices,
    guests: silentBaseline?.guests ?? existingEvent.details?.guests,
  });
  const currentComparable = flattenBookingServices({
    services: details.services ?? [],
    guests: guestsForPersist,
  });
  details.originalServices = originalComparable.length
    ? originalComparable
    : originalServices;
  const editedIds = detectEditedServiceIds(
    originalComparable,
    currentComparable,
  );
  const lineChanges = detectServiceLineChanges(
    originalComparable,
    currentComparable,
  );
  const originalProducts = existingEvent.details?.products ?? [];
  const productChanges = detectProductLineChanges(
    originalProducts,
    details.products ?? [],
  );
  const editedProductIds = [
    ...productChanges.added,
    ...productChanges.edited,
    ...productChanges.cancelled,
  ];
  const dateChanged = existingEvent.date !== selectedSlot.date;
  const timeWindowChanged =
    clockHm(existingEvent.start) !== clockHm(selectedSlot.start) ||
    clockHm(existingEvent.end) !== clockHm(selectedSlot.end);
  const servicesReordered = hasServiceReorderOnly({
    previousServices:
      silentBaseline?.services ?? existingEvent.details?.services ?? [],
    currentServices: selectedServices,
    previousGuests: silentBaseline?.guests ?? existingEvent.details?.guests,
    currentGuests: guestsForPersist,
  });
  const scheduleChanged =
    dateChanged || (timeWindowChanged && !servicesReordered);
  const silentSafeOnly =
    existingEvent.status === "Confirmed" &&
    isSilentSafeBookingChange({
      previousServices:
        silentBaseline?.services ?? existingEvent.details?.services ?? [],
      currentServices: selectedServices,
      previousGuests: silentBaseline?.guests ?? existingEvent.details?.guests,
      currentGuests: guestsForPersist,
      previousPeople: existingEvent.details?.clientSnapshot?.people,
      currentPeople: existingEvent.details?.clientSnapshot?.people,
      previousPhoneCode:
        silentBaseline?.phoneCode ?? existingEvent.details?.phoneCode,
      currentPhoneCode: details.phoneCode,
      previousPhoneNumber:
        silentBaseline?.phoneNumber ?? existingEvent.details?.phoneNumber,
      currentPhoneNumber: details.phoneNumber,
      previousProducts: silentBaseline
        ? [...silentBaseline.products, ...silentBaseline.uniqueItems]
        : (existingEvent.details?.products ?? originalProducts),
      // Catalog + unique only — guest products live on guestsForPersist so
      // flattenBookingProducts does not false-flag nested guest products.
      currentProducts: [...selectedProducts, ...bookingUniqueItems],
      scheduleChanged,
    });
  if (silentSafeOnly) {
    details.silentUpdated = true;
    details.lastEditedBy = "professional";
    details.editedServiceIds = existingEvent.details?.editedServiceIds;
    details.addedServiceIds = existingEvent.details?.addedServiceIds;
    details.cancelledServiceIds = existingEvent.details?.cancelledServiceIds;
    details.editedProductIds = existingEvent.details?.editedProductIds;
    details.addedProductIds = existingEvent.details?.addedProductIds;
    details.cancelledProductIds = existingEvent.details?.cancelledProductIds;
    details.scheduleEdited = existingEvent.details?.scheduleEdited;
    const rawSnapshot = {
      phoneCode: silentBaseline?.phoneCode ?? existingEvent.details?.phoneCode,
      phoneNumber:
        silentBaseline?.phoneNumber ?? existingEvent.details?.phoneNumber,
      guests: silentBaseline?.guests ?? existingEvent.details?.guests,
      services: silentBaseline?.services ?? existingEvent.details?.services,
      products: silentBaseline
        ? [...silentBaseline.products, ...silentBaseline.uniqueItems]
        : existingEvent.details?.products,
      people: existingEvent.details?.clientSnapshot?.people,
      desiredLocation: existingEvent.details?.desiredLocation,
    };
    try {
      details.silentUpdateSnapshot = JSON.parse(
        JSON.stringify(rawSnapshot),
      ) as typeof rawSnapshot;
    } catch {
      details.silentUpdateSnapshot = rawSnapshot;
    }
  } else {
    details.silentUpdated = undefined;
    const baselineSnapshot = {
      phoneCode: silentBaseline?.phoneCode ?? existingEvent.details?.phoneCode,
      phoneNumber:
        silentBaseline?.phoneNumber ?? existingEvent.details?.phoneNumber,
      guests: silentBaseline?.guests ?? existingEvent.details?.guests,
      services: silentBaseline?.services ?? existingEvent.details?.services,
      products: silentBaseline
        ? [...silentBaseline.products, ...silentBaseline.uniqueItems]
        : existingEvent.details?.products,
      people: existingEvent.details?.clientSnapshot?.people,
      desiredLocation: existingEvent.details?.desiredLocation,
    };
    const snapshotForNotes =
      existingEvent.status === "Confirmed"
        ? baselineSnapshot
        : (existingEvent.details?.silentUpdateSnapshot ?? baselineSnapshot);
    try {
      details.silentUpdateSnapshot = JSON.parse(
        JSON.stringify(snapshotForNotes),
      ) as typeof baselineSnapshot;
    } catch {
      details.silentUpdateSnapshot = snapshotForNotes;
    }
    if (lineChanges.edited.length) {
      details.editedServiceIds = lineChanges.edited;
    }
    if (lineChanges.added.length) details.addedServiceIds = lineChanges.added;
    if (lineChanges.cancelled.length) {
      details.cancelledServiceIds = lineChanges.cancelled;
    }
    if (productChanges.edited.length) {
      details.editedProductIds = productChanges.edited;
    }
    if (productChanges.added.length) {
      details.addedProductIds = productChanges.added;
    }
    if (productChanges.cancelled.length) {
      details.cancelledProductIds = productChanges.cancelled;
    }
    if (scheduleChanged) {
      details.scheduleEdited = true;
      details.lastEditedBy = "professional";
    } else if (existingEvent.status === "Confirmed") {
      details.lastEditedBy = "professional";
    } else if (editedIds.length || editedProductIds.length) {
      details.lastEditedBy = "professional";
    }
  }
}

export function buildPersistClientSnapshot(input: {
  existingClientSnapshot: NonNullable<CalendarEvent["details"]>["clientSnapshot"];
  clientName: string;
  guestsForPersist: PersistBookingGuest[];
  services: CalendarBookingServiceItem[];
  resourceNameById: Map<string, string>;
  canUseBookingProject: boolean;
  bookingProjectEnabled: boolean;
  bookingProjectDescription: string;
  projectUploadsForSnapshot: {
    id: string;
    name: string;
    url?: string;
    mimeType?: string;
    kind?: string;
    previewUrl?: string;
  }[];
}) {
  const {
    existingClientSnapshot,
    clientName,
    guestsForPersist,
    services,
    resourceNameById,
    canUseBookingProject,
    bookingProjectEnabled,
    bookingProjectDescription,
    projectUploadsForSnapshot,
  } = input;

  return {
    people: [
      {
        id:
          existingClientSnapshot?.people?.find((person) => person.isRequester)
            ?.id ??
          existingClientSnapshot?.people?.[0]?.id ??
          "p-requester",
        name:
          existingClientSnapshot?.people?.find((person) => person.isRequester)
            ?.name || clientName,
        isRequester: true as const,
      },
      ...guestsForPersist.map((guest) => {
        const existingPerson = existingClientSnapshot?.people?.find(
          (person) => person.id === guest.id,
        );
        return {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          phoneCode: guest.phoneCode,
          phoneNumber: guest.phoneNumber,
          isRequester: false as const,
          participantType:
            guest.participantType ??
            existingPerson?.participantType ??
            ("guest" as const),
          planningActivity: guest.planningActivity,
          planningDuration: guest.planningDuration,
          planningStartTime: guest.planningStartTime,
          planningEndTime: guest.planningEndTime,
          bufferTeamMemberId: guest.bufferTeamMemberId,
          bufferStartTime: guest.bufferStartTime,
          bufferEndTime: guest.bufferEndTime,
        };
      }),
    ],
    services: services.map((service) => {
      const teamMemberId =
        service.staffResourceId ?? service.teamMemberId ?? null;
      const teamMemberName =
        service.teamMemberName ??
        (teamMemberId ? resourceNameById.get(String(teamMemberId)) : undefined);
      return {
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        startTime: service.startTime,
        endTime: service.endTime,
        guestId: service.guestId ?? null,
        teamMemberId,
        teamMemberName: teamMemberName || undefined,
        ...persistLinePricing(service),
      };
    }),
    teamMembers: mergeBookingTeamMembers(
      existingClientSnapshot?.teamMembers,
      services.flatMap((service) => {
        const id = service.staffResourceId ?? service.teamMemberId;
        const name =
          service.teamMemberName ||
          (id ? resourceNameById.get(String(id)) : undefined);
        return id && name ? [{ id: String(id), name }] : [];
      }),
    ),
    ...(canUseBookingProject && bookingProjectEnabled
      ? {
          projectDetails: {
            description: bookingProjectDescription,
            uploads: projectUploadsForSnapshot
              .filter(
                (upload) =>
                  Boolean(upload.url) &&
                  !String(upload.url).startsWith("blob:"),
              )
              .map((upload) => ({
                id: upload.id,
                name: upload.name,
                url: upload.url,
                mimeType: upload.mimeType,
                kind: upload.kind,
                previewUrl: upload.url || upload.previewUrl,
              })),
          },
        }
      : {}),
  };
}

export function buildLocalPersistEvent(input: {
  id: string;
  bookingCode: string;
  selectedSlot: {
    resourceId: string;
    date: string;
    start: string;
    end: string;
  };
  title: string;
  resolvedStatus: CalendarEvent["status"];
  slotLocation: CalendarEvent["location"];
  resolvedBookingType: NonNullable<CalendarEvent["bookingType"]>;
  existingEvent: CalendarEvent | null | undefined;
  details: CalendarEvent["details"];
  clientName: string;
  selectedClientKind?: CalendarEvent["clientKind"];
}): CalendarEvent {
  const {
    id,
    bookingCode,
    selectedSlot,
    title,
    resolvedStatus,
    slotLocation,
    resolvedBookingType,
    existingEvent,
    details,
    clientName,
    selectedClientKind,
  } = input;
  return {
    id,
    bookingCode,
    resourceId: selectedSlot.resourceId,
    date: selectedSlot.date,
    start: selectedSlot.start,
    end: selectedSlot.end,
    title,
    status: resolvedStatus,
    location: slotLocation,
    bookingType: resolvedBookingType,
    bookingScenario:
      resolvedStatus === "Requested"
        ? (existingEvent?.bookingScenario ?? "BR")
        : resolvedStatus === "Confirmed" &&
            (details?.scheduleEdited ||
              details?.lastEditedBy === "professional" ||
              details?.lastEditedBy === "client") &&
            !details?.silentUpdated
          ? "E"
          : undefined,
    showClientName: clientName,
    clientKind: selectedClientKind,
    details,
  };
}
