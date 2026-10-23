/**
 * Run with: npx --yes tsx src/app/clients/booking/booking-time.test.ts
 */
import assert from "node:assert/strict";
import {
  formatServiceTimeRange,
  recalculateServiceStartEndTimes,
} from "../../../data/bookingServiceEdit.data";
import {
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "./booking-time";

assert.equal(parseTimeLabelToMinutes("9:30 AM"), 9 * 60 + 30);
assert.equal(parseTimeLabelToMinutes("09:30"), 9 * 60 + 30, "HH:mm must not collapse to midnight");
assert.equal(parseTimeLabelToMinutes("09:45"), 9 * 60 + 45);

const sequential = recalculateServiceStartEndTimes(
  [
    { id: "hair", name: "hair dye", price: 44, durationMins: 15 },
    { id: "buzz", name: "buzz cutt", price: 44, durationMins: 15 },
  ],
  "09:30",
);

assert.equal(
  formatServiceTimeRange(sequential[0]?.startTime, sequential[0]?.endTime),
  "09:30–09:45",
);
assert.equal(
  formatServiceTimeRange(sequential[1]?.startTime, sequential[1]?.endTime),
  "09:45–10:00",
);

// Client service-card path: parse stored HH:mm then format as AM/PM range.
assert.equal(
  serviceTimeRangeLabel(
    parseTimeLabelToMinutes(sequential[0]!.startTime!),
    sequential[0]!.durationMins,
  ),
  "9:30 AM–9:45 AM",
);
assert.equal(
  serviceTimeRangeLabel(
    parseTimeLabelToMinutes(sequential[1]!.startTime!),
    sequential[1]!.durationMins,
  ),
  "9:45 AM–10:00 AM",
);

console.log("booking-time.test.ts: ok");
