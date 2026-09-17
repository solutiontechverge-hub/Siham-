import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";

export type UseProfessionalFixedLocationCalendarNoShowParticipantsArgs = {
  viewingBookingEvent: CalendarEvent | null;
};

/** Viewing-booking status flags + no-show participant list (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarNoShowParticipants({
  viewingBookingEvent,
}: UseProfessionalFixedLocationCalendarNoShowParticipantsArgs) {
  const isCompletedBooking = viewingBookingEvent?.status === "Completed";
  const isCancelledOrInvalidBooking =
    viewingBookingEvent?.status === "Cancelled" ||
    viewingBookingEvent?.status === "Invalid";

  const noShowParticipants = React.useMemo(() => {
    if (!viewingBookingEvent) return [];
    const list: { id: string; name: string }[] = [];
    const clientName = viewingBookingEvent.showClientName?.trim();
    if (clientName) list.push({ id: "client", name: clientName });

    const people = viewingBookingEvent.details?.clientSnapshot?.people ?? [];
    let modelOrdinal = 0;
    for (const person of people) {
      if (person.isRequester) continue;
      if (
        person.participantType === "planning" ||
        person.participantType === "notes" ||
        person.name?.trim() === "Planning" ||
        person.name?.trim().toLowerCase() === "notes"
      )
        continue;
      const trimmed = person.name?.trim() ?? "";
      let name: string;
      if (person.participantType === "model") {
        modelOrdinal += 1;
        name =
          trimmed && trimmed.toLowerCase() !== "model"
            ? trimmed
            : `Model ${modelOrdinal}`;
      } else {
        name = trimmed && trimmed.toLowerCase() !== "guest" ? trimmed : "Guest";
      }
      list.push({ id: person.id, name });
    }
    if (list.length === 0) list.push({ id: "client", name: "Client" });
    return list;
  }, [viewingBookingEvent]);

  return {
    isCompletedBooking,
    isCancelledOrInvalidBooking,
    noShowParticipants,
  };
}
