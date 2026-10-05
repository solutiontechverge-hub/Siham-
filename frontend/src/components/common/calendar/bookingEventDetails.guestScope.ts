import type {
  CalendarBookingDetails,
  CalendarBookingGuestItem,
  CalendarBookingServiceItem,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { extraBookingParticipantIds, isExtraBookingParticipant } from "../../../data/bookingChronologicalBlocks";

export function normalizeAssignmentId(value: string | null | undefined): string {
  return value != null ? String(value).trim() : "";
}

export function requesterPersonIds(
  snapshot?: CalendarBookingDetails["clientSnapshot"],
): Set<string> {
  const extraIds = extraBookingParticipantIds(snapshot?.people);
  const ids = new Set<string>();
  for (const person of snapshot?.people ?? []) {
    const id = normalizeAssignmentId(person.id);
    if (!id || extraIds.has(id)) continue;
    ids.add(id);
  }
  return ids;
}

/**
 * Main-client lines are unassigned, tagged to the requester, or tagged to a
 * company contact. Guest/model/planning/buffer ids stay on their own cards.
 */
export function isMainClientAssignedLine(
  guestId: string | null | undefined,
  requesterIds: Set<string>,
): boolean {
  const id = normalizeAssignmentId(guestId);
  if (!id) return true;
  return requesterIds.has(id);
}

export function filterMainClientAssignedLines<T extends { guestId?: string | null }>(
  lines: readonly T[] | null | undefined,
  requesterIds: Set<string>,
): T[] {
  return (lines ?? []).filter((line) =>
    isMainClientAssignedLine(line.guestId, requesterIds),
  );
}

export function assignedLinesForPerson<T extends { guestId?: string | null }>(
  nested: readonly T[] | null | undefined,
  flat: readonly T[] | null | undefined,
  personId: string,
): T[] {
  if (nested?.length) return [...nested];
  const id = normalizeAssignmentId(personId);
  if (!id) return [];
  return (flat ?? []).filter(
    (line) => normalizeAssignmentId(line.guestId) === id,
  );
}

export type SnapshotPerson = NonNullable<
  NonNullable<CalendarBookingDetails["clientSnapshot"]>["people"]
>[number];

export function isDisplayableSnapshotPerson(person: SnapshotPerson) {
  return isExtraBookingParticipant(person);
}

export function guestFromSnapshotPerson(
  person: SnapshotPerson,
  snapshotServices: NonNullable<
    NonNullable<CalendarBookingDetails["clientSnapshot"]>["services"]
  >,
  details: CalendarBookingDetails,
): CalendarBookingGuestItem {
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    phoneCode: person.phoneCode,
    phoneNumber: person.phoneNumber,
    services: assignedLinesForPerson<CalendarBookingServiceItem>(
      snapshotServices
        .filter(
          (service) =>
            normalizeAssignmentId(service.guestId) ===
            normalizeAssignmentId(person.id),
        )
        .map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMins: service.durationMins,
          startTime: service.startTime,
          endTime: service.endTime,
          ...(service.teamMemberId
            ? {
                teamMemberId: String(service.teamMemberId),
                staffResourceId: String(service.teamMemberId),
              }
            : {}),
          guestId: service.guestId ?? person.id,
          discount: service.discount ?? null,
          originalPrice: service.originalPrice,
        })),
      details.services,
      person.id,
    ),
    products: assignedLinesForPerson([], details.products, person.id),
    participantType: person.participantType ?? ("guest" as const),
    planningActivity: person.planningActivity,
    planningDuration: person.planningDuration,
    planningStartTime: person.planningStartTime,
    planningEndTime: person.planningEndTime,
    bufferTeamMemberId: person.bufferTeamMemberId,
    bufferStartTime: person.bufferStartTime,
    bufferEndTime: person.bufferEndTime,
  };
}

/**
 * Client bookings store every line in `clientSnapshot.services`, while the API
 * booking row only keeps a single `service_id`. Map requester / unassigned lines
 * into drawer `services` so each appears as its own card. Guest / model lines stay
 * under BookingDrawerClientSnapshotSection.
 */
export function mainDrawerServicesFromClientSnapshot(
  snapshot: CalendarBookingDetails["clientSnapshot"] | undefined,
): CalendarBookingServiceItem[] | undefined {
  const services = snapshot?.services;
  if (!services?.length) return undefined;

  const requesterIds = requesterPersonIds(snapshot);
  // Older and fixed-location client requests may not include a requester
  // person record. In that case the guestId cannot be used to decide scope;
  // keep every line rather than silently losing services from the pro drawer.
  const mainServices = requesterIds.size
    ? filterMainClientAssignedLines(services, requesterIds)
    : [...services];

  if (!mainServices.length) return undefined;

  return mainServices.map((service) => {
    const teamMemberId = service.teamMemberId
      ? String(service.teamMemberId)
      : undefined;
    return {
      id: service.id,
      name: service.name,
      price: Number(service.price) || 0,
      durationMins: Math.max(15, Number(service.durationMins) || 15),
      ...(service.startTime ? { startTime: service.startTime } : {}),
      ...(service.endTime ? { endTime: service.endTime } : {}),
      // Keep both fields: lane filters use teamMemberId; older rows used staffResourceId.
      ...(teamMemberId
        ? { teamMemberId, staffResourceId: teamMemberId }
        : {}),
      ...(service.teamMemberName ? { teamMemberName: service.teamMemberName } : {}),
      guestId: service.guestId == null || !String(service.guestId).trim()
        ? null
        : String(service.guestId),
      ...(service.originalPrice != null ? { originalPrice: Number(service.originalPrice) } : {}),
      ...(service.discount ? { discount: service.discount } : {}),
    };
  });
}
