/**
 * Run with: npx --yes tsx src/app/clients/booking/clientBookingRecords.schedule.test.ts
 */
import assert from "node:assert/strict";
import {
  listTabForClientBooking,
  resolveClientBookingDisplayStatus,
  type ClientBookingRecord,
} from "./clientBookingRecords";

function record(
  status: ClientBookingRecord["status"],
  dateIso: string,
  timeLabel: string,
  durationMins = 60,
): ClientBookingRecord {
  return {
    id: "1",
    status,
    draft: {
      selectedDateISO: dateIso,
      selectedTime: timeLabel,
      combineServices: false,
      people: [],
      services: [
        {
          id: "s1",
          name: "Cut",
          price: 10,
          durationMins,
          startTime: timeLabel,
        },
      ],
      products: [],
      total: 10,
    },
  };
}

const day = "2026-10-28";

assert.equal(
  resolveClientBookingDisplayStatus(
    record("confirmed", day, "9:00 AM"),
    new Date(2026, 9, 28, 8, 59),
  ),
  "confirmed",
  "before start stays confirmed",
);
assert.equal(
  resolveClientBookingDisplayStatus(
    record("confirmed", day, "9:00 am"),
    new Date(2026, 9, 28, 9, 0),
  ),
  "in_progress",
  "at start → in_progress (am case)",
);
assert.equal(
  resolveClientBookingDisplayStatus(
    record("confirmed", day, "9:00 AM", 120),
    new Date(2026, 9, 28, 10, 0),
  ),
  "in_progress",
  "mid window → in_progress",
);
assert.equal(
  resolveClientBookingDisplayStatus(
    record("in_progress", day, "9:00 AM", 120),
    new Date(2026, 9, 28, 11, 0),
  ),
  "completed",
  "in_progress at end → completed",
);
assert.equal(
  resolveClientBookingDisplayStatus(
    record("in_progress", day, "9:00 AM"),
    new Date(2026, 9, 28, 8, 0),
  ),
  "confirmed",
  "future in_progress never shows completed",
);
assert.equal(
  resolveClientBookingDisplayStatus(
    record("requested", day, "9:00 AM"),
    new Date(2026, 9, 28, 10, 0),
  ),
  "requested",
  "BR stays until Accept",
);

assert.equal(
  listTabForClientBooking(
    record("confirmed", day, "9:00 AM"),
    new Date(2026, 9, 28, 8, 0),
  ),
  "upcoming",
);
assert.equal(
  listTabForClientBooking(
    record("confirmed", day, "9:00 AM"),
    new Date(2026, 9, 28, 9, 30),
  ),
  "ongoing",
);
assert.equal(
  listTabForClientBooking(
    record("confirmed", day, "9:00 AM"),
    new Date(2026, 9, 28, 10, 1),
  ),
  "past",
);

console.log("clientBookingRecords.schedule.test.ts: ok");
