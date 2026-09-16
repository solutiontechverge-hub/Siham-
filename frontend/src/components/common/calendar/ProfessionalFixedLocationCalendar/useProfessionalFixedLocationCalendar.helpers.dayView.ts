import {
  collectEventTeamMemberIds,
  eventBelongsToTeamMember,
} from "../teamMemberBookings";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { resolveCalendarBookingIdentity } from "../calendar-overlap.utils";

export function buildDayViewMemberColumnSource<
  TResource extends { id: string },
  TEvent extends Pick<CalendarEvent, "details" | "resourceId"> & {
    date: string;
  },
>(input: {
  viewMode: string;
  splitScreen: { primaryId: string; partnerId: string } | null;
  resourcesLength: number;
  filteredResources: readonly TResource[];
  selectedResourceId: string;
  defaultDaySelectedResourceId: string;
  dayRankedResources: readonly TResource[];
  eventsMatchingDrawerFilters: readonly TEvent[];
  activeDateIso: string;
  /** When false, drawer team filter is narrowed → split into filtered members. */
  teamAll: boolean;
}): TResource[] {
  const {
    viewMode,
    splitScreen,
    resourcesLength,
    filteredResources,
    selectedResourceId,
    defaultDaySelectedResourceId,
    dayRankedResources,
    eventsMatchingDrawerFilters,
    activeDateIso,
    teamAll,
  } = input;

  if (viewMode !== "day") return [] as TResource[];

  if (splitScreen) {
    const resolveResource = (resourceId: string) =>
      filteredResources.find((resource) => resource.id === resourceId);
    const primary = resolveResource(splitScreen.primaryId);
    const partner = resolveResource(splitScreen.partnerId);
    return [primary, partner].filter(
      (resource): resource is TResource => Boolean(resource),
    );
  }

  if (resourcesLength === 0) {
    return [
      {
        id: "unassigned",
        name: "Unassigned",
        avatarText: "U",
      } as unknown as TResource,
    ];
  }

  if (!filteredResources.length) return [] as TResource[];

  const byId = new Map(
    filteredResources.map((resource) => [String(resource.id), resource]),
  );
  const orderedIds: string[] = [];
  const pushId = (id: string) => {
    const key = String(id);
    if (!key || !byId.has(key) || orderedIds.includes(key)) return;
    orderedIds.push(key);
  };

  // Filter-based split: show every member still in the filtered set.
  if (!teamAll) {
    const filteredIdSet = new Set(
      filteredResources.map((resource) => String(resource.id)),
    );
    for (const resource of dayRankedResources) {
      if (filteredIdSet.has(String(resource.id))) pushId(String(resource.id));
    }
    for (const resource of filteredResources) pushId(String(resource.id));
    return orderedIds.map((id) => byId.get(id)!).filter(Boolean);
  }

  // Default (All): one column for the selected member — no page split…
  const selectedMember =
    filteredResources.find((resource) => resource.id === selectedResourceId) ??
    filteredResources.find(
      (resource) => resource.id === defaultDaySelectedResourceId,
    ) ??
    dayRankedResources.find((resource) =>
      filteredResources.some((row) => row.id === resource.id),
    ) ??
    filteredResources[0];
  const selectedId = String(selectedMember?.id ?? "");
  if (selectedId) pushId(selectedId);

  const bookingTeamIds = (event: TEvent) =>
    [
      ...new Set(
        [
          ...collectEventTeamMemberIds(event),
          String(event.resourceId ?? "").trim(),
        ].filter(Boolean),
      ),
    ];

  // …unless a multi-member booking touches the selected member (dynamic split).
  const seedIds = new Set(selectedId ? [selectedId] : []);
  for (const event of eventsMatchingDrawerFilters) {
    if (event.date !== activeDateIso) continue;
    const teamIds = bookingTeamIds(event);
    if (teamIds.length <= 1) continue;
    const involvesSeed =
      teamIds.some((id) => seedIds.has(String(id))) ||
      [...seedIds].some((id) => eventBelongsToTeamMember(event, id));
    if (!involvesSeed) continue;
    for (const teamId of teamIds) pushId(String(teamId));
  }

  return orderedIds.map((id) => byId.get(id)!).filter(Boolean);
}

export function remountDayViewSegmentsOntoVisibleColumns(
  segments: readonly CalendarEvent[],
  dayViewMemberColumnSource: readonly { id: string }[],
  selectedResourceId: string,
): CalendarEvent[] {
  if (dayViewMemberColumnSource.length === 0) return [...segments];

  // Safety: if a shared segment's assignee column isn't visible, remount one
  // onto a visible host so the booking does not disappear.
  const visibleIds = new Set(
    dayViewMemberColumnSource.map((resource) => String(resource.id)),
  );
  const focusedId = String(
    selectedResourceId || dayViewMemberColumnSource[0]?.id || "",
  );
  const shownBookingKeys = new Set(
    segments
      .filter((segment) => visibleIds.has(String(segment.resourceId ?? "")))
      .map((segment) =>
        resolveCalendarBookingIdentity(segment).toLowerCase(),
      ),
  );
  const remounted: CalendarEvent[] = [];
  for (const segment of segments) {
    if (visibleIds.has(String(segment.resourceId ?? ""))) {
      remounted.push(segment);
      continue;
    }
    const bookingKey = resolveCalendarBookingIdentity(segment).toLowerCase();
    if (shownBookingKeys.has(bookingKey)) continue;
    const host =
      (focusedId &&
      eventBelongsToTeamMember(segment, focusedId) &&
      visibleIds.has(focusedId)
        ? dayViewMemberColumnSource.find(
            (resource) => String(resource.id) === focusedId,
          )
        : undefined) ??
      dayViewMemberColumnSource.find((resource) =>
        eventBelongsToTeamMember(segment, resource.id),
      );
    if (!host) continue;
    shownBookingKeys.add(bookingKey);
    remounted.push({
      ...segment,
      resourceId: host.id,
      teamShared: true,
    });
  }
  return remounted;
}
