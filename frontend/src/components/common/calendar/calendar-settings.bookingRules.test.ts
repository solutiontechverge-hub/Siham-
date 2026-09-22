/**
 * Run with: npx --yes tsx src/components/common/calendar/calendar-settings.bookingRules.test.ts
 */
import assert from "node:assert/strict";
import {
  DL_INTERVAL_MIN_MINUTES,
  clampDesiredLocationInterval,
  defaultBookingRules,
  withClampedDesiredLocationInterval,
} from "./calendar-settings.types";

const defaults = defaultBookingRules();
assert.equal(defaults.flIntervalHours, "0");
assert.equal(defaults.flIntervalMinutes, "0");
assert.equal(defaults.dlIntervalHours, "0");
assert.equal(defaults.dlIntervalMinutes, "5");
assert.equal(defaults.dlMinTimeslotHours, "");
assert.equal(defaults.dlMinTimeslotMinutes, "");
assert.equal(DL_INTERVAL_MIN_MINUTES, 5);

assert.deepEqual(clampDesiredLocationInterval("0", "5"), {
  hours: "0",
  minutes: "5",
});
assert.deepEqual(clampDesiredLocationInterval("0", "4"), {
  hours: "0",
  minutes: "5",
});
assert.deepEqual(clampDesiredLocationInterval("", ""), {
  hours: "0",
  minutes: "5",
});
assert.deepEqual(clampDesiredLocationInterval("1", "0"), {
  hours: "1",
  minutes: "0",
});

const belowFloor = withClampedDesiredLocationInterval({
  ...defaults,
  dlIntervalHours: "0",
  dlIntervalMinutes: "2",
  dlMinTimeslotHours: "",
  dlMinTimeslotMinutes: "",
});
assert.equal(belowFloor.dlIntervalMinutes, "5");
assert.equal(belowFloor.dlMinTimeslotHours, "");
assert.equal(belowFloor.dlMinTimeslotMinutes, "");

const emptyTimeslotKept = withClampedDesiredLocationInterval({
  ...defaults,
  dlMinTimeslotHours: "",
  dlMinTimeslotMinutes: "",
});
assert.equal(emptyTimeslotKept.dlMinTimeslotHours, "");
assert.equal(emptyTimeslotKept.dlMinTimeslotMinutes, "");

console.log("calendar-settings.bookingRules.test.ts: ok");
