import assert from "node:assert/strict";
import {
  resolveEffectiveRespondByMs,
  responseDeadlineAtFromNotes,
} from "./bookingResponseWindow.js";

assert.equal(responseDeadlineAtFromNotes(null), null);
assert.equal(responseDeadlineAtFromNotes("plain note"), null);
assert.equal(
  responseDeadlineAtFromNotes(
    '---mollure-meta---\n{"respondBy":"2026-09-28T15:09:04.650Z"}',
  ),
  "2026-09-28T15:09:04.650Z",
);

// Frozen respondBy wins over startedAt + live window.
const frozen = Date.parse("2026-01-01T12:30:00.000Z");
assert.equal(
  resolveEffectiveRespondByMs(
    {
      responseStartedAt: "2026-01-01T12:00:00.000Z",
      respondBy: "2026-01-01T12:30:00.000Z",
      responseWindowMinutes: 30,
    },
    60,
  ),
  frozen,
);

console.log("bookingResponseWindow.test.js: ok");
