/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/finance/data/buildOverdueReviewHref.test.ts
 */
import assert from "node:assert/strict";
import { buildOverdueReviewHref } from "./transactions";

assert.equal(
  buildOverdueReviewHref({
    status: "Overdue",
    entryId: "OL123",
    bookingId: "uuid-1",
    date: "2026-10-13",
  }),
  "/professionals/calendar?booking=OL123&date=2026-10-13&tab=sales",
);

assert.equal(
  buildOverdueReviewHref({
    status: "Overdue response",
    entryId: null,
    bookingId: "uuid-2",
    date: "2026-10-14",
  }),
  "/professionals/calendar?booking=uuid-2&date=2026-10-14",
);

assert.equal(
  buildOverdueReviewHref({
    status: "Paid",
    entryId: "OL1",
    bookingId: "x",
    date: null,
  }),
  null,
);

assert.equal(
  buildOverdueReviewHref({
    status: "Overdue",
    entryId: "OL-only",
    bookingId: undefined,
    date: null,
  }),
  null,
);

assert.equal(
  buildOverdueReviewHref({
    status: "Payment due",
    entryId: "OL1",
    bookingId: "uuid-3",
    date: "2026-10-13",
  }),
  null,
);

console.log("buildOverdueReviewHref.test.ts: ok");
