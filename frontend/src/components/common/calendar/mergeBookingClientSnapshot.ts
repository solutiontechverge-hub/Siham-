import type { CalendarBookingClientSnapshot } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  dedupePlanningPeople,
  extraBookingParticipantIds,
  isExtraBookingParticipant,
} from "../../../data/bookingChronologicalBlocks";

type SnapshotPeople = NonNullable<CalendarBookingClientSnapshot["people"]>;

function extraPeopleCount(people: SnapshotPeople | undefined) {
  return (people ?? []).filter((person) => isExtraBookingParticipant(person)).length;
}

function mergePeople(
  primary: SnapshotPeople | undefined,
  fallback: SnapshotPeople | undefined,
): SnapshotPeople | undefined {
  if (!primary?.length) return fallback?.length ? [...fallback] : undefined;
  if (!fallback?.length) return [...primary];
  // Prefer the side that still has models/planning/guests.
  if (extraPeopleCount(fallback) > extraPeopleCount(primary)) {
    return mergePeople(fallback, primary);
  }
  const byId = new Map(primary.map((person) => [String(person.id), { ...person }]));
  for (const person of fallback) {
    const id = String(person.id);
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, { ...person });
      continue;
    }
    byId.set(id, {
      ...person,
      ...existing,
      participantType: existing.participantType ?? person.participantType,
      planningActivity: existing.planningActivity || person.planningActivity,
      planningDuration: existing.planningDuration || person.planningDuration,
      planningStartTime: existing.planningStartTime || person.planningStartTime,
      planningEndTime: existing.planningEndTime || person.planningEndTime,
      bufferStartTime: existing.bufferStartTime || person.bufferStartTime,
      bufferEndTime: existing.bufferEndTime || person.bufferEndTime,
      bufferTeamMemberId:
        existing.bufferTeamMemberId || person.bufferTeamMemberId,
    });
  }
  return dedupePlanningPeople([...byId.values()]);
}

function mergeServices(
  primary: NonNullable<CalendarBookingClientSnapshot["services"]> | undefined,
  fallback: NonNullable<CalendarBookingClientSnapshot["services"]> | undefined,
  people: SnapshotPeople | undefined,
) {
  const merged = [...(primary ?? [])];
  const extraIds = extraBookingParticipantIds(people);
  const keyOf = (row: { id: string; guestId?: string | null }) => {
    const guest = String(row.guestId ?? "").trim();
    const owner = guest && extraIds.has(guest) ? guest : "";
    return `${owner}::${row.id}`;
  };
  const indexByKey = new Map(merged.map((row, index) => [keyOf(row), index]));
  for (const row of fallback ?? []) {
    const key = keyOf(row);
    const existingIndex = indexByKey.get(key);
    if (existingIndex != null) {
      const existing = merged[existingIndex];
      // Notes are usually the newest source, but location_details is the
      // durable full snapshot. Fill any missing assignment/detail fields from
      // it instead of discarding the duplicate service line outright.
      merged[existingIndex] = {
        ...row,
        ...existing,
        teamMemberId: existing.teamMemberId ?? row.teamMemberId,
        teamMemberName: existing.teamMemberName ?? row.teamMemberName,
        startTime: existing.startTime ?? row.startTime,
        endTime: existing.endTime ?? row.endTime,
        guestId: existing.guestId ?? row.guestId,
        originalPrice: existing.originalPrice ?? row.originalPrice,
        discount: existing.discount ?? row.discount,
        discountPct: existing.discountPct ?? row.discountPct,
        pricingMode: existing.pricingMode ?? row.pricingMode,
        // Prefer net price when one side already applied a line discount.
        price:
          existing.discount || row.discount || existing.discountPct || row.discountPct
            ? Math.min(Number(existing.price) || 0, Number(row.price) || 0) ||
              Number(existing.price) ||
              Number(row.price) ||
              0
            : (existing.price ?? row.price),
      };
      continue;
    }
    merged.push(row);
    indexByKey.set(key, merged.length - 1);
  }
  return merged.length ? merged : undefined;
}

/** Prefer notes snapshot; fill missing people/services from location_details backup. */
export function mergeBookingClientSnapshots(
  primary?: CalendarBookingClientSnapshot | null,
  fallback?: CalendarBookingClientSnapshot | null,
): CalendarBookingClientSnapshot | undefined {
  if (!primary && !fallback) return undefined;
  const people = mergePeople(primary?.people, fallback?.people);
  const services = mergeServices(primary?.services, fallback?.services, people);
  const projectDetails =
    primary?.projectDetails || fallback?.projectDetails
      ? {
          description:
            primary?.projectDetails?.description?.trim() ||
            fallback?.projectDetails?.description ||
            "",
          uploads:
            (primary?.projectDetails?.uploads?.length
              ? primary.projectDetails.uploads
              : fallback?.projectDetails?.uploads) ?? [],
        }
      : undefined;
  const teamMembers = primary?.teamMembers?.length
    ? primary.teamMembers
    : fallback?.teamMembers;
  if (!people?.length && !services?.length && !projectDetails && !teamMembers?.length) {
    return undefined;
  }
  return {
    ...(people?.length ? { people } : {}),
    ...(services?.length ? { services } : {}),
    ...(projectDetails ? { projectDetails } : {}),
    ...(teamMembers?.length ? { teamMembers } : {}),
  };
}

/** Slim snapshot for location_details — people/services only (no media blobs). */
export function slimClientSnapshotForLocationDetails(
  snapshot: CalendarBookingClientSnapshot,
): CalendarBookingClientSnapshot {
  return {
    people: snapshot.people,
    services: snapshot.services,
    teamMembers: snapshot.teamMembers,
    ...(snapshot.projectDetails?.description?.trim()
      ? {
          projectDetails: {
            description: snapshot.projectDetails.description,
            uploads: [],
          },
        }
      : {}),
  };
}
