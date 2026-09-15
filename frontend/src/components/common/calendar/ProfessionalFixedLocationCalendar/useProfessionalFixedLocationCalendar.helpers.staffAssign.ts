import type { Interval } from "../calendar.utils";
import { minutesSinceMidnight } from "../calendar.utils";
import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";

export type PickMostAvailableTeamMemberId = (
  dateIso: string,
  startMin: number,
  durationMins: number,
  extraBusyByMember?: ReadonlyMap<string, readonly Interval[]>,
  options?: {
    preferMemberIds?: readonly string[];
    onlyMemberIds?: readonly string[];
  },
) => string;

/** Mutates `pickedServices` in place — same as prior drawer apply behavior. */
export function assignStaffToPickedServices(input: {
  pickedServices: BookingServiceLineItem[];
  currentServices: readonly BookingServiceLineItem[];
  dateIso: string;
  slotStart: string | undefined;
  slotLocation: CalendarBookingLocation;
  resourceCount: number;
  pickMostAvailableTeamMemberId: PickMostAvailableTeamMemberId;
}): void {
  const {
    pickedServices,
    currentServices,
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

  // Fixed Location: per-service, prefer free then occupancy; max 3 distinct.
  const usedIds = new Set<string>();
  for (let i = 0; i < pickedServices.length; i += 1) {
    const service = pickedServices[i];
    const duration = Math.max(1, service.durationMins || 0);
    const startMin = minutesSinceMidnight(
      service.startTime ?? slotStart ?? "00:00",
    );
    if (service.staffResourceId) {
      const memberId = service.staffResourceId;
      const wouldExceedCap = !usedIds.has(memberId) && usedIds.size >= 3;
      if (!wouldExceedCap) {
        const busy = virtualBusy.get(memberId) ?? [];
        busy.push({ startMin, endMin: startMin + duration });
        virtualBusy.set(memberId, busy);
        usedIds.add(memberId);
        continue;
      }
    }
    const atCap = usedIds.size >= 3;
    const preferIds = [...usedIds];
    const memberId = pickMostAvailableTeamMemberId(
      dateIso,
      startMin,
      duration,
      virtualBusy,
      {
        preferMemberIds: preferIds,
        onlyMemberIds: atCap ? preferIds : undefined,
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
