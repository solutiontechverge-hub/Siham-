/**
 * Run with: npx --yes tsx src/components/common/calendar/teamMemberBookings.shared.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { calendarEventToDisplaySegments } from "../../../data/bookingChronologicalBlocks";
import {
  resolveBookingIdAccentColor,
  resolveCalendarBookingIdentity,
  resolveSameTimeStackChip,
} from "./calendar-overlap.utils";
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

assert.deepEqual(
  collectEventTeamMemberIds(
    event({
      id: "b-snapshot-staff",
      details: {
        clientSnapshot: {
          services: [
            { id: "s1", name: "Cut", price: 10, durationMins: 30, staffResourceId: "tm-saad" },
            { id: "s2", name: "Color", price: 10, durationMins: 30, teamMemberId: "tm-ali" },
          ],
          people: [{ id: "p1", name: "Buf", bufferTeamMemberId: "tm-hama" }],
        },
      },
    }),
  ).sort(),
  ["tm-ali", "tm-hama", "tm-saad"],
  "snapshot staffResourceId + people buffer feed team ids",
);
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

const desiredLocationCards = calendarEventToDisplaySegments(
  event({
    id: "parent-dl",
    location: "DL",
    resourceId: "tm-ali",
    start: "11:15",
    end: "12:26",
    title: "Muhammad umer arshad · eyelash",
    showClientName: "alizaCompany",
    details: {
      services: [
        {
          id: "svc-main-a",
          name: "Muhammad umer arshad",
          price: 11,
          durationMins: 60,
          startTime: "11:15",
          endTime: "12:15",
          teamMemberId: "tm-ali",
          guestId: null,
        },
        {
          id: "svc-main-b",
          name: "eyelash",
          price: 111,
          durationMins: 11,
          startTime: "12:15",
          endTime: "12:26",
          teamMemberId: "tm-ali",
          guestId: null,
        },
      ],
      guests: [
        {
          id: "model-1",
          name: "ali",
          participantType: "model",
          services: [
            {
              id: "svc-m1-a",
              name: "Muhammad umer arshad",
              price: 11,
              durationMins: 60,
              startTime: "12:26",
              endTime: "13:26",
              teamMemberId: "tm-ali",
            },
            {
              id: "svc-m1-b",
              name: "eyelash",
              price: 111,
              durationMins: 11,
              startTime: "13:26",
              endTime: "13:37",
              teamMemberId: "tm-ali",
            },
          ],
          products: [],
        },
        {
          id: "model-2",
          name: "umer",
          participantType: "model",
          services: [
            {
              id: "svc-m2-a",
              name: "Muhammad umer arshad",
              price: 11,
              durationMins: 60,
              startTime: "13:37",
              endTime: "14:37",
              teamMemberId: "tm-ali",
            },
            {
              id: "svc-m2-b",
              name: "eyelash",
              price: 111,
              durationMins: 11,
              startTime: "14:37",
              endTime: "14:48",
              teamMemberId: "tm-ali",
            },
          ],
          products: [],
        },
      ],
    },
  }),
  new Map([["tm-ali", "ali khan"]]),
);
assert.equal(desiredLocationCards.length, 1);
assert.equal(desiredLocationCards[0]?.start, "11:15");
assert.equal(desiredLocationCards[0]?.end, "14:48");
assert.equal(desiredLocationCards[0]?.showClientName, "alizaCompany");
assert.equal(desiredLocationCards[0]?.title, "Muhammad umer arshad · eyelash");
assert.equal(desiredLocationCards[0]?.teamShared, false);

const accents = ["#21B8BF", "#149CA7", "#344A66", "#71819A"];
const a0 = resolveBookingIdAccentColor("booking-a", accents);
assert.equal(
  resolveBookingIdAccentColor("BOOKING-A", accents),
  a0,
  "same booking id → stable accent (case-insensitive)",
);
assert.equal(
  resolveBookingIdAccentColor("booking-a", accents),
  a0,
  "stable across calls",
);
assert.notEqual(
  a0,
  resolveBookingIdAccentColor("booking-b", accents),
  "different booking ids → different accents when possible",
);
const segAccent = (partial: Partial<CalendarEvent> & Pick<CalendarEvent, "id">) =>
  resolveBookingIdAccentColor(
    resolveCalendarBookingIdentity(event(partial)),
    accents,
  );
assert.equal(
  segAccent({ id: "booking-a::segment-0", bookingCode: "A1" }),
  segAccent({ id: "booking-a::segment-1", bookingCode: "A1" }),
  "shared booking segments → same accent via identity",
);

console.log("teamMemberBookings.shared.test.ts passed");
