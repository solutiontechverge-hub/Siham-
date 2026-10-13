/**
 * Run with: node src/utils/stripeOnboardingStatus.test.js
 */
import assert from "node:assert/strict";
import {
  STRIPE_ONBOARDING,
  resolveStripeOnboardingStatus,
  toDbStripeConnectStatus,
  fromDbStripeConnectStatus,
  fetchStripeOnboardingStatus,
} from "./stripeOnboardingStatus.js";

// --- resolve: 3 states ---

assert.equal(
  resolveStripeOnboardingStatus(null, null),
  STRIPE_ONBOARDING.NOT_CONNECTED,
);
assert.equal(
  resolveStripeOnboardingStatus(undefined, undefined),
  STRIPE_ONBOARDING.NOT_CONNECTED,
);
assert.equal(
  resolveStripeOnboardingStatus("", null),
  STRIPE_ONBOARDING.NOT_CONNECTED,
);

assert.equal(
  resolveStripeOnboardingStatus("acct_partial", null),
  STRIPE_ONBOARDING.INCOMPLETE,
);
assert.equal(
  resolveStripeOnboardingStatus("acct_partial", {
    details_submitted: false,
    payouts_enabled: false,
    charges_enabled: false,
  }),
  STRIPE_ONBOARDING.INCOMPLETE,
);
assert.equal(
  resolveStripeOnboardingStatus("acct_partial", {
    details_submitted: true,
    payouts_enabled: false,
    charges_enabled: true,
  }),
  STRIPE_ONBOARDING.INCOMPLETE,
);
assert.equal(
  resolveStripeOnboardingStatus("acct_partial", {
    details_submitted: false,
    payouts_enabled: true,
    charges_enabled: true,
  }),
  STRIPE_ONBOARDING.INCOMPLETE,
);

assert.equal(
  resolveStripeOnboardingStatus("acct_ok", {
    details_submitted: true,
    payouts_enabled: true,
    charges_enabled: true,
  }),
  STRIPE_ONBOARDING.CONNECTED,
);

// --- DB mapping (onboarding ≡ INCOMPLETE) ---

assert.equal(toDbStripeConnectStatus(STRIPE_ONBOARDING.NOT_CONNECTED), "not_connected");
assert.equal(toDbStripeConnectStatus(STRIPE_ONBOARDING.INCOMPLETE), "onboarding");
assert.equal(toDbStripeConnectStatus(STRIPE_ONBOARDING.CONNECTED), "connected");
assert.equal(fromDbStripeConnectStatus("onboarding"), STRIPE_ONBOARDING.INCOMPLETE);
assert.equal(fromDbStripeConnectStatus("connected"), STRIPE_ONBOARDING.CONNECTED);
assert.equal(fromDbStripeConnectStatus("not_connected"), STRIPE_ONBOARDING.NOT_CONNECTED);

// --- fetchStripeOnboardingStatus (mocked retrieve) ---

{
  const r = await fetchStripeOnboardingStatus({}, null);
  assert.equal(r.status, STRIPE_ONBOARDING.NOT_CONNECTED);
  assert.equal(r.detailsSubmitted, false);
  assert.equal(r.payoutsEnabled, false);
}

{
  const stripe = {
    accounts: {
      retrieve: async () => ({
        details_submitted: true,
        payouts_enabled: false,
        charges_enabled: true,
      }),
    },
  };
  const r = await fetchStripeOnboardingStatus(stripe, "acct_incomplete");
  assert.equal(r.status, STRIPE_ONBOARDING.INCOMPLETE);
  assert.equal(r.detailsSubmitted, true);
  assert.equal(r.payoutsEnabled, false);
  assert.equal(r.chargesEnabled, true);
}

{
  const stripe = {
    accounts: {
      retrieve: async () => ({
        details_submitted: true,
        payouts_enabled: true,
        charges_enabled: true,
      }),
    },
  };
  const r = await fetchStripeOnboardingStatus(stripe, "acct_live");
  assert.equal(r.status, STRIPE_ONBOARDING.CONNECTED);
  assert.equal(r.detailsSubmitted, true);
  assert.equal(r.payoutsEnabled, true);
}

{
  // no stripe client + account id → INCOMPLETE (resume existing, don't invent NOT_CONNECTED)
  const r = await fetchStripeOnboardingStatus(null, "acct_stored");
  assert.equal(r.status, STRIPE_ONBOARDING.INCOMPLETE);
}

{
  const stripe = {
    accounts: {
      retrieve: async () => {
        throw new Error("No such account");
      },
    },
  };
  const r = await fetchStripeOnboardingStatus(stripe, "acct_gone");
  assert.equal(r.status, STRIPE_ONBOARDING.INCOMPLETE);
}

console.log("stripeOnboardingStatus.test.js: ok");
