import * as React from "react";
import {
  getBookingTimedSpanMins,
  sortCalendarGuestsByCanonicalOrder,
} from "../../../../data/bookingChronologicalBlocks";
import {
  parseDurationMinsLabel,
  positiveMinutesBetweenTimes,
  sortServicesByStartTime,
} from "../../../../data/bookingServiceEdit.data";
import { participantOrdinals } from "../../client-booking/buildBookingSummarySections";
import type { UseProfessionalFixedLocationCalendarDrawerScheduleArgs } from "./useProfessionalFixedLocationCalendar.drawerSchedule";

/** Planning/guest ordinals + ordered blocks (ponytail: subdomain of drawerSchedule). */
export function useProfessionalFixedLocationCalendarDrawerScheduleBlocks(
  args: UseProfessionalFixedLocationCalendarDrawerScheduleArgs,
) {
  const {
    selectedSlot,
    selectedClient,
    selectedServices,
    bookingGuests,
    grid,
  } = args;

  const drawerBookingDurationMins = React.useMemo(() => {
    const span = getBookingTimedSpanMins({
      bookingStart: selectedSlot?.start,
      requesterPerson: {
        id: "client",
        name: selectedClient?.name ?? "Client",
        isRequester: true,
      },
      mainServices: selectedServices,
      guests: bookingGuests.map((guest) => ({
        person: {
          id: guest.id,
          name: guest.name,
          participantType: guest.participantType,
          planningActivity: guest.planningActivity,
          planningDuration: guest.planningDuration,
          planningStartTime: guest.planningStartTime,
          planningEndTime: guest.planningEndTime,
          bufferStartTime: guest.bufferStartTime,
          bufferEndTime: guest.bufferEndTime,
          bufferTeamMemberId: guest.bufferTeamMemberId,
        },
        services: guest.services,
      })),
    });
    if (span > 0) return span;
    const fromServices = selectedServices.reduce(
      (sum, service) => sum + (service.durationMins || 0),
      0,
    );
    const fromGuests = bookingGuests.reduce((sum, guest) => {
      const serviceMins = guest.services.reduce(
        (inner, service) => inner + (service.durationMins || 0),
        0,
      );
      const planningMins =
        parseDurationMinsLabel(guest.planningDuration) ??
        (guest.planningStartTime && guest.planningEndTime
          ? positiveMinutesBetweenTimes(
              guest.planningStartTime,
              guest.planningEndTime,
            )
          : guest.bufferStartTime && guest.bufferEndTime
            ? positiveMinutesBetweenTimes(
                guest.bufferStartTime,
                guest.bufferEndTime,
              )
            : 0);
      return sum + serviceMins + Math.max(0, planningMins);
    }, 0);
    const total = fromServices + fromGuests;
    return total > 0 ? total : grid.stepMinutes;
  }, [
    bookingGuests,
    grid.stepMinutes,
    selectedClient?.name,
    selectedServices,
    selectedSlot?.start,
  ]);

  const primaryMainClientServices = React.useMemo(
    () => sortServicesByStartTime(selectedServices),
    [selectedServices],
  );

  const chronologicalDrawerGuests = React.useMemo(
    () => sortCalendarGuestsByCanonicalOrder(bookingGuests),
    [bookingGuests],
  );

  const isDrawerPlanningGuest = React.useCallback(
    (guest: (typeof bookingGuests)[number]) =>
      guest.participantType === "planning" || guest.name === "Planning",
    [],
  );

  /** One card per guest/model/planning/buffer. Buffers always render last. */
  const drawerOrderedBlocks = React.useMemo(
    () =>
      chronologicalDrawerGuests.map((guest, index) => {
        const services = sortServicesByStartTime(guest.services).map(
          (service) => ({
            ...service,
            guestId: service.guestId ?? guest.id,
          }),
        );
        const participantType =
          guest.participantType === "planning" || guest.name === "Planning"
            ? ("planning" as const)
            : guest.participantType === "model"
              ? ("model" as const)
              : guest.participantType === "buffer"
                ? ("buffer" as const)
                : ("guest" as const);
        return {
          key: guest.id,
          blockIndex: index,
          participantId: guest.id,
          participantType,
          isMainClient: false,
          guestId: guest.id,
          services,
          startTime:
            participantType === "planning"
              ? guest.planningStartTime?.trim() ?? ""
              : participantType === "buffer"
                ? guest.bufferStartTime?.trim() ?? ""
                : services[0]?.startTime?.trim() ?? "",
          endTime:
            participantType === "planning"
              ? guest.planningEndTime?.trim() ?? ""
              : participantType === "buffer"
                ? guest.bufferEndTime?.trim() ?? ""
                : services[services.length - 1]?.endTime?.trim() ?? "",
        };
      }),
    [chronologicalDrawerGuests],
  );

  const drawerParticipantOrdinals = React.useMemo(
    () =>
      participantOrdinals(
        drawerOrderedBlocks.map((block) => ({
          participantType: block.participantType,
          participantId: block.participantId,
          key: block.key,
        })),
      ),
    [drawerOrderedBlocks],
  );

  const drawerPlanningGuests = React.useMemo(
    () => bookingGuests.filter(isDrawerPlanningGuest),
    [bookingGuests, isDrawerPlanningGuest],
  );

  const firstDrawerPlanningId = React.useMemo(
    () => chronologicalDrawerGuests.find(isDrawerPlanningGuest)?.id ?? null,
    [chronologicalDrawerGuests, isDrawerPlanningGuest],
  );

  return {
    drawerBookingDurationMins,
    primaryMainClientServices,
    chronologicalDrawerGuests,
    isDrawerPlanningGuest,
    drawerOrderedBlocks,
    drawerParticipantOrdinals,
    drawerPlanningGuests,
    firstDrawerPlanningId,
  };
}
