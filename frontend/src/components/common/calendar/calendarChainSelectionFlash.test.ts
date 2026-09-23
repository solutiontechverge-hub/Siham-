/**
 * Run with: npx --yes tsx src/components/common/calendar/calendarChainSelectionFlash.test.ts
 */
import assert from "node:assert/strict";
import { bookingChainSelectionKey } from "./calendarChainSelectionFlash";

assert.equal(
  bookingChainSelectionKey({ id: "abc::segment-0", bookingCode: "BK-9" }),
  "bk-9",
);
assert.equal(
  bookingChainSelectionKey({ id: "abc::segment-1", bookingCode: "BK-9" }),
  "bk-9",
);
assert.equal(
  bookingChainSelectionKey({ id: "parent::segment-2", bookingCode: "" }),
  "parent",
);
assert.equal(
  bookingChainSelectionKey({ id: "solo-id", bookingCode: undefined }),
  "solo-id",
);

console.log("calendarChainSelectionFlash.test.ts: all assertions passed");
