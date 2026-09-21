/**
 * Run with: npx --yes tsx src/components/common/calendar/buildBookingActivityTimeline.test.ts
 */
import assert from "node:assert/strict";
import { buildBookingActivityTimeline } from "./buildBookingActivityTimeline";

const items = buildBookingActivityTimeline({
  bookings: [
    {
      id: "1",
      unique_code: "BK1",
      status: "confirmed",
      notes: null,
    },
  ],
  clientName: "Client",
  currentBookingId: "1",
  currentBookingCode: "BK1",
  currentScenario: "ER",
  currentStatus: "confirmed",
  currentDetails: {
    originalGuests: [
      { id: "g1", name: "Ali", participantType: "guest", services: [] },
      { id: "p1", name: "Planning", participantType: "planning", services: [] },
    ],
    guests: [
      { id: "g1", name: "umerarshad", participantType: "guest", services: [] },
      { id: "p1", name: "Planning", participantType: "planning", services: [] },
    ],
  },
  mode: "activity",
});

const comparisonItem = items.find((item) => item.comparison?.rows.length);
assert.ok(comparisonItem, "expected a comparison activity row");
const guestRow = comparisonItem!.comparison!.rows.find((row) => row.id === "guests");
assert.ok(guestRow, "expected a Guest names comparison row");
assert.equal(guestRow!.label, "Guest names");
assert.equal(guestRow!.originalValue, "Ali");
assert.equal(guestRow!.newValue, "umerarshad");
assert.equal(guestRow!.changeKind, "changed");

const snapshotFallback = buildBookingActivityTimeline({
  bookings: [
    {
      id: "2",
      unique_code: "BK2",
      status: "confirmed",
      notes: null,
    },
  ],
  clientName: "Client",
  currentBookingId: "2",
  currentBookingCode: "BK2",
  currentScenario: "ER",
  currentStatus: "confirmed",
  currentDetails: {
    guests: [
      { id: "g1", name: "umerarshad", participantType: "guest", services: [] },
    ],
    silentUpdateSnapshot: {
      guests: [{ id: "g1", name: "Ali", participantType: "guest", services: [] }],
    },
  },
  mode: "activity",
});
const snapshotGuest = snapshotFallback
  .find((item) => item.comparison?.rows.length)
  ?.comparison?.rows.find((row) => row.id === "guests");
assert.equal(snapshotGuest?.originalValue, "Ali");
assert.equal(snapshotGuest?.newValue, "umerarshad");

// Fresh create: services present, no ER/EBR markers → no invent edit activity.
const freshCreate = buildBookingActivityTimeline({
  bookings: [
    {
      id: "3",
      unique_code: "BK3",
      status: "confirmed",
      notes: null,
      created_at: "2026-09-21T14:04:00.000Z",
      updated_at: "2026-09-21T14:04:00.000Z",
    },
  ],
  clientName: "aliza",
  currentBookingId: "3",
  currentBookingCode: "BK3",
  currentScenario: null,
  currentStatus: "confirmed",
  currentDetails: {
    services: [
      {
        id: "buzz",
        name: "buzz cutt",
        price: 44,
        durationMins: 15,
        startTime: "09:00",
        endTime: "09:15",
      },
      {
        id: "buzz",
        name: "buzz cutt",
        price: 44,
        durationMins: 15,
        startTime: "00:00",
        endTime: "00:15",
        guestId: "g1",
      },
    ],
  },
  apiEvents: [
    {
      id: "a1",
      bookingId: "3",
      kind: "booking_confirmed",
      actor: "professional",
      actorLabel: "Professional",
      title: "Confirmed",
      occurredAt: "2026-09-21T14:04:00.000Z",
    },
    {
      id: "a2",
      bookingId: "3",
      kind: "booking_created",
      actor: "client",
      actorLabel: "Client",
      title: "Booking created",
      occurredAt: "2026-09-21T14:04:00.000Z",
    },
    {
      id: "a3",
      bookingId: "3",
      kind: "edit_request_sent",
      actor: "professional",
      actorLabel: "Professional",
      title: "Edited Booking Request sent",
      occurredAt: "2026-09-21T14:04:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(
  freshCreate.some((item) => item.kind === "edit_request_sent"),
  false,
  "fresh create must not show Edited Booking Request sent",
);
assert.ok(
  freshCreate.some((item) => item.kind === "booking_created"),
  "fresh create still shows Booking created",
);

console.log("buildBookingActivityTimeline.test.ts passed");
