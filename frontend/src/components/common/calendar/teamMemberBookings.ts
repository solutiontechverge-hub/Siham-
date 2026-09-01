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
