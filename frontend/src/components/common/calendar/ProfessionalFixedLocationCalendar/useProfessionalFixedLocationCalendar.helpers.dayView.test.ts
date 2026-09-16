/**
 * Run with: npx --yes tsx src/components/common/calendar/ProfessionalFixedLocationCalendar/useProfessionalFixedLocationCalendar.helpers.dayView.test.ts
 */
import assert from "node:assert/strict";
import { buildDayViewMemberColumnSource } from "./useProfessionalFixedLocationCalendar.helpers.dayView";

const resources = [
  { id: "tm-ali", name: "ali" },
  { id: "tm-aliza", name: "aliza" },
  { id: "tm-hama", name: "hama" },
];

const sharedEvent = {
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
            staffResourceId: "tm-aliza",
          },
        ],
        products: [],
      },
    ],
  },
};

const aloneEvent = {
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
  ["tm-ali", "tm-aliza"],
  "shared booking: dynamic split",
);

assert.deepEqual(
  buildDayViewMemberColumnSource({
    ...base,
    teamAll: false,
    eventsMatchingDrawerFilters: [aloneEvent],
  }).map((r) => r.id),
  ["tm-ali", "tm-aliza", "tm-hama"],
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

console.log("dayView column source ok");
