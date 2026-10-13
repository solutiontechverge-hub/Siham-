/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/finance/stripePayoutGuard.test.ts
 */
import assert from "node:assert/strict";
import {
  isStripePayoutReady,
  stripePayoutGuardDecision,
  stripePayoutInterceptCopy,
} from "./stripePayoutGuard";

assert.deepEqual(stripePayoutGuardDecision("CONNECTED"), { action: "proceed" });
assert.equal(isStripePayoutReady("CONNECTED"), true);

assert.deepEqual(stripePayoutGuardDecision("NOT_CONNECTED"), {
  action: "intercept",
  incomplete: false,
});
assert.equal(isStripePayoutReady("NOT_CONNECTED"), false);

assert.deepEqual(stripePayoutGuardDecision("INCOMPLETE"), {
  action: "intercept",
  incomplete: true,
});
assert.equal(isStripePayoutReady("INCOMPLETE"), false);

const notConnectedCopy = stripePayoutInterceptCopy(false);
assert.match(notConnectedCopy.title, /Connect Stripe/i);
assert.match(notConnectedCopy.confirmLabel, /settings/i);

const incompleteCopy = stripePayoutInterceptCopy(true);
assert.match(incompleteCopy.title, /Complete/i);
assert.match(incompleteCopy.confirmLabel, /Continue/i);

console.log("stripePayoutGuard.test.ts: ok");
