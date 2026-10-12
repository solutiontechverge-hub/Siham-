import assert from "node:assert/strict";
import {
  addOneCalendarMonth,
  isPastRenewal,
  needsNewPeriodCharge,
} from "./subscription-lifecycle.service.js";

const jan31 = new Date(Date.UTC(2026, 0, 31, 12, 0, 0));
const feb = addOneCalendarMonth(jan31);
assert.equal(feb.getUTCMonth(), 1, "Jan 31 + 1 month lands in February");
assert.ok(feb.getUTCDate() <= 29, "Feb day clamped");

const mar15 = new Date(Date.UTC(2026, 2, 15, 8, 0, 0));
const apr15 = addOneCalendarMonth(mar15);
assert.equal(apr15.getUTCDate(), 15);
assert.equal(apr15.getUTCMonth(), 3);

assert.equal(isPastRenewal(null), false);
assert.equal(isPastRenewal(new Date(Date.UTC(2020, 0, 1)), new Date(Date.UTC(2026, 0, 1))), true);
assert.equal(isPastRenewal(new Date(Date.UTC(2030, 0, 1)), new Date(Date.UTC(2026, 0, 1))), false);

const now = new Date(Date.UTC(2026, 5, 14, 12, 0, 0));
assert.equal(needsNewPeriodCharge(null, now), true, "no period → charge");
assert.equal(
  needsNewPeriodCharge(new Date(Date.UTC(2026, 5, 12, 12, 0, 0)), now),
  true,
  "renews_at already passed → charge",
);
assert.equal(
  needsNewPeriodCharge(new Date(Date.UTC(2026, 6, 12, 12, 0, 0)), now),
  false,
  "still before renews_at → free reactivate",
);
assert.equal(
  needsNewPeriodCharge(now, now),
  true,
  "renews_at === now → treat as due / charge",
);

console.log("subscription-lifecycle.service.test.js: ok");
