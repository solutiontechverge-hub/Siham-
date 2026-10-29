/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingStatus.timeBased.test.ts
 */
import assert from "node:assert/strict";
import {
  professionalCalendarDisplayStatus,
  resolveTimeBasedCalendarStatus,
} from "./bookingStatus";

const slot = {
  status: "Confirmed" as const,
  date: "2026-10-28",
  start: "09:00",
  end: "11:00",
  bookingType: "Online" as const,
  details: {},
};

assert.equal(
  resolveTimeBasedCalendarStatus(slot, new Date(2026, 9, 28, 8, 59)),
  "Confirmed",
  "before start stays Confirmed",
);
assert.equal(
  resolveTimeBasedCalendarStatus(slot, new Date(2026, 9, 28, 9, 0)),
  "In Progress",
  "at start → In Progress",
);
assert.equal(
  resolveTimeBasedCalendarStatus(slot, new Date(2026, 9, 28, 10, 30)),
  "In Progress",
  "mid window → In Progress",
);
assert.equal(
  resolveTimeBasedCalendarStatus(slot, new Date(2026, 9, 28, 11, 0)),
  "Completed",
  "at end → Completed",
);

assert.equal(
  resolveTimeBasedCalendarStatus(
    { ...slot, status: "Cancelled" },
    new Date(2026, 9, 28, 10, 0),
  ),
  "Cancelled",
  "Cancelled overrides auto In Progress",
);
assert.equal(
  resolveTimeBasedCalendarStatus(
    { ...slot, status: "No Show" },
    new Date(2026, 9, 28, 12, 0),
  ),
  "No Show",
  "No Show overrides auto Completed",
);

assert.equal(
  resolveTimeBasedCalendarStatus(
    { ...slot, status: "In Progress" },
    new Date(2026, 9, 28, 10, 30),
  ),
  "In Progress",
  "manual In Progress mid window stays",
);
assert.equal(
  resolveTimeBasedCalendarStatus(
    { ...slot, status: "In Progress" },
    new Date(2026, 9, 28, 11, 0),
  ),
  "Completed",
  "In Progress at end → Completed",
);

assert.equal(
  professionalCalendarDisplayStatus({
    ...slot,
    details: { refunded: true },
  }),
  "Refunded",
  "refunded wins over time-based",
);

console.log("bookingStatus.timeBased.test.ts: ok");
