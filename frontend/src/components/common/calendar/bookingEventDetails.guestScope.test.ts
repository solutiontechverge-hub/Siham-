/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingEventDetails.guestScope.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  filterMainClientAssignedLines,
  hydrateBookingDrawerFromEvent,
  isMainClientAssignedLine,
} from "./bookingEventDetails";

const requesterIds = new Set(["p-requester"]);

assert.equal(isMainClientAssignedLine(null, requesterIds), true);
assert.equal(isMainClientAssignedLine("", requesterIds), true);
assert.equal(isMainClientAssignedLine("p-requester", requesterIds), true);
assert.equal(isMainClientAssignedLine("guest-1", requesterIds), false);

const mixed = [
  { id: "svc-main", name: "Main cut", guestId: null },
  { id: "svc-lash", name: "eyelash", guestId: "guest-1" },
];
assert.deepEqual(
  filterMainClientAssignedLines(mixed, requesterIds).map((row) => row.id),
  ["svc-main"],
);

const event: CalendarEvent = {
  id: "b-1",
  resourceId: "r-1",
  date: "2026-09-04",
  start: "09:00",
  end: "09:30",
  title: "Booking",
  status: "Confirmed",
  location: "FL",
  bookingType: "Offline",
  showClientName: "aliza",
  details: {
    clientEmail: "alizaclient@yopmail.com",
    services: [
      {
        id: "svc-umer",
        name: "Muhammad umer arshad",
        price: 11,
        durationMins: 60,
        guestId: null,
      },
      {
        id: "svc-lash",
        name: "eyelash",
        price: 111,
        durationMins: 11,
        guestId: "guest-1",
      },
    ],
    products: [
      {
        id: "unique-fdg",
        name: "fdg",
        price: 42,
        quantity: 1,
        unitPrice: 42,
        guestId: null,
      },
      {
        id: "prod-guest",
        name: "Guest product",
        price: 5,
        quantity: 1,
        unitPrice: 5,
        guestId: "guest-1",
      },
    ],
    guests: [
      {
        id: "guest-1",
        name: "Muhammad umer arshad",
        services: [
          {
            id: "svc-lash",
            name: "eyelash",
            price: 111,
            durationMins: 11,
            guestId: "guest-1",
          },
        ],
        products: [
          {
            id: "prod-guest",
            name: "Guest product",
            price: 5,
            quantity: 1,
            unitPrice: 5,
            guestId: "guest-1",
          },
        ],
        participantType: "guest",
      },
    ],
    clientSnapshot: {
      people: [
        { id: "p-requester", name: "aliza", isRequester: true },
        { id: "guest-1", name: "Muhammad umer arshad", isRequester: false, participantType: "guest" },
      ],
    },
  },
};

const hydration = hydrateBookingDrawerFromEvent(event);
assert.deepEqual(
  hydration.services.map((service) => service.name),
  ["Muhammad umer arshad"],
);
assert.deepEqual(
  hydration.products.map((product) => product.name),
  ["fdg"],
);
assert.equal(hydration.guests.length, 1);
assert.deepEqual(
  hydration.guests[0]?.services.map((service) => service.name),
  ["eyelash"],
);
assert.deepEqual(
  hydration.guests[0]?.products.map((product) => product.name),
  ["Guest product"],
);

console.log("bookingEventDetails.guestScope.test.ts: all assertions passed");
