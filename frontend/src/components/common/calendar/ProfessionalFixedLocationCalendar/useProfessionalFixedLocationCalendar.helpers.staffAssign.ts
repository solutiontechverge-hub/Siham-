import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";

type Interval = { startMin: number; endMin: number };

// Local to keep this helper runnable without calendar.utils → theme/MUI.
function minutesSinceMidnight(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

const FL_MAX_DISTINCT = 3;

export type PickMostAvailableTeamMemberId = (
  dateIso: string,
  startMin: number,
  durationMins: number,
  extraBusyByMember?: ReadonlyMap<string, readonly Interval[]>,
  options?: {
    /** Soft: try these first when free (DL-style sticky). */
    preferMemberIds?: readonly string[];
    /** Soft: skip these when other free staff exist (FL spread). */
    avoidMemberIds?: readonly string[];
    /** Hard: only consider this pool (FL max-3 cap). */
    onlyMemberIds?: readonly string[];
  },
) => string;

function seedDraftBusy(
  services: readonly BookingServiceLineItem[],
  skipIds: ReadonlySet<string>,
  virtualBusy: Map<string, Interval[]>,
  usedIds: Set<string>,
  slotStart: string | undefined,
): void {
  for (const service of services) {
    if (skipIds.has(service.id)) continue;
    const memberId = String(service.staffResourceId || "").trim();
    if (!memberId) continue;
    const duration = Math.max(1, service.durationMins || 0);
    const startMin = minutesSinceMidnight(
      service.startTime ?? slotStart ?? "00:00",
    );
    if (!usedIds.has(memberId) && usedIds.size >= FL_MAX_DISTINCT) continue;
    const busy = virtualBusy.get(memberId) ?? [];
    busy.push({ startMin, endMin: startMin + duration });
    virtualBusy.set(memberId, busy);
    usedIds.add(memberId);
  }
}

/** Mutates `pickedServices` in place — same as prior drawer apply behavior. */
export function assignStaffToPickedServices(input: {
  pickedServices: BookingServiceLineItem[];
  currentServices: readonly BookingServiceLineItem[];
  /** Other drawer lines (client + guests) whose windows occupy staff. */
  draftSiblingServices?: readonly BookingServiceLineItem[];
  dateIso: string;
  slotStart: string | undefined;
  slotLocation: CalendarBookingLocation;
  resourceCount: number;
  pickMostAvailableTeamMemberId: PickMostAvailableTeamMemberId;
}): void {
  const {
    pickedServices,
    currentServices,
    draftSiblingServices = [],
    dateIso,
    slotStart,
    slotLocation,
    resourceCount,
    pickMostAvailableTeamMemberId,
  } = input;
  if (!dateIso || resourceCount <= 0) return;

  const assignOneForAll = slotLocation === "DL";
  const virtualBusy = new Map<string, Interval[]>();

  if (assignOneForAll) {
    const existingShared =
      currentServices.find((service) => service.staffResourceId)
        ?.staffResourceId ||
      pickedServices.find((service) => service.staffResourceId)
        ?.staffResourceId ||
      draftSiblingServices.find((service) => service.staffResourceId)
        ?.staffResourceId;
    const totalDuration = Math.max(
      1,
      pickedServices.reduce(
        (sum, service) => sum + (service.durationMins || 0),
        0,
      ),
    );
    const startMin = minutesSinceMidnight(
      pickedServices.find((service) => service.startTime)?.startTime ??
        slotStart ??
        "00:00",
    );
    const sharedId =
      existingShared ||
      pickMostAvailableTeamMemberId(dateIso, startMin, totalDuration);
    for (let i = 0; i < pickedServices.length; i += 1) {
      if (!pickedServices[i].staffResourceId) {
        pickedServices[i] = {
          ...pickedServices[i],
          staffResourceId: sharedId || undefined,
        };
      }
    }
    return;
  }

  // Fixed Location: per-service free-at-slot + lowest occupancy; spread across
  // free members (do not sticky-reuse); draft siblings count as busy; max 3 distinct.
  const usedIds = new Set<string>();
  const pickedIds = new Set(pickedServices.map((service) => service.id));
  seedDraftBusy(currentServices, pickedIds, virtualBusy, usedIds, slotStart);
  seedDraftBusy(draftSiblingServices, pickedIds, virtualBusy, usedIds, slotStart);

  for (let i = 0; i < pickedServices.length; i += 1) {
    const service = pickedServices[i];
    const duration = Math.max(1, service.durationMins || 0);
    const startMin = minutesSinceMidnight(
      service.startTime ?? slotStart ?? "00:00",
    );
    if (service.staffResourceId) {
      const memberId = service.staffResourceId;
      const wouldExceedCap =
        !usedIds.has(memberId) && usedIds.size >= FL_MAX_DISTINCT;
      if (!wouldExceedCap) {
        const busy = virtualBusy.get(memberId) ?? [];
        busy.push({ startMin, endMin: startMin + duration });
        virtualBusy.set(memberId, busy);
        usedIds.add(memberId);
        continue;
      }
    }
    const atCap = usedIds.size >= FL_MAX_DISTINCT;
    const usedList = [...usedIds];
    const memberId = pickMostAvailableTeamMemberId(
      dateIso,
      startMin,
      duration,
      virtualBusy,
      {
        // Spread: avoid already-used while other free staff exist.
        avoidMemberIds: atCap ? undefined : usedList,
        onlyMemberIds: atCap ? usedList : undefined,
      },
    );
    if (memberId) {
      const busy = virtualBusy.get(memberId) ?? [];
      busy.push({ startMin, endMin: startMin + duration });
      virtualBusy.set(memberId, busy);
      usedIds.add(memberId);
    }
    pickedServices[i] = {
      ...service,
      staffResourceId: memberId || undefined,
    };
  }
}
