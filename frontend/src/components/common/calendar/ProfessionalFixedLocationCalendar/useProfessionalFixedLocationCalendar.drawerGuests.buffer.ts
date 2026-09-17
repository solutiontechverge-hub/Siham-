import * as React from "react";
import type { CalendarBookingGuestItem } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { sortCalendarGuestsByCanonicalOrder } from "../../../../data/bookingChronologicalBlocks";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import {
  formatDurationMinsLabel,
  getLatestTimedEnd,
  parseDurationMinsLabel,
  positiveMinutesBetweenTimes,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import {
  fmtMinToTime,
  minutesSinceMidnight,
} from "../calendar.utils";
import type { UseProfessionalFixedLocationCalendarDrawerGuestsArgs } from "./useProfessionalFixedLocationCalendar.drawerGuests";

type BookingGuest = CalendarBookingGuestItem;

/** Planning/buffer participant handlers (ponytail: subdomain of drawerGuests). */
export function useProfessionalFixedLocationCalendarDrawerGuestsBuffer(
  args: UseProfessionalFixedLocationCalendarDrawerGuestsArgs,
) {
  const {
    bookingGuests,
    setBookingGuests,
    selectedServices,
    selectedSlot,
    setSelectedSlot,
    bufferDraft,
    setBufferDraft,
    editingBufferId,
    setEditingBufferId,
    resources,
    focusBookingDrawerSection,
    setSlotBookingScreen,
    setSlotSaveAttempted,
  } = args;

  const addDlParticipant = React.useCallback(
    (kind: "planning" | "buffer") => {
      const timedEnds: Array<{ endTime?: string }> = [
        ...selectedServices.map((service) => ({ endTime: service.endTime })),
        ...bookingGuests.flatMap((guest) => [
          ...guest.services.map((service) => ({ endTime: service.endTime })),
          {
            endTime: guest.planningEndTime || guest.bufferEndTime,
          },
        ]),
      ];
      const defaultStart =
        getLatestTimedEnd(timedEnds, selectedSlot?.start) ||
        selectedSlot?.start?.slice(0, 5) ||
        "";

      if (kind === "buffer") {
        const defaultMemberId =
          selectedSlot?.resourceId || resources[0]?.id || "";
        setEditingBufferId(null);
        setBufferDraft({
          title: "",
          teamMemberIds: defaultMemberId ? [defaultMemberId] : [],
          durationMins: "",
          startTime: defaultStart,
          endTime: "",
        });
        setSlotBookingScreen("add-buffer");
        return;
      }
      const id = `planning-${Date.now()}`;
      setBookingGuests((prev) =>
        sortCalendarGuestsByCanonicalOrder([
          ...prev,
          {
            id,
            name: "Planning",
            services: [],
            products: [],
            participantType: "planning",
            planningActivity: "",
            planningDuration: "",
            planningStartTime: defaultStart || undefined,
            planningEndTime: undefined,
          },
        ]),
      );
      focusBookingDrawerSection(id);
    },
    [
      bookingGuests,
      resources,
      focusBookingDrawerSection,
      selectedServices,
      selectedSlot?.end,
      selectedSlot?.resourceId,
      selectedSlot?.start,
    ],
  );

  const applyBufferDraft = React.useCallback(() => {
    const title = bufferDraft.title.trim() || "Buffer";
    const startTime = bufferDraft.startTime.trim();
    const endTime = bufferDraft.endTime.trim();
    const durationMins =
      positiveMinutesBetweenTimes(startTime, endTime) ||
      parseDurationMinsLabel(bufferDraft.durationMins);
    const memberIds = bufferDraft.teamMemberIds.filter(Boolean);
    if (!memberIds.length) return;
    const makeBufferGuest = (
      id: string,
      memberId: string,
    ): BookingGuest => ({
      id,
      name: title,
      services: [] as BookingServiceLineItem[],
      products: [] as BookingProductLineItem[],
      participantType: "buffer",
      planningActivity: title,
      planningDuration: durationMins
        ? formatDurationMinsLabel(durationMins)
        : undefined,
      planningStartTime: undefined,
      planningEndTime: undefined,
      bufferTeamMemberId: memberId,
      bufferStartTime: startTime || undefined,
      bufferEndTime: endTime || undefined,
    });
    const nextGuests = (() => {
      if (!editingBufferId) {
        const stamp = Date.now();
        return [
          ...bookingGuests,
          ...memberIds.map((memberId) =>
            makeBufferGuest(`buffer-${stamp}-${memberId}`, memberId),
          ),
        ];
      }
      const insertAt = bookingGuests.findIndex(
        (item) => item.id === editingBufferId,
      );
      const stamp = Date.now();
      const next = memberIds.map((memberId, index) =>
        makeBufferGuest(
          index === 0 && insertAt >= 0
            ? editingBufferId
            : `buffer-${stamp}-${memberId}`,
          memberId,
        ),
      );
      if (insertAt < 0) return [...bookingGuests, ...next];
      const rest = bookingGuests.filter((item) => item.id !== editingBufferId);
      return [...rest.slice(0, insertAt), ...next, ...rest.slice(insertAt)];
    })();
    setBookingGuests(sortCalendarGuestsByCanonicalOrder(nextGuests));
    const existingIds = new Set(bookingGuests.map((guest) => guest.id));
    const focused =
      nextGuests.find(
        (guest) =>
          guest.participantType === "buffer" &&
          (!existingIds.has(guest.id) || guest.id === editingBufferId),
      ) ?? nextGuests.find((guest) => guest.participantType === "buffer");
    if (focused?.id) focusBookingDrawerSection(focused.id);
    setSelectedSlot((prev) => {
      if (!prev) return prev;
      let startMin = minutesSinceMidnight(prev.start);
      let endMin = minutesSinceMidnight(prev.end);
      const bump = (start?: string, finish?: string) => {
        if (start?.trim()) {
          startMin = Math.min(startMin, minutesSinceMidnight(start));
        }
        if (finish?.trim()) {
          endMin = Math.max(endMin, minutesSinceMidnight(finish));
        }
      };
      for (const service of selectedServices) {
        bump(service.startTime, service.endTime);
      }
      for (const guest of nextGuests) {
        for (const service of guest.services) {
          bump(service.startTime, service.endTime);
        }
        bump(guest.planningStartTime, guest.planningEndTime);
        bump(guest.bufferStartTime, guest.bufferEndTime);
      }
      return {
        ...prev,
        start: fmtMinToTime(startMin),
        end: fmtMinToTime(endMin),
      };
    });
    setEditingBufferId(null);
    setSlotBookingScreen("new-booking");
  }, [
    bookingGuests,
    bufferDraft,
    editingBufferId,
    selectedServices,
    focusBookingDrawerSection,
  ]);

  const beginEditBuffer = React.useCallback(
    (guest: {
      id: string;
      name: string;
      planningDuration?: string;
      bufferTeamMemberId?: string;
      bufferStartTime?: string;
      bufferEndTime?: string;
    }) => {
      const durationMins =
        parseDurationMinsLabel(guest.planningDuration) ??
        (guest.bufferStartTime && guest.bufferEndTime
          ? minutesSinceMidnight(guest.bufferEndTime) -
            minutesSinceMidnight(guest.bufferStartTime)
          : null);
      setBufferDraft({
        title: guest.name.trim() === "Buffer" ? "" : guest.name.trim(),
        teamMemberIds: guest.bufferTeamMemberId
          ? [guest.bufferTeamMemberId]
          : [],
        durationMins:
          durationMins && durationMins > 0 ? String(durationMins) : "",
        startTime: guest.bufferStartTime?.trim() || "",
        endTime: guest.bufferEndTime?.trim() || "",
      });
      setEditingBufferId(guest.id);
      setSlotSaveAttempted(false);
      setSlotBookingScreen("add-buffer");
    },
    [],
  );

  return {
    addDlParticipant,
    applyBufferDraft,
    beginEditBuffer,
  };
}
