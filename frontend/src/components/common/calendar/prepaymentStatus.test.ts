/**
 * Run with: npx --yes tsx src/components/common/calendar/prepaymentStatus.test.ts
 */
import assert from "node:assert/strict";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";

assert.equal(
  resolveCalendarPrepaymentStatus({
    status: "Confirmed",
    details: { showPrepayment: true, prepaymentStatus: "confirmed" },
  }),
  "confirmed",
);

// Paid status alone is enough when showPrepayment flag is missing from notes.
assert.equal(
  resolveCalendarPrepaymentStatus({
    status: "Confirmed",
    details: { prepaymentStatus: "confirmed" },
  }),
  "confirmed",
);

assert.equal(
  resolveCalendarPrepaymentStatus({
    status: "Confirmed",
    details: {},
  }),
  undefined,
);

assert.equal(
  resolveCalendarPrepaymentStatus({
    status: "Confirmed",
    details: { showPrepayment: true },
  }),
  "pending",
);

console.log("prepaymentStatus.test.ts: all assertions passed");
