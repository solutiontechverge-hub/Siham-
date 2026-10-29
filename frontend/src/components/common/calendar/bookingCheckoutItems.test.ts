/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingCheckoutItems.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  buildCheckoutItemParties,
  filterLinesForParty,
  manualLinesFromBookingEvent,
} from "./bookingCheckoutItems";

const solo: CalendarEvent = {
  id: "b1",
  resourceId: "r1",
  date: "2026-10-28",
  start: "10:00",
  end: "11:00",
  title: "Cut",
  status: "Completed",
  location: "FL",
  details: {
    services: [{ id: "s1", name: "Blow Dry", price: 50, durationMins: 30 }],
    products: [
      {
        id: "p1",
        name: "Shampoo",
        price: 50,
        quantity: 2,
        unitPrice: 25,
      },
    ],
  },
} as CalendarEvent;

const soloParties = buildCheckoutItemParties({
  event: solo,
  shares: [
    {
      key: "main",
      role: "main_client",
      label: "Sara",
      displayName: "Sara Johnson",
      email: "sara@x.com",
    },
  ],
  clientName: "Sara Johnson",
  clientEmail: "sara@x.com",
  clientKind: "individual",
});
assert.equal(soloParties.length, 1);
assert.equal(soloParties[0].variant, "main");
assert.equal(soloParties[0].clientBadge, "IC Client");

const withGuest: CalendarEvent = {
  ...solo,
  details: {
    ...solo.details,
    guests: [
      {
        id: "g1",
        name: "John Smith",
        participantType: "guest",
        services: [
          { id: "s2", name: "Blow Dry", price: 50, durationMins: 30 },
        ],
        products: [],
      },
    ],
  },
} as CalendarEvent;

const multiParties = buildCheckoutItemParties({
  event: withGuest,
  shares: [
    {
      key: "main",
      role: "main_client",
      label: "Sara",
      displayName: "Sara Johnson",
      email: "sara@x.com",
    },
    {
      key: "g1",
      role: "guest",
      label: "Guest",
      displayName: "John Smith",
    },
  ],
  clientName: "Sara Johnson",
  clientEmail: "sara@x.com",
  clientKind: "individual",
});
assert.equal(multiParties.length, 2);
assert.equal(multiParties[0].variant, "main");
assert.equal(multiParties[1].variant, "guest");
assert.equal(multiParties[1].name, "John Smith");
assert.equal(multiParties[1].clientBadge, null);

const guestOnly: CalendarEvent = {
  ...solo,
  bookingType: "Offline",
  details: { ...solo.details, isGuest: true, clientEmail: undefined },
} as CalendarEvent;

const guestParties = buildCheckoutItemParties({
  event: guestOnly,
  shares: [
    {
      key: "main",
      role: "main_client",
      label: "Walk-in",
      displayName: "Walk-in",
    },
  ],
  clientName: "Walk-in",
  clientKind: "individual",
});
assert.equal(guestParties.length, 1);
assert.equal(guestParties[0].variant, "guest");

const lines = manualLinesFromBookingEvent(withGuest);
const mainLines = filterLinesForParty(lines, multiParties[0]);
const guestLines = filterLinesForParty(lines, multiParties[1]);
assert.ok(mainLines.some((line) => line.name === "Blow Dry" || line.name === "Shampoo"));
assert.ok(guestLines.some((line) => line.name === "Blow Dry"));
assert.equal(
  guestLines.every((line) => line.id.includes("::g1::")),
  true,
);

// Snapshot services must not drop guest products / unique items.
const snapshotWithGuestProducts: CalendarEvent = {
  ...withGuest,
  details: {
    ...withGuest.details,
    clientSnapshot: {
      people: [
        { id: "main", name: "Sara", isRequester: true },
        { id: "g1", name: "John Smith", participantType: "guest" },
      ],
      services: [
        { id: "s1", name: "Blow Dry", price: 50, durationMins: 30, guestId: null },
        { id: "s2", name: "Blow Dry", price: 50, durationMins: 30, guestId: "g1" },
      ],
    },
    guests: [
      {
        id: "g1",
        name: "John Smith",
        participantType: "guest",
        services: [],
        products: [
          {
            id: "p-guest",
            name: "Eye Lashes",
            price: 50,
            quantity: 1,
            unitPrice: 50,
          },
          {
            id: "unique-cond",
            name: "CONDITIONER",
            price: 21.6,
            quantity: 1,
            unitPrice: 21.6,
          },
        ],
      },
    ],
    products: [
      {
        id: "unique-shampoo",
        name: "shampoo",
        price: 35.2,
        quantity: 1,
        unitPrice: 35.2,
      },
    ],
  },
} as CalendarEvent;
const snapshotLines = manualLinesFromBookingEvent(snapshotWithGuestProducts);
assert.ok(
  snapshotLines.some((line) => line.name === "Eye Lashes"),
  "guest product must survive snapshot services path",
);
assert.ok(
  snapshotLines.some((line) => line.name === "CONDITIONER"),
  "guest unique item must survive snapshot services path",
);
assert.ok(
  snapshotLines.some((line) => line.name === "shampoo"),
  "main unique item must survive snapshot services path",
);
assert.equal(
  snapshotLines.find((line) => line.name === "CONDITIONER")?.sourceType,
  "uniqueItemCode",
);

console.log("bookingCheckoutItems.test.ts passed");
