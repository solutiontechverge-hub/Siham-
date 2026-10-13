/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/finance/setting/stripeSettingsOnboardingView.test.ts
 */
import assert from "node:assert/strict";
import { stripeSettingsOnboardingView } from "./stripeSettingsOnboardingView";

const notConnected = stripeSettingsOnboardingView("NOT_CONNECTED");
assert.equal(notConnected.ctaLabel, "Start onboarding");
assert.equal(notConnected.panel, "expectations");
assert.equal(notConnected.statusLabel, "Not connected");
assert.equal(notConnected.paymentsConnected, false);

const incomplete = stripeSettingsOnboardingView("INCOMPLETE");
assert.equal(incomplete.ctaLabel, "Complete onboarding");
assert.equal(incomplete.panel, "expectations");
assert.equal(incomplete.statusLabel, "Started — incomplete");
assert.equal(incomplete.paymentsConnected, false);

const connected = stripeSettingsOnboardingView("CONNECTED");
assert.equal(connected.ctaLabel, "Stripe dashboard");
assert.equal(connected.panel, "connected");
assert.equal(connected.statusLabel, "Connected");
assert.equal(connected.paymentsConnected, true);

// Section order is enforced in the view (Payout → Account management) when panel === "connected".
assert.notEqual(connected.panel, "expectations");

console.log("stripeSettingsOnboardingView.test.ts: ok");
