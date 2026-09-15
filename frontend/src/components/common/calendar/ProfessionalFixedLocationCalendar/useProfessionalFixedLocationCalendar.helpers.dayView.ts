import { eventBelongsToTeamMember } from "../teamMemberBookings";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { resolveCalendarBookingIdentity } from "../calendar-overlap.utils";

export function buildDayViewMemberColumnSource<
  TResource extends { id: string },
>(input: {
  viewMode: string;
  splitScreen: { primaryId: string; partnerId: string } | null;
  resourcesLength: number;
  filteredResources: readonly TResource[];
  dayRankedResources: readonly TResource[];
}): TResource[] {
  const {
    viewMode,
    splitScreen,
    resourcesLength,
    filteredResources,
    dayRankedResources,
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

  // Preserve busiest-first (then alpha) from dayRankedResources.
  const filteredIdSet = new Set(
    filteredResources.map((resource) => String(resource.id)),
  );
  const ranked = dayRankedResources.filter((resource) =>
    filteredIdSet.has(String(resource.id)),
  );
  if (ranked.length === filteredResources.length) return [...ranked];

  const seen = new Set(ranked.map((resource) => String(resource.id)));
  return [
    ...ranked,
    ...filteredResources.filter(
      (resource) => !seen.has(String(resource.id)),
    ),
  ];
}

export function remountDayViewSegmentsOntoVisibleColumns(
  segments: readonly CalendarEvent[],
  dayViewMemberColumnSource: readonly { id: string }[],
  selectedResourceId: string,
): CalendarEvent[] {
  if (dayViewMemberColumnSource.length === 0) return [...segments];

  // Safety: if the max-3 column cap hid every assignee column, remount one
  // shared segment onto a visible host so the booking does not disappear.
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
