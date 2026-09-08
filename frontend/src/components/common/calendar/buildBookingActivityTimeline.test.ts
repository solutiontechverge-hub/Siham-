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

console.log("buildBookingActivityTimeline.test.ts passed");
