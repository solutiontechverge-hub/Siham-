import type {
  CalendarEvent,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

function knownTeamId(
  value: string | null | undefined,
  knownIds: ReadonlySet<string>,
): string | null {
  if (!value) return null;
  const id = String(value);
  return knownIds.has(id) ? id : null;
}

export function eventHasKnownTeamAssignment(
  event: Pick<CalendarEvent, "resourceId" | "details">,
  knownTeamIds: ReadonlySet<string>,
): boolean {
  if (event.resourceId && knownTeamIds.has(String(event.resourceId))) {
    return true;
  }

  if (
    event.details?.services?.some(
      (service) =>
        service.teamMemberId &&
        knownTeamIds.has(String(service.teamMemberId)),
    )
  ) {
    return true;
  }

  const guests = event.details?.guests ?? [];
  return guests.some(
    (guest) =>
      (guest.bufferTeamMemberId &&
        knownTeamIds.has(String(guest.bufferTeamMemberId))) ||
      (guest.services ?? []).some(
        (service) =>
          service.teamMemberId &&
          knownTeamIds.has(String(service.teamMemberId)),
      ),
  );
}

export function eventBelongsToTeamMember(
  event: Pick<CalendarEvent, "resourceId" | "details">,
  teamMemberId: string,
): boolean {
  const focusedId = String(teamMemberId);
  if (String(event.resourceId) === focusedId) return true;

  const services = event.details?.services ?? [];
  if (services.some((service) => String(service.teamMemberId ?? "") === focusedId)) {
    return true;
  }

  const guests = event.details?.guests ?? [];
  return guests.some(
    (guest) =>
      String(guest.bufferTeamMemberId ?? "") === focusedId ||
      (guest.services ?? []).some(
        (service) => String(service.teamMemberId ?? "") === focusedId,
      ),
  );
}

export function resolveEventTeamMemberId(
  event: Pick<CalendarEvent, "resourceId" | "details">,
  resources: readonly CalendarResource[],
): string {
  const knownIds = new Set(resources.map((resource) => String(resource.id)));
  const fromResource = knownTeamId(event.resourceId, knownIds);
  if (fromResource) return fromResource;

  for (const service of event.details?.services ?? []) {
    const fromService = knownTeamId(service.teamMemberId, knownIds);
    if (fromService) return fromService;
  }

  for (const guest of event.details?.guests ?? []) {
    const fromBuffer = knownTeamId(guest.bufferTeamMemberId, knownIds);
    if (fromBuffer) return fromBuffer;
    for (const service of guest.services ?? []) {
      const fromGuestService = knownTeamId(service.teamMemberId, knownIds);
      if (fromGuestService) return fromGuestService;
    }
  }

  return String(resources[0]?.id ?? "");
}

export function countTeamMemberBookingsOnDate(
  events: readonly CalendarEvent[],
  teamMemberId: string,
  iso: string,
  options?: {
    fallbackTeamMemberId?: string;
    knownTeamIds?: ReadonlySet<string>;
  },
): number {
  const knownTeamIds = options?.knownTeamIds ?? new Set<string>();
  const fallbackTeamMemberId = options?.fallbackTeamMemberId ?? "";

  return events.reduce((count, event) => {
    if (event.date !== iso) return count;
    if (event.status === "Cancelled") return count;

    if (eventBelongsToTeamMember(event, teamMemberId)) {
      return count + 1;
    }

    if (
      fallbackTeamMemberId &&
      teamMemberId === fallbackTeamMemberId &&
      !eventHasKnownTeamAssignment(event, knownTeamIds)
    ) {
      return count + 1;
    }

    return count;
  }, 0);
}

/** Day view: most bookings first; ties and empty days fall back to alphabetical. */
export function rankResourcesForCalendarDay(
  resources: readonly CalendarResource[],
  events: readonly CalendarEvent[],
  iso: string,
  options?: {
    fallbackTeamMemberId?: string;
    knownTeamIds?: ReadonlySet<string>;
  },
): CalendarResource[] {
  return [...resources].sort((a, b) => {
    const countDiff =
      countTeamMemberBookingsOnDate(events, b.id, iso, options) -
      countTeamMemberBookingsOnDate(events, a.id, iso, options);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function getTeamMemberBookings(
  events: readonly CalendarEvent[],
  teamMemberId: string,
  dates: readonly string[],
): CalendarEvent[] {
  const dateSet = new Set(dates);
  return events
    .filter(
      (event) =>
        dateSet.has(event.date) && eventBelongsToTeamMember(event, teamMemberId),
    )
    .slice()
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.start.localeCompare(b.start);
    });
}
