/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingResponseStatus.test.ts
 */
import assert from "node:assert/strict";
import { resolveBookingResponseIndicators } from "./bookingResponseStatus";

const base = {
  id: "b1",
  bookingScenario: "BR" as const,
  status: "Requested" as const,
  date: "2099-06-01",
  start: "10:00",
  details: {
    responseStartedAt: new Date().toISOString(),
    respondBy: new Date(Date.now() + 60 * 60_000).toISOString(),
    responseWindowMinutes: 60,
  },
};

const waiting = resolveBookingResponseIndicators(base);
assert.ok(
  waiting.includes("response_time_active"),
  "active window → response_time_active (alarm)",
);
assert.ok(
  !waiting.includes("overdue_response"),
  "active window must not use overdue triangle",
);

const overdue = resolveBookingResponseIndicators({
  ...base,
  details: {
    responseStartedAt: "2020-01-01T00:00:00.000Z",
    respondBy: "2020-01-01T01:00:00.000Z",
    responseWindowMinutes: 60,
  },
});
assert.ok(
  overdue.includes("overdue_response"),
  "expired window → overdue_response (triangle)",
);
assert.ok(
  !overdue.includes("response_time_active"),
  "expired window must not use waiting alarm",
);

console.log("bookingResponseStatus.test.ts: ok");
