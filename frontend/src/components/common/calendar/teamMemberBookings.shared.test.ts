/**
 * Run with: npx --yes tsx src/components/common/calendar/teamMemberBookings.shared.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { calendarEventToDisplaySegments } from "../../../data/bookingChronologicalBlocks";
import { resolveSameTimeStackChip } from "./calendar-overlap.utils";
import {
  collectEventTeamMemberIds,
  isTeamSharedBooking,
  teamSharedBookingTooltip,
} from "./teamMemberBookings";

function event(partial: Partial<CalendarEvent> & Pick<CalendarEvent, "id">): CalendarEvent {
  return {
    resourceId: "tm-ali",
    date: "2026-09-04",
    start: "09:15",
    end: "10:15",
    title: "Cut",
    status: "Requested",
    location: "FL",
    ...partial,
  };
}

const sharedDetails: CalendarEvent["details"] = {
  services: [
    {
      id: "svc-client",
      name: "Cut",
      price: 11,
      durationMins: 60,
      teamMemberId: "tm-ali",
      guestId: null,
    },
  ],
  guests: [
    {
      id: "g-1",
      name: "Guest",
      services: [
        {
          id: "svc-guest",
          name: "Cut",
          price: 11,
          durationMins: 60,
          staffResourceId: "tm-muhammad",
        },
      ],
      products: [],
    },
  ],
  clientSnapshot: {
    teamMembers: [
      { id: "tm-ali", name: "ali khan" },
      { id: "tm-muhammad", name: "Muhammad umer" },
      { id: "tm-extra", name: "Not assigned" },
    ],
  },
};

const sameMemberDetails: CalendarEvent["details"] = {
  services: [
    {
      id: "svc-client",
      name: "Cut",
      price: 11,
      durationMins: 60,
      teamMemberId: "tm-ali",
    },
  ],
  guests: [
    {
      id: "g-1",
      name: "Guest",
      services: [
        {
          id: "svc-guest",
          name: "Cut",
          price: 11,
          durationMins: 60,
          teamMemberId: "tm-ali",
        },
      ],
      products: [],
    },
  ],
};

assert.deepEqual(collectEventTeamMemberIds(event({ id: "b-1", details: sharedDetails })).sort(), [
  "tm-ali",
  "tm-muhammad",
]);
assert.equal(isTeamSharedBooking(event({ id: "b-1", details: sharedDetails })), true);
assert.equal(
  teamSharedBookingTooltip(event({ id: "b-1", details: sharedDetails })),
  "Shared across team members: ali, Muhammad",
);

assert.deepEqual(collectEventTeamMemberIds(event({ id: "b-1", details: sameMemberDetails })), [
  "tm-ali",
]);
assert.equal(isTeamSharedBooking(event({ id: "b-1", details: sameMemberDetails })), false);

assert.equal(
  isTeamSharedBooking(
    event({
      id: "b-catalog-only",
      details: {
        services: [
          {
            id: "svc-1",
            name: "Cut",
            price: 11,
            durationMins: 60,
            teamMemberId: "tm-ali",
          },
        ],
        clientSnapshot: {
          teamMembers: [
            { id: "tm-ali", name: "ali" },
            { id: "tm-muhammad", name: "Muhammad" },
          ],
        },
      },
    }),
  ),
  false,
);

const parentA = event({
  id: "booking-a::segment-0",
  bookingCode: "A1",
  details: sharedDetails,
});
const parentAGuest = event({
  id: "booking-a::segment-1",
  bookingCode: "A1",
  resourceId: "tm-muhammad",
  details: sharedDetails,
  showClientName: "Guest",
});
const parentB = event({
  id: "booking-b::segment-0",
  bookingCode: "B1",
  details: sameMemberDetails,
});

assert.deepEqual(resolveSameTimeStackChip([parentA]), null);
assert.deepEqual(resolveSameTimeStackChip([parentA, parentAGuest]), {
  kind: "shared",
});
assert.deepEqual(
  resolveSameTimeStackChip([
    event({
      id: "same-member::segment-0",
      bookingCode: "C1",
      details: sameMemberDetails,
    }),
    event({
      id: "same-member::segment-1",
      bookingCode: "C1",
      details: sameMemberDetails,
      showClientName: "Guest",
    }),
  ]),
  null,
);
assert.deepEqual(resolveSameTimeStackChip([parentA, parentB]), {
  kind: "requests",
  count: 2,
});
assert.deepEqual(resolveSameTimeStackChip([parentA, parentAGuest, parentB]), {
  kind: "requests",
  count: 2,
});

const columnSplit = event({
  id: "split::segment-0",
  teamShared: true,
  sharedTeamMemberNames: ["ali", "aliza"],
  details: sameMemberDetails,
});
assert.equal(isTeamSharedBooking(columnSplit), true);
assert.equal(
  teamSharedBookingTooltip(columnSplit),
  "Shared across team members: ali, aliza",
);
assert.equal(
  teamSharedBookingTooltip(
    event({
      id: "lane-ali",
      resourceId: "tm-ali",
      details: sameMemberDetails,
    }),
    {
      nameById: new Map([
        ["tm-ali", "ali khan"],
        ["tm-aliza", "aliza cc"],
      ]),
      events: [
        event({
          id: "lane-ali",
          resourceId: "tm-ali",
          details: sameMemberDetails,
        }),
        event({
          id: "lane-aliza",
          resourceId: "tm-aliza",
          details: sameMemberDetails,
        }),
      ],
    },
  ),
  "Shared across team members: ali, aliza",
);

const displaySegments = calendarEventToDisplaySegments(
  event({
    id: "parent-split",
    resourceId: "tm-ali",
    details: sharedDetails,
  }),
  new Map([
    ["tm-ali", "ali khan"],
    ["tm-muhammad", "aliza cc"],
  ]),
);
assert.equal(displaySegments.length, 2);
assert.equal(displaySegments.every((row) => row.teamShared), true);
assert.deepEqual(
  displaySegments.map((row) => row.resourceId).sort(),
  ["tm-ali", "tm-muhammad"],
);
assert.deepEqual(displaySegments[0].sharedTeamMemberNames, ["ali", "aliza"]);

const sameMemberCards = calendarEventToDisplaySegments(
  event({
    id: "parent-ali-only",
    resourceId: "tm-ali",
    title: "Muhammad umer arshad",
    showClientName: "Muhammad umer arshad",
    details: sameMemberDetails,
  }),
  new Map([["tm-ali", "ali khan"]]),
);
assert.equal(sameMemberCards.length, 1);
assert.equal(sameMemberCards[0].teamShared, false);
assert.equal(sameMemberCards[0].title, "Muhammad umer arshad");

console.log("teamMemberBookings.shared.test.ts passed");
