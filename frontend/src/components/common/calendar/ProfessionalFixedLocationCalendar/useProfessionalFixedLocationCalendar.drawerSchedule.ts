import * as React from "react";
import type {
  CalendarBookingGuestItem,
  CalendarBookingLocation,
  CalendarResource,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  lineItemToOverride,
  recalculateGroupedServiceStartEndTimes,
  type BookingServiceEditDraft,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import {
  fmtMinToTime,
  minutesSinceMidnight,
  type Interval,
  type SelectedSlot,
} from "../calendar.utils";
import { clockHm } from "./useProfessionalFixedLocationCalendar.helpers";
import { useProfessionalFixedLocationCalendarDrawerScheduleBlocks } from "./useProfessionalFixedLocationCalendar.drawerSchedule.blocks";
import { useProfessionalFixedLocationCalendarDrawerScheduleSlots } from "./useProfessionalFixedLocationCalendar.drawerSchedule.slots";

export type UseProfessionalFixedLocationCalendarDrawerScheduleArgs = {
  selectedSlot: SelectedSlot | null;
  selectedClient: null | {
    name: string;
    email: string;
    mollureUserId?: string | null;
    clientKind?: "individual" | "company";
    isGuest?: boolean;
    isMollure?: boolean;
  };
  selectedServices: BookingServiceLineItem[];
  bookingGuests: CalendarBookingGuestItem[];
  grid: { stepMinutes: number };
  activeResource: { id: string } | undefined;
  resources: readonly CalendarResource[];
  getAvailabilityFor: (resourceId: string, iso: string) => Interval[];
  getBusyFor: (resourceId: string, iso: string) => Interval[];
  getLocationAvailability: (
    resourceId: string,
    iso: string,
    location: CalendarBookingLocation,
  ) => Interval[];
  slotLocation: CalendarBookingLocation;
  editingEventId: string | null;
  todayIso: string;
  serviceEditDraft: BookingServiceEditDraft;
  isViewingExisting: boolean;
  allowDrawerTimeSelection: boolean;
  setServiceOverridesDraft: React.Dispatch<
    React.SetStateAction<Record<string, Partial<BookingServiceLineItem>>>
  >;
  setSelectedServices: React.Dispatch<
    React.SetStateAction<BookingServiceLineItem[]>
  >;
  setBookingGuests: React.Dispatch<
    React.SetStateAction<CalendarBookingGuestItem[]>
  >;
  setSelectedSlot: React.Dispatch<React.SetStateAction<SelectedSlot | null>>;
  setSlotCalendarTouched: React.Dispatch<React.SetStateAction<boolean>>;
};

/** Drawer schedule blocks + slots + apply (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerSchedule(
  args: UseProfessionalFixedLocationCalendarDrawerScheduleArgs,
) {
  const {
    selectedSlot,
    selectedServices,
    bookingGuests,
    isViewingExisting,
    allowDrawerTimeSelection,
    setServiceOverridesDraft,
    setSelectedServices,
    setBookingGuests,
    setSelectedSlot,
    setSlotCalendarTouched,
  } = args;

  const blocks =
    useProfessionalFixedLocationCalendarDrawerScheduleBlocks(args);
  const slots = useProfessionalFixedLocationCalendarDrawerScheduleSlots({
    ...args,
    drawerBookingDurationMins: blocks.drawerBookingDurationMins,
  });

  const applyDrawerTimeSlot = React.useCallback(
    (startTime: string) => {
      if (!selectedSlot || isViewingExisting) return;
      const newStart = fmtMinToTime(minutesSinceMidnight(startTime));
      // Same clock — do not rewrite nested service times (would false-tag Edited).
      if (clockHm(selectedSlot.start) === clockHm(newStart)) return;
      const [nextSelectedServices, ...nextGuestServiceGroups] =
        recalculateGroupedServiceStartEndTimes(
          [selectedServices, ...bookingGuests.map((guest) => guest.services)],
          newStart,
        );
      const nextGuests = bookingGuests.map((guest, index) => ({
        ...guest,
        services: nextGuestServiceGroups[index] ?? [],
      }));
      const allServices = [
        ...nextSelectedServices,
        ...nextGuests.flatMap((guest) => guest.services),
      ];

      if (allServices.length > 0) {
        const overridePatch: Record<
          string,
          Partial<BookingServiceLineItem>
        > = {};
        for (const service of allServices) {
          overridePatch[service.id] = lineItemToOverride(service);
        }
        setServiceOverridesDraft((prev) => ({ ...prev, ...overridePatch }));
        setSelectedServices(nextSelectedServices);
        setBookingGuests(nextGuests);
      }

      const durationMins =
        allServices.reduce(
          (sum, service) => sum + (service.durationMins || 0),
          0,
        ) || blocks.drawerBookingDurationMins;
      const start = minutesSinceMidnight(newStart);
      const end = start + durationMins;
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              start: newStart,
              end: fmtMinToTime(end),
            }
          : prev,
      );
      setSlotCalendarTouched(true);
    },
    [
      bookingGuests,
      blocks.drawerBookingDurationMins,
      isViewingExisting,
      selectedServices,
      selectedSlot,
    ],
  );

  React.useEffect(() => {
    if (!allowDrawerTimeSelection || isViewingExisting || !selectedSlot) return;
    const current = selectedSlot.start?.slice(0, 5);
    if (current && /^\d{2}:\d{2}$/.test(current)) return;
    const fallback = slots.drawerSelectableTimes[0];
    if (fallback) applyDrawerTimeSlot(fallback);
  }, [
    allowDrawerTimeSelection,
    applyDrawerTimeSlot,
    slots.drawerSelectableTimes,
    isViewingExisting,
    selectedSlot,
  ]);

  return {
    ...blocks,
    ...slots,
    applyDrawerTimeSlot,
  };
}
