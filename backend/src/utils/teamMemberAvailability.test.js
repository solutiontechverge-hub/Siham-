/**
 * Run with: node src/utils/teamMemberAvailability.test.js
 */
import assert from "node:assert/strict";
import {
  intervalsOverlap,
  wallClockDateFromValue,
  wallClockTimeToMinutes,
} from "./teamMemberAvailability.js";

assert.equal(wallClockTimeToMinutes("2026-10-15T09:00:00"), 9 * 60);
assert.equal(wallClockTimeToMinutes("2026-10-15T09:30:00.000Z"), 9 * 60 + 30);
assert.equal(wallClockTimeToMinutes("2026-10-15 09:15:00"), 9 * 60 + 15);
assert.equal(wallClockTimeToMinutes("09:45"), 9 * 60 + 45);
assert.equal(wallClockTimeToMinutes(null), null);

// pg now returns timestamptz as strings; Date path still accepts local wall-clock.
const local = new Date(2026, 9, 15, 9, 30, 0);
assert.equal(wallClockTimeToMinutes(local), 9 * 60 + 30);
assert.equal(wallClockDateFromValue(local), "2026-10-15");
assert.equal(
  wallClockTimeToMinutes("2026-10-15T09:00:00.000Z"),
  9 * 60,
  "ISO string wall-clock (not local-shifted Date)",
);

assert.equal(
  intervalsOverlap(
    { startMin: 9 * 60, endMin: 9 * 60 + 30 },
    { startMin: 9 * 60 + 15, endMin: 10 * 60 },
  ),
  true,
);
assert.equal(
  intervalsOverlap(
    { startMin: 9 * 60, endMin: 9 * 60 + 30 },
    { startMin: 9 * 60 + 30, endMin: 10 * 60 },
  ),
  false,
);

console.log("teamMemberAvailability.test.js: ok");
