import {
  collectEventTeamMemberIds,
  eventBelongsToTeamMember,
} from "../teamMemberBookings";
import { resolveCalendarBookingIdentity } from "../calendar-overlap.utils";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";

type DayViewEventFields = Pick<
  CalendarEvent,
  "details" | "resourceId" | "id" | "bookingCode"
> & {
  date: string;
};

type DayViewMemberInput<
  TResource extends { id: string },
  TEvent extends DayViewEventFields,
> = {
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
};

function resolveDayViewSelectedId<TResource extends { id: string }>(input: {
  filteredResources: readonly TResource[];
  selectedResourceId: string;
  defaultDaySelectedResourceId: string;
  dayRankedResources: readonly TResource[];
}): string {
  const selectedMember =
    input.filteredResources.find(
      (resource) => resource.id === input.selectedResourceId,
    ) ??
    input.filteredResources.find(
      (resource) => resource.id === input.defaultDaySelectedResourceId,
    ) ??
    input.dayRankedResources.find((resource) =>
      input.filteredResources.some((row) => row.id === resource.id),
    ) ??
    input.filteredResources[0];
  return String(selectedMember?.id ?? "");
}

function teamIdsForDayViewEvent(
  event: Pick<CalendarEvent, "details" | "resourceId">,
): string[] {
  return [
    ...new Set(
      [
        ...collectEventTeamMemberIds(event),
        String(event.resourceId ?? "").trim(),
      ].filter(Boolean),
    ),
  ];
}

/**
 * Selected + same-day multi-assignee partners (deduped, filtered set only).
 * Unions assignees across sibling segments of the same booking so header
 * membership tracks service division even when each segment looks solo.
 */
function collectDayViewFocusGroupIds<
  TResource extends { id: string },
  TEvent extends DayViewEventFields,
>(input: {
  filteredResources: readonly TResource[];
  selectedId: string;
  eventsMatchingDrawerFilters: readonly TEvent[];
  activeDateIso: string;
  splitScreen: { primaryId: string; partnerId: string } | null;
}): string[] {
  const byId = new Set(
    input.filteredResources.map((resource) => String(resource.id)),
  );
  const orderedIds: string[] = [];
  const pushId = (id: string) => {
    const key = String(id);
    if (!key || !byId.has(key) || orderedIds.includes(key)) return;
    orderedIds.push(key);
  };

  if (input.splitScreen) {
    pushId(input.splitScreen.primaryId);
    pushId(input.splitScreen.partnerId);
    return orderedIds;
  }

  if (input.selectedId) pushId(input.selectedId);

  const seedIds = new Set(input.selectedId ? [input.selectedId] : []);
  const sameDay = input.eventsMatchingDrawerFilters.filter(
    (event) => event.date === input.activeDateIso,
  );
  // Group by booking identity so ::segment-* resourceIds feed one team set.
  const byBooking = new Map<string, TEvent[]>();
  for (const event of sameDay) {
    const key = resolveCalendarBookingIdentity(event).toLowerCase();
    const rows = byBooking.get(key);
    if (rows) rows.push(event);
    else byBooking.set(key, [event]);
  }

  for (const rows of byBooking.values()) {
    const teamIds = [
      ...new Set(rows.flatMap((event) => teamIdsForDayViewEvent(event))),
    ];
    if (teamIds.length <= 1) continue;
    const involvesSeed =
      teamIds.some((id) => seedIds.has(String(id))) ||
      [...seedIds].some((id) =>
        rows.some((event) => eventBelongsToTeamMember(event, id)),
      );
    if (!involvesSeed) continue;
    for (const teamId of teamIds) pushId(String(teamId));
  }

  return orderedIds;
}

type DayViewTeamLayoutSource<TResource extends { id: string }> = {
  /** Full filtered list: [focus…, …rest] — header scroller source. */
  headerResources: TResource[];
  /**
   * Body columns: always a prefix of headerResources (same ids/order),
   * so header cell i matches body column i for every visible split column.
   */
  memberColumns: TResource[];
  focusGroupLength: number;
  visibleSlots: number;
};

/**
 * Single source for day-view header + body columns.
 * Header: full filtered list [selected, …sharedPartners, …rest].
 * Body: focus group only (All / split), or same full list when filter narrowed.
 */
export function buildDayViewTeamLayoutSource<
  TResource extends { id: string },
  TEvent extends DayViewEventFields,
>(
  input: DayViewMemberInput<TResource, TEvent> & {
    defaultVisibleSlots: number;
  },
): DayViewTeamLayoutSource<TResource> {
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
    defaultVisibleSlots,
  } = input;

  if (viewMode !== "day") {
    return {
      headerResources: [],
      memberColumns: [],
      focusGroupLength: 0,
      visibleSlots: 1,
    };
  }

  if (resourcesLength === 0) {
    const unassigned = {
      id: "unassigned",
      name: "Unassigned",
      avatarText: "U",
    } as unknown as TResource;
    return {
      headerResources: [],
      memberColumns: [unassigned],
      focusGroupLength: 1,
      visibleSlots: 1,
    };
  }

  if (!filteredResources.length) {
    return {
      headerResources: [],
      memberColumns: [],
      focusGroupLength: 0,
      visibleSlots: 1,
    };
  }

  const byId = new Map(
    filteredResources.map((resource) => [String(resource.id), resource]),
  );
  const selectedId = resolveDayViewSelectedId({
    filteredResources,
    selectedResourceId,
    defaultDaySelectedResourceId,
    dayRankedResources,
  });
  const focusIds = collectDayViewFocusGroupIds({
    filteredResources,
    selectedId,
    eventsMatchingDrawerFilters,
    activeDateIso,
    splitScreen,
  });
  const focusSet = new Set(focusIds);
  const orderedIds = [...focusIds];
  const pushRest = (id: string) => {
    const key = String(id);
    if (!key || !byId.has(key) || focusSet.has(key) || orderedIds.includes(key))
      return;
    orderedIds.push(key);
  };
  for (const resource of dayRankedResources) pushRest(String(resource.id));
  for (const resource of filteredResources) pushRest(String(resource.id));

  const headerResources = orderedIds
    .map((id) => byId.get(id)!)
    .filter(Boolean);
  const focusGroupLength = Math.max(1, focusIds.length);

  // Body shares header order: focus prefix (All/split) or full list (filter).
  const bodyCount =
    splitScreen || teamAll ? focusGroupLength : headerResources.length;
  const memberColumns = headerResources.slice(0, bodyCount);
  // Viewport slots must equal body columns whenever body is the focus prefix
  // (selected-only / split). Otherwise N names sit above one full-width lane.
  const visibleSlots =
    splitScreen || teamAll
      ? Math.max(1, bodyCount)
      : Math.max(1, Math.min(defaultVisibleSlots, headerResources.length || 1));

  return {
    headerResources,
    memberColumns,
    focusGroupLength,
    visibleSlots,
  };
}

/**
 * Day multi-column stickiness: segment.resourceId must equal the lane.
 * Never use eventBelongsToTeamMember — shared partners would paint under neighbors.
 */
export function eventSticksToDayViewLane(
  event: Pick<CalendarEvent, "resourceId" | "details">,
  columnId: string,
  knownResourceIds: ReadonlySet<string>,
  fallbackTeamId: string,
): boolean {
  const col = String(columnId);
  const eventResourceId = String(event.resourceId ?? "");
  if (eventResourceId === col) return true;
  const hasKnownTeam =
    Boolean(eventResourceId && knownResourceIds.has(eventResourceId)) ||
    Boolean(
      event.details?.services?.some(
        (service) =>
          service.teamMemberId &&
          knownResourceIds.has(String(service.teamMemberId)),
      ),
    );
  return !hasKnownTeam && col === String(fallbackTeamId);
}

/**
 * Day team header scroller: always the full ordered list.
 * Focus group is leading; body lanes stick to that prefix (scroll does not
 * remount body — sync only when header length === body length).
 */
export function resolveDayViewColumnHeaderResources<
  TResource extends { id: string },
>(layout: DayViewTeamLayoutSource<TResource>): TResource[] {
  return layout.headerResources;
}

/** @deprecated prefer buildDayViewTeamLayoutSource — kept for narrow callers/tests */
export function buildDayViewTeamHeaderSource<
  TResource extends { id: string },
  TEvent extends DayViewEventFields,
>(
  input: DayViewMemberInput<TResource, TEvent> & {
    defaultVisibleSlots: number;
  },
): {
  resources: TResource[];
  focusGroupLength: number;
  visibleSlots: number;
} {
  const layout = buildDayViewTeamLayoutSource(input);
  return {
    resources: layout.headerResources,
    focusGroupLength: layout.focusGroupLength,
    visibleSlots: layout.visibleSlots,
  };
}

export function buildDayViewMemberColumnSource<
  TResource extends { id: string },
  TEvent extends DayViewEventFields,
>(input: DayViewMemberInput<TResource, TEvent>): TResource[] {
  return buildDayViewTeamLayoutSource({
    ...input,
    defaultVisibleSlots: 1,
  }).memberColumns;
}

export function remountDayViewSegmentsOntoVisibleColumns(
  segments: readonly CalendarEvent[],
  dayViewMemberColumnSource: readonly { id: string }[],
  _selectedResourceId: string,
): CalendarEvent[] {
  if (dayViewMemberColumnSource.length === 0) return [...segments];

  // Strict column stickiness: never rewrite resourceId onto another member
  // (belongs-to remount parked saad cards under ali). Hidden assignee columns
  // simply omit that segment; a co-assignee still visible keeps the booking.
  const visibleIds = new Set(
    dayViewMemberColumnSource.map((resource) => String(resource.id)),
  );
  return segments.filter((segment) =>
    visibleIds.has(String(segment.resourceId ?? "")),
  );
}
