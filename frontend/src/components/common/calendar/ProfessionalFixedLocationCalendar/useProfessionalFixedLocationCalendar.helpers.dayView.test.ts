/**
 * Run with: npx --yes tsx src/components/common/calendar/ProfessionalFixedLocationCalendar/useProfessionalFixedLocationCalendar.helpers.dayView.test.ts
 */
import assert from "node:assert/strict";
import { calendarEventToDisplaySegments } from "../../../../data/bookingChronologicalBlocks";
import {
  buildDayViewMemberColumnSource,
  buildDayViewTeamHeaderSource,
  buildDayViewTeamLayoutSource,
  eventSticksToDayViewLane,
  remountDayViewSegmentsOntoVisibleColumns,
  resolveDayViewColumnHeaderResources,
} from "./useProfessionalFixedLocationCalendar.helpers.dayView";

const resources = [
  { id: "tm-ali", name: "ali" },
  { id: "tm-aliza", name: "aliza" },
  { id: "tm-hama", name: "hama" },
  { id: "tm-saad", name: "saad" },
];

const sharedEvent = {
  id: "booking-ali-saad",
  date: "2026-09-16",
  start: "10:00",
  end: "11:00",
  title: "Cut",
  status: "Requested" as const,
  resourceId: "tm-ali",
  location: "FL" as const,
  details: {
    services: [
      {
        id: "s1",
        name: "Cut",
        price: 10,
        durationMins: 30,
        startTime: "10:00",
        endTime: "10:30",
        teamMemberId: "tm-ali",
        guestId: null,
      },
    ],
    guests: [
      {
        id: "g1",
        name: "Guest",
        services: [
          {
            id: "s2",
            name: "Cut",
            price: 10,
            durationMins: 30,
            startTime: "10:00",
            endTime: "10:30",
            staffResourceId: "tm-saad",
          },
        ],
        products: [],
      },
    ],
    clientSnapshot: {
      teamMembers: [
        { id: "tm-ali", name: "ali" },
        { id: "tm-saad", name: "saad" },
      ],
    },
  },
};

const aloneEvent = {
  id: "booking-ali-alone",
  date: "2026-09-16",
  resourceId: "tm-ali",
  details: {
    services: [
      {
        id: "s1",
        name: "Cut",
        price: 10,
        durationMins: 30,
        teamMemberId: "tm-ali",
      },
    ],
  },
};

const base = {
  viewMode: "day",
  splitScreen: null,
  resourcesLength: resources.length,
  filteredResources: resources,
  selectedResourceId: "tm-ali",
  defaultDaySelectedResourceId: "tm-ali",
  dayRankedResources: resources,
  activeDateIso: "2026-09-16",
};

assert.deepEqual(
  buildDayViewMemberColumnSource({
    ...base,
    teamAll: true,
    eventsMatchingDrawerFilters: [aloneEvent],
  }).map((r) => r.id),
  ["tm-ali"],
  "default: selected only",
);

assert.deepEqual(
  buildDayViewMemberColumnSource({
    ...base,
    teamAll: true,
    eventsMatchingDrawerFilters: [sharedEvent],
  }).map((r) => r.id),
  ["tm-ali", "tm-saad"],
  "shared booking: dynamic split",
);

assert.deepEqual(
  buildDayViewMemberColumnSource({
    ...base,
    teamAll: false,
    eventsMatchingDrawerFilters: [aloneEvent],
  }).map((r) => r.id),
  ["tm-ali", "tm-aliza", "tm-hama", "tm-saad"],
  "filter narrowed: all filtered columns",
);

assert.deepEqual(
  buildDayViewMemberColumnSource({
    ...base,
    teamAll: true,
    splitScreen: { primaryId: "tm-ali", partnerId: "tm-hama" },
    eventsMatchingDrawerFilters: [sharedEvent],
  }).map((r) => r.id),
  ["tm-ali", "tm-hama"],
  "manual split screen wins",
);

const headerAlone = buildDayViewTeamHeaderSource({
  ...base,
  teamAll: true,
  eventsMatchingDrawerFilters: [aloneEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  headerAlone.resources.map((r) => r.id),
  ["tm-ali", "tm-aliza", "tm-hama", "tm-saad"],
  "header alone: selected first, full list",
);
assert.equal(headerAlone.focusGroupLength, 1);
assert.equal(
  headerAlone.visibleSlots,
  1,
  "selected-only: one header slot matches one body column",
);

const headerShared = buildDayViewTeamHeaderSource({
  ...base,
  teamAll: true,
  eventsMatchingDrawerFilters: [sharedEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  headerShared.resources.map((r) => r.id),
  ["tm-ali", "tm-saad", "tm-aliza", "tm-hama"],
  "header shared: selected + partner then rest",
);
assert.equal(headerShared.focusGroupLength, 2);
assert.equal(headerShared.visibleSlots, 2, "focus group fits without scroll");

const headerSelectSaad = buildDayViewTeamHeaderSource({
  ...base,
  selectedResourceId: "tm-saad",
  teamAll: true,
  eventsMatchingDrawerFilters: [sharedEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  headerSelectSaad.resources.map((r) => r.id),
  ["tm-saad", "tm-ali", "tm-aliza", "tm-hama"],
  "header: newly selected moves first, then partners",
);

const filteredOnly = resources.filter((r) =>
  ["tm-ali", "tm-saad", "tm-hama"].includes(r.id),
);
const headerFiltered = buildDayViewTeamHeaderSource({
  ...base,
  filteredResources: filteredOnly,
  dayRankedResources: filteredOnly,
  teamAll: false,
  eventsMatchingDrawerFilters: [sharedEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  headerFiltered.resources.map((r) => r.id),
  ["tm-ali", "tm-saad", "tm-hama"],
  "header filter: only filtered members, same ordering",
);
assert.equal(headerFiltered.visibleSlots, 3, "filter: slots fit filtered roster");

// Alignment: body columns must equal header prefix (shared booking).
const sharedLayout = buildDayViewTeamLayoutSource({
  ...base,
  teamAll: true,
  eventsMatchingDrawerFilters: [sharedEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  sharedLayout.memberColumns.map((r) => r.id),
  sharedLayout.headerResources
    .slice(0, sharedLayout.memberColumns.length)
    .map((r) => r.id),
  "shared: body order === header prefix",
);
assert.deepEqual(
  sharedLayout.memberColumns.map((r) => r.id),
  ["tm-ali", "tm-saad"],
  "shared body is ali then saad under matching headers",
);

// Multi-col: full header for scroller; body stays focus prefix (aligned at scroll 0).
const sharedColumnHeaders = resolveDayViewColumnHeaderResources(sharedLayout);
assert.deepEqual(
  sharedColumnHeaders.map((r) => r.id),
  sharedLayout.headerResources.map((r) => r.id),
  "shared display headers === full header list",
);
assert.deepEqual(
  sharedColumnHeaders.slice(0, 2).map((r) => r.id),
  ["tm-ali", "tm-saad"],
  "shared: focus pair leads header under body lanes",
);
assert.ok(
  sharedColumnHeaders.length > sharedLayout.memberColumns.length,
  "shared: header longer than body so scrollbar can show",
);
assert.equal(sharedLayout.visibleSlots, 2, "shared: visible slots = focus size");
assert.ok(
  sharedColumnHeaders.length > sharedLayout.visibleSlots,
  "shared: header count > visible slots → needs scroll",
);

const aloneLayout = buildDayViewTeamLayoutSource({
  ...base,
  teamAll: true,
  eventsMatchingDrawerFilters: [aloneEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  resolveDayViewColumnHeaderResources(aloneLayout).map((r) => r.id),
  aloneLayout.headerResources.map((r) => r.id),
  "alone: display headers keep full team nav",
);
assert.equal(
  aloneLayout.visibleSlots,
  1,
  "alone: viewport slots === body column count",
);
assert.deepEqual(
  aloneLayout.memberColumns.map((r) => r.id),
  ["tm-ali"],
  "alone body is selected only",
);
assert.equal(
  String(resolveDayViewColumnHeaderResources(aloneLayout)[0].id),
  String(aloneLayout.memberColumns[0].id),
  "alone: leading header id === body column id",
);

const saadSelectedLayout = buildDayViewTeamLayoutSource({
  ...base,
  selectedResourceId: "tm-saad",
  teamAll: true,
  eventsMatchingDrawerFilters: [sharedEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  saadSelectedLayout.memberColumns.map((r) => r.id),
  saadSelectedLayout.headerResources
    .slice(0, saadSelectedLayout.memberColumns.length)
    .map((r) => r.id),
  "select saad: body order === header prefix",
);
assert.deepEqual(
  saadSelectedLayout.memberColumns.map((r) => r.id),
  ["tm-saad", "tm-ali"],
  "select saad: saad column first, then ali",
);
assert.deepEqual(
  resolveDayViewColumnHeaderResources(saadSelectedLayout)
    .slice(0, 2)
    .map((r) => r.id),
  ["tm-saad", "tm-ali"],
  "select saad: focus pair leads full header under body",
);
assert.deepEqual(
  resolveDayViewColumnHeaderResources(saadSelectedLayout).map((r) => r.id),
  saadSelectedLayout.headerResources.map((r) => r.id),
  "select saad: display headers are full roster",
);

// Filter narrowed + shared: body uses same order as header (not dayRanked alone).
const rankedSaadFirst = [
  { id: "tm-saad", name: "saad" },
  { id: "tm-ali", name: "ali" },
  { id: "tm-hama", name: "hama" },
];
const filterSharedLayout = buildDayViewTeamLayoutSource({
  ...base,
  filteredResources: rankedSaadFirst,
  dayRankedResources: rankedSaadFirst,
  selectedResourceId: "tm-ali",
  teamAll: false,
  eventsMatchingDrawerFilters: [sharedEvent],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  filterSharedLayout.memberColumns.map((r) => r.id),
  filterSharedLayout.headerResources.map((r) => r.id),
  "filter+shared: body === header (full list)",
);
assert.deepEqual(
  filterSharedLayout.memberColumns.map((r) => r.id),
  ["tm-ali", "tm-saad", "tm-hama"],
  "filter+shared: focus order wins over dayRanked",
);
assert.deepEqual(
  resolveDayViewColumnHeaderResources(filterSharedLayout).map((r) => r.id),
  filterSharedLayout.memberColumns.map((r) => r.id),
  "filter+shared: display headers === body",
);

// ali+saad shared booking: each segment sticks to its assignee column only.
const nameById = new Map(resources.map((r) => [r.id, r.name]));
const rawSegments = calendarEventToDisplaySegments(
  sharedEvent as Parameters<typeof calendarEventToDisplaySegments>[0],
  nameById,
);
assert.equal(rawSegments.length, 2, "FL shared → one segment per assignee");
assert.deepEqual(
  rawSegments.map((s) => String(s.resourceId)).sort(),
  ["tm-ali", "tm-saad"],
);

const columns = sharedLayout.memberColumns;
const visibleSegments = remountDayViewSegmentsOntoVisibleColumns(
  rawSegments,
  columns,
  "tm-ali",
);
assert.equal(visibleSegments.length, 2);

function laneEventsForColumn(
  columnId: string,
  segments: typeof visibleSegments,
) {
  return segments.filter(
    (event) => String(event.resourceId ?? "") === String(columnId),
  );
}

for (let i = 0; i < columns.length; i++) {
  const column = columns[i];
  const header = sharedColumnHeaders[i];
  assert.equal(
    String(header.id),
    String(column.id),
    `index ${i}: header id === body column id`,
  );
  const lane = laneEventsForColumn(column.id, visibleSegments);
  assert.equal(lane.length, 1, `${column.name} column has exactly one card`);
  assert.equal(
    String(lane[0].resourceId),
    String(column.id),
    `${column.name} column card resourceId matches column`,
  );
}

// Overlap same start: still one card per column (stack within column, no spill).
assert.equal(
  visibleSegments.filter((s) => s.start === "10:00").length,
  2,
  "overlapping start times still produce two column-scoped segments",
);
assert.equal(
  laneEventsForColumn("tm-ali", visibleSegments).some(
    (s) => String(s.resourceId) === "tm-saad",
  ),
  false,
  "saad segment never appears in ali lane",
);
assert.equal(
  laneEventsForColumn("tm-saad", visibleSegments).some(
    (s) => String(s.resourceId) === "tm-ali",
  ),
  false,
  "ali segment never appears in saad lane",
);

// Remount must not rewrite saad onto ali when only ali's column is visible.
const aliOnly = remountDayViewSegmentsOntoVisibleColumns(
  rawSegments,
  [{ id: "tm-ali" }],
  "tm-ali",
);
assert.deepEqual(
  aliOnly.map((s) => String(s.resourceId)),
  ["tm-ali"],
  "ali-only columns keep ali segment; do not remount saad under ali",
);

const knownIds = new Set(resources.map((r) => r.id));
for (const segment of rawSegments) {
  const assignee = String(segment.resourceId);
  for (const column of columns) {
    const shouldStick = assignee === String(column.id);
    assert.equal(
      eventSticksToDayViewLane(segment, column.id, knownIds, "tm-ali"),
      shouldStick,
      `${assignee} segment sticks to ${column.id}: ${shouldStick}`,
    );
  }
}

// Focus group recomputes when service assignees change (header must not go stale).
const reassignedToHama = {
  ...sharedEvent,
  details: {
    ...sharedEvent.details,
    guests: [
      {
        id: "g1",
        name: "Guest",
        services: [
          {
            id: "s2",
            name: "Cut",
            price: 10,
            durationMins: 30,
            startTime: "10:00",
            endTime: "10:30",
            staffResourceId: "tm-hama",
          },
        ],
        products: [],
      },
    ],
  },
};
const afterReassign = buildDayViewTeamLayoutSource({
  ...base,
  teamAll: true,
  eventsMatchingDrawerFilters: [reassignedToHama],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  afterReassign.memberColumns.map((r) => r.id),
  ["tm-ali", "tm-hama"],
  "reassign staff: focus group drops saad, adds hama",
);
assert.deepEqual(
  resolveDayViewColumnHeaderResources(afterReassign)
    .slice(0, 2)
    .map((r) => r.id),
  ["tm-ali", "tm-hama"],
  "reassign staff: leading header tracks new division",
);
assert.equal(afterReassign.focusGroupLength, 2);

// Sibling segments with solo-looking details still union via booking identity.
const segmentAli = {
  id: "booking-seg::segment-0",
  bookingCode: "SEG1",
  date: "2026-09-16",
  resourceId: "tm-ali",
  details: {
    services: [
      {
        id: "s1",
        name: "Cut",
        price: 10,
        durationMins: 30,
        teamMemberId: "tm-ali",
      },
    ],
  },
};
const segmentSaad = {
  id: "booking-seg::segment-1",
  bookingCode: "SEG1",
  date: "2026-09-16",
  resourceId: "tm-saad",
  details: {
    services: [
      {
        id: "s2",
        name: "Cut",
        price: 10,
        durationMins: 30,
        teamMemberId: "tm-saad",
      },
    ],
  },
};
const segmentLayout = buildDayViewTeamLayoutSource({
  ...base,
  teamAll: true,
  eventsMatchingDrawerFilters: [segmentAli, segmentSaad],
  defaultVisibleSlots: 3,
});
assert.deepEqual(
  segmentLayout.memberColumns.map((r) => r.id),
  ["tm-ali", "tm-saad"],
  "segment resourceIds: focus group unions siblings of same booking",
);

console.log("dayView column + header source ok");
