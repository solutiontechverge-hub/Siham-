import * as React from "react";
import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarSlotAddAction } from "../CalendarSlotAddMenu";
import {
  createEmptyBlockTimeDraft,
  fmtMinToTime,
  subtractIntervals,
  type BlockTimeDraft,
  type SelectedSlot,
} from "../calendar.utils";

type ShowSnackbar = (input: {
  severity: "error" | "success" | "warning" | "info";
  message: string;
}) => void;

type AvailabilityInterval = { startMin: number; endMin: number };

export type UseProfessionalFixedLocationCalendarSlotAddArgs = {
  todayIso: string;
  stepMinutes: number;
  supportedLocations: readonly CalendarBookingLocation[];
  showSnackbar: ShowSnackbar;
  getAvailabilityFor: (
    resourceId: string,
    iso: string,
  ) => readonly AvailabilityInterval[];
  getBusyFor: (
    resourceId: string,
    iso: string,
  ) => readonly AvailabilityInterval[];
  openBookingDrawer: (
    payload: SelectedSlot,
    options?: {
      allowTimeSelection?: boolean;
      openCalendar?: boolean;
      calendarTouched?: boolean;
    },
  ) => void;
  setBlockDraft: React.Dispatch<React.SetStateAction<BlockTimeDraft>>;
  setBlockTimeOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

/** Empty-slot click + Booking/Block continue menu (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarSlotAdd({
  todayIso,
  stepMinutes,
  supportedLocations,
  showSnackbar,
  getAvailabilityFor,
  getBusyFor,
  openBookingDrawer,
  setBlockDraft,
  setBlockTimeOpen,
}: UseProfessionalFixedLocationCalendarSlotAddArgs) {
  const [slotAddAnchor, setSlotAddAnchor] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const [pendingSlotPayload, setPendingSlotPayload] =
    React.useState<SelectedSlot | null>(null);

  const onEmptyClick = React.useCallback(
    (
      resourceId: string,
      iso: string,
      minutes: number,
      anchor: { top: number; left: number },
    ) => {
      if (iso < todayIso) {
        showSnackbar({
          severity: "info",
          message: "Cannot create a new booking on a past date.",
        });
        return;
      }
      const availability = getAvailabilityFor(resourceId, iso);
      if (!availability.length) {
        showSnackbar({
          severity: "info",
          message: "No schedule availability for this team member on this day.",
        });
        return;
      }
      const busy = getBusyFor(resourceId, iso);
      const free = subtractIntervals(availability, busy);
      const segment = free.find(
        (f) => minutes >= f.startMin && minutes < f.endMin,
      );
      if (!segment) {
        showSnackbar({
          severity: "warning",
          message: "This time is not available.",
        });
        return;
      }

      const start = Math.max(
        segment.startMin,
        Math.min(
          minutes,
          Math.max(segment.startMin, segment.endMin - stepMinutes),
        ),
      );
      const end = Math.min(segment.endMin, start + stepMinutes);

      const payload: SelectedSlot = {
        resourceId,
        date: iso,
        start: fmtMinToTime(start),
        end: fmtMinToTime(end),
        freeStart: fmtMinToTime(segment.startMin),
        freeEnd: fmtMinToTime(segment.endMin),
      };
      // Timeline slot click: show Booking / Blocked time on-screen menu.
      setPendingSlotPayload(payload);
      setSlotAddAnchor(anchor);
    },
    [
      getAvailabilityFor,
      getBusyFor,
      showSnackbar,
      stepMinutes,
      todayIso,
    ],
  );

  const handleSlotAddContinue = React.useCallback(
    (action: CalendarSlotAddAction) => {
      const payload = pendingSlotPayload;
      setSlotAddAnchor(null);
      setPendingSlotPayload(null);
      if (!payload) return;

      if (action === "booking") {
        openBookingDrawer(payload, {
          allowTimeSelection: true,
          openCalendar: false,
          calendarTouched: true,
        });
        return;
      }

      const draft = createEmptyBlockTimeDraft(
        [payload.resourceId],
        supportedLocations,
        payload.date,
      );
      setBlockDraft({
        ...draft,
        startTime: payload.start.slice(0, 5),
        endTime: payload.end.slice(0, 5),
      });
      setBlockTimeOpen(true);
    },
    [
      openBookingDrawer,
      pendingSlotPayload,
      setBlockDraft,
      setBlockTimeOpen,
      supportedLocations,
    ],
  );

  return {
    handleSlotAddContinue,
    onEmptyClick,
    pendingSlotPayload,
    setPendingSlotPayload,
    setSlotAddAnchor,
    slotAddAnchor,
  };
}
