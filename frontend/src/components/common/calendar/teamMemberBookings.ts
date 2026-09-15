import type {
  CalendarEvent,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

function addAssignedTeamId(
  ids: Set<string>,
  value: string | null | undefined,
) {
  const id = String(value ?? "").trim();
  if (id) ids.add(id);
}

/**
 * Team members actually assigned on the booking (services / buffers),
 * not the snapshot catalog of available members.
 */
export function collectEventTeamMemberIds(
  event: Pick<CalendarEvent, "resourceId" | "details">,
): string[] {
  const ids = new Set<string>();
  const details = event.details;

  for (const service of details?.services ?? []) {
    addAssignedTeamId(ids, service.teamMemberId);
    addAssignedTeamId(ids, service.staffResourceId);
  }

  for (const guest of details?.guests ?? []) {
    addAssignedTeamId(ids, guest.bufferTeamMemberId);
    for (const service of guest.services ?? []) {
      addAssignedTeamId(ids, service.teamMemberId);
      addAssignedTeamId(ids, service.staffResourceId);
    }
  }

  for (const service of details?.clientSnapshot?.services ?? []) {
    addAssignedTeamId(ids, service.teamMemberId);
  }

  return [...ids];
}

export function isTeamSharedBooking(
  event: Pick<
    CalendarEvent,
    "resourceId" | "details" | "teamShared" | "sharedTeamMemberNames"
  >,
): boolean {
  if (event.teamShared) return true;
  if ((event.sharedTeamMemberNames?.length ?? 0) > 1) return true;
  return collectEventTeamMemberIds(event).length > 1;
}

function firstTeamName(value: string | undefined) {
  const name = value?.trim();
  if (!name) return "";
  return name.split(/\s+/)[0] ?? "";
}

export function teamSharedBookingTooltip(
  event: Pick<
    CalendarEvent,
    "resourceId" | "details" | "teamShared" | "sharedTeamMemberNames"
  >,
  options?: {
    nameById?: ReadonlyMap<string, string>;
    events?: readonly Pick<
      CalendarEvent,
      "resourceId" | "details" | "sharedTeamMemberNames"
    >[];
  },
): string {
  const rows = options?.events?.length ? options.events : [event];
  const names = new Set<string>();
  const ids = new Set<string>();

  for (const row of rows) {
    for (const name of row.sharedTeamMemberNames ?? []) {
      const first = firstTeamName(name);
      if (first) names.add(first);
    }
    addAssignedTeamId(ids, row.resourceId);
    for (const id of collectEventTeamMemberIds(row)) ids.add(id);
    for (const member of row.details?.clientSnapshot?.teamMembers ?? []) {
      if (ids.has(String(member.id))) {
        const first = firstTeamName(member.name);
        if (first) names.add(first);
      }
    }
  }

  for (const id of ids) {
    const first = firstTeamName(options?.nameById?.get(id));
    if (first) names.add(first);
  }

  const listed = [...names];
  if (listed.length) {
    return `Shared across team members: ${listed.join(", ")}`;
  }
  return "One booking shared across these cards — not separate requests";
}

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
        knownTeamId(service.teamMemberId, knownTeamIds) ||
        knownTeamId(service.staffResourceId, knownTeamIds),
    )
  ) {
    return true;
  }

  if (
    event.details?.clientSnapshot?.services?.some((service) =>
      knownTeamId(service.teamMemberId, knownTeamIds),
    )
  ) {
    return true;
  }

  const guests = event.details?.guests ?? [];
  return guests.some(
    (guest) =>
      knownTeamId(guest.bufferTeamMemberId, knownTeamIds) ||
      (guest.services ?? []).some(
        (service) =>
          knownTeamId(service.teamMemberId, knownTeamIds) ||
          knownTeamId(service.staffResourceId, knownTeamIds),
      ),
  );
}

function serviceAssignedToTeamMember(
  service: {
    teamMemberId?: string | null;
    staffResourceId?: string | null;
  },
  focusedId: string,
) {
  return (
    String(service.teamMemberId ?? "") === focusedId ||
    String(service.staffResourceId ?? "") === focusedId
  );
}

export function eventBelongsToTeamMember(
  event: Pick<CalendarEvent, "resourceId" | "details">,
  teamMemberId: string,
): boolean {
  const focusedId = String(teamMemberId);
  if (String(event.resourceId) === focusedId) return true;

  const services = event.details?.services ?? [];
  if (services.some((service) => serviceAssignedToTeamMember(service, focusedId))) {
    return true;
  }

  const snapshotServices = event.details?.clientSnapshot?.services ?? [];
  if (
    snapshotServices.some(
      (service) => String(service.teamMemberId ?? "") === focusedId,
    )
  ) {
    return true;
  }

  const guests = event.details?.guests ?? [];
  return guests.some(
    (guest) =>
      String(guest.bufferTeamMemberId ?? "") === focusedId ||
      (guest.services ?? []).some((service) =>
        serviceAssignedToTeamMember(service, focusedId),
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

/** Day view: highest occupancy first; ties / all free → alphabetical by name. */
export function rankResourcesForCalendarDay(
  resources: readonly CalendarResource[],
  getOccupancyRatio: (resourceId: string) => number,
): CalendarResource[] {
  return [...resources].sort((a, b) => {
    const diff = getOccupancyRatio(b.id) - getOccupancyRatio(a.id);
    if (diff !== 0) return diff;
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
