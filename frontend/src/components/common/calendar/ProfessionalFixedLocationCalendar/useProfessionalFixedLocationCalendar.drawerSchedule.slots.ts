import * as React from "react";
import type {
  BookingEditServiceAvailabilitySlot,
  BookingEditServiceSlotMember,
} from "../BookingEditServiceScreen";
import {
  fmtMinToTime,
  intervalsOverlap,
  minutesSinceMidnight,
} from "../calendar.utils";
import type { UseProfessionalFixedLocationCalendarDrawerScheduleArgs } from "./useProfessionalFixedLocationCalendar.drawerSchedule";

/** Availability + edit-service slot memos (ponytail: subdomain of drawerSchedule). */
export function useProfessionalFixedLocationCalendarDrawerScheduleSlots(
  args: UseProfessionalFixedLocationCalendarDrawerScheduleArgs & {
    drawerBookingDurationMins: number;
  },
) {
  const {
    selectedSlot,
    grid,
    activeResource,
    resources,
    getAvailabilityFor,
    getBusyFor,
    getLocationAvailability,
    slotLocation,
    editingEventId,
    todayIso,
    serviceEditDraft,
    drawerBookingDurationMins,
  } = args;

  const hasScheduleAvailabilityOnDate = React.useCallback(
    (isoDate: string, resourceId?: string) => {
      const id = resourceId || activeResource?.id || resources[0]?.id;
      if (!id) return false;
      return getAvailabilityFor(id, isoDate).length > 0;
    },
    [activeResource?.id, resources, getAvailabilityFor],
  );

  const drawerAvailableTimeSlots = React.useMemo(() => {
    if (!selectedSlot?.resourceId || !selectedSlot.date) {
      return [] as Array<{ time: string; disabled: boolean }>;
    }

    const date = selectedSlot.date;
    const hourWindows = slotLocation
      ? getLocationAvailability(selectedSlot.resourceId, date, slotLocation)
      : [];
    const resolvedWindows = hourWindows.length
      ? hourWindows
      : getAvailabilityFor(selectedSlot.resourceId, date);

    // Professional has not set hours/availability for this date.
    if (!resolvedWindows.length) {
      return [] as Array<{ time: string; disabled: boolean }>;
    }

    const busy = getBusyFor(selectedSlot.resourceId, date).filter(
      (interval) => {
        if (!editingEventId || !selectedSlot.start || !selectedSlot.end)
          return true;
        return !(
          interval.startMin === minutesSinceMidnight(selectedSlot.start) &&
          interval.endMin === minutesSinceMidnight(selectedSlot.end)
        );
      },
    );

    const isPastDate = date < todayIso;

    const slots: Array<{ time: string; disabled: boolean }> = [];
    for (const hours of resolvedWindows) {
      for (
        let min = hours.startMin;
        min < hours.endMin;
        min += grid.stepMinutes
      ) {
        const slotEnd = min + drawerBookingDurationMins;
        const conflicts = busy.some((interval) =>
          intervalsOverlap({ startMin: min, endMin: slotEnd }, interval),
        );
        if (conflicts) continue;
        // Add → Booking can pick any open slot today, including earlier times.
        slots.push({ time: fmtMinToTime(min), disabled: isPastDate });
      }
    }
    return slots;
  }, [
    drawerBookingDurationMins,
    editingEventId,
    getAvailabilityFor,
    getBusyFor,
    getLocationAvailability,
    grid.stepMinutes,
    selectedSlot?.date,
    selectedSlot?.end,
    selectedSlot?.resourceId,
    selectedSlot?.start,
    slotLocation,
    todayIso,
  ]);

  const drawerSelectableTimes = React.useMemo(
    () =>
      drawerAvailableTimeSlots
        .filter((slot) => !slot.disabled)
        .map((slot) => slot.time),
    [drawerAvailableTimeSlots],
  );

  /**
   * Edit Service: one row per time slot with avatars of members free at that time.
   */
  const editServiceAvailabilitySlots =
    React.useMemo((): BookingEditServiceAvailabilitySlot[] => {
      if (!selectedSlot?.date) return [];

      const date = selectedSlot.date;
      if (date < todayIso) return [];

      const durationMins =
        Number.parseInt(serviceEditDraft.durationMins, 10) ||
        drawerBookingDurationMins ||
        grid.stepMinutes;

      const excludeBusyInterval =
        editingEventId && selectedSlot.start && selectedSlot.end
          ? {
              startMin: minutesSinceMidnight(selectedSlot.start),
              endMin: minutesSinceMidnight(selectedSlot.end),
            }
          : null;

      type SlotAgg = {
        availableMembers: BookingEditServiceSlotMember[];
      };
      const byTime = new Map<string, SlotAgg>();

      for (const resource of resources) {
        const locationWindows = slotLocation
          ? getLocationAvailability(resource.id, date, slotLocation)
          : [];
        const hourWindows = locationWindows.length
          ? locationWindows
          : getAvailabilityFor(resource.id, date);
        if (!hourWindows.length) continue;

        const busy = getBusyFor(resource.id, date).filter((interval) => {
          if (!excludeBusyInterval) return true;
          return !(
            interval.startMin === excludeBusyInterval.startMin &&
            interval.endMin === excludeBusyInterval.endMin
          );
        });

        const member: BookingEditServiceSlotMember = {
          id: resource.id,
          name: resource.name,
          avatarText: resource.avatarText,
          photoSrc: resource.photoSrc,
        };

        for (const hours of hourWindows) {
          for (
            let min = hours.startMin;
            min < hours.endMin;
            min += grid.stepMinutes
          ) {
            const time = fmtMinToTime(min);
            let agg = byTime.get(time);
            if (!agg) {
              agg = { availableMembers: [] };
              byTime.set(time, agg);
            }

            const slotEnd = min + durationMins;
            const conflicts = busy.some((interval) =>
              intervalsOverlap({ startMin: min, endMin: slotEnd }, interval),
            );
            if (!conflicts) {
              agg.availableMembers.push(member);
            }
          }
        }
      }

      return [...byTime.entries()]
        .sort(([a], [b]) => minutesSinceMidnight(a) - minutesSinceMidnight(b))
        .map(([time, agg]) => {
          const available = agg.availableMembers.length > 0;
          return {
            time,
            status: available ? ("available" as const) : ("occupied" as const),
            availableMembers: available ? agg.availableMembers : [],
          };
        });
    }, [
      resources,
      drawerBookingDurationMins,
      editingEventId,
      getAvailabilityFor,
      getBusyFor,
      getLocationAvailability,
      grid.stepMinutes,
      selectedSlot?.date,
      selectedSlot?.end,
      selectedSlot?.start,
      serviceEditDraft.durationMins,
      slotLocation,
      todayIso,
    ]);

  return {
    hasScheduleAvailabilityOnDate,
    drawerAvailableTimeSlots,
    drawerSelectableTimes,
    editServiceAvailabilitySlots,
  };
}
