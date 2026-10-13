/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingFeeTriggers.test.ts
 */
import assert from "node:assert/strict";
import {
  buildProtectiveFeeActivation,
  canTriggerKilometerAllowance,
  enforceProtectiveFeeCap,
  shouldTriggerLateCancellationFee,
  shouldTriggerLateRescheduleFee,
  shouldTriggerNoShowFee,
} from "./bookingFeeTriggers";

const hour = 60 * 60 * 1000;
const now = Date.parse("2026-10-13T12:00:00Z");
const startInTwoHours = now + 2 * hour;
const startInTwoDays = now + 48 * hour;

// --- Late cancellation: template + cancel + outside notice ---
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 20,
    status: "Cancelled",
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  true,
);
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 20,
    status: "Cancelled",
    appointmentStartMs: startInTwoDays,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
  "within notice window → no late-cancel fee",
);
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: null,
    status: "Cancelled",
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
  "not in template → cannot trigger",
);
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 20,
    status: "Confirmed",
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
);
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 20,
    status: "Confirmed",
    cancelledServiceIds: ["svc-1"],
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  true,
);
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 20,
    status: "Cancelled",
    alreadyShown: true,
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
);
// Offline / on-behalf: same rules (no actor gate)
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 15,
    status: "Cancelled",
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    noticeMinutes: 0,
    nowMs: now,
  }),
  true,
);

// --- Late reschedule ---
assert.equal(
  shouldTriggerLateRescheduleFee({
    policyPercent: 10,
    scheduleEdited: true,
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  true,
);
assert.equal(
  shouldTriggerLateRescheduleFee({
    policyPercent: 10,
    scheduleEdited: true,
    appointmentStartMs: startInTwoDays,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
);
assert.equal(
  shouldTriggerLateRescheduleFee({
    policyPercent: 0,
    scheduleEdited: true,
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
);
assert.equal(
  shouldTriggerLateRescheduleFee({
    policyPercent: 10,
    scheduleEdited: false,
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
);

// --- No-show ---
assert.equal(
  shouldTriggerNoShowFee({ policyPercent: 50, status: "No Show" }),
  true,
);
assert.equal(
  shouldTriggerNoShowFee({ policyPercent: null, status: "No Show" }),
  false,
);
assert.equal(
  shouldTriggerNoShowFee({ policyPercent: 50, status: "Cancelled" }),
  false,
);

// --- Kilometre: DL manual, no template required ---
assert.equal(canTriggerKilometerAllowance({ location: "DL" }), true);
assert.equal(canTriggerKilometerAllowance({ location: "FL" }), false);
assert.equal(
  canTriggerKilometerAllowance({ location: "DL", alreadyShown: true }),
  false,
);
// remove → restore while DL; blocked when not DL
assert.equal(
  canTriggerKilometerAllowance({ location: "DL", alreadyShown: false }),
  true,
  "removed KM on DL → manual restore allowed",
);

// --- Restore gate: trigger still active after remove (alreadyShown false) ---
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 20,
    status: "Cancelled",
    alreadyShown: false,
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  true,
  "removed late-cancel section → restore while still late",
);
assert.equal(
  shouldTriggerLateCancellationFee({
    policyPercent: 20,
    status: "Confirmed",
    alreadyShown: false,
    appointmentStartMs: startInTwoHours,
    noticeHours: 24,
    nowMs: now,
  }),
  false,
  "removed but cancel trigger cleared → no restore",
);
assert.equal(
  shouldTriggerNoShowFee({
    policyPercent: 50,
    status: "No Show",
    alreadyShown: false,
  }),
  true,
);
assert.equal(
  shouldTriggerNoShowFee({
    policyPercent: 50,
    status: "Confirmed",
    alreadyShown: false,
  }),
  false,
);

// --- Cap / reduce-only ---
assert.equal(enforceProtectiveFeeCap("40", 25), "25");
assert.equal(enforceProtectiveFeeCap("10", 25), "10");
assert.equal(enforceProtectiveFeeCap("0", 25), "0");
assert.equal(enforceProtectiveFeeCap("", 25), "");
assert.equal(enforceProtectiveFeeCap("99", null), "0");

const activation = buildProtectiveFeeActivation(30, {
  kind: "noShow",
});
assert.ok(activation);
assert.equal(activation?.percent, "30");
assert.equal(activation?.ceiling, "30");
assert.equal(buildProtectiveFeeActivation(0), null);
assert.equal(buildProtectiveFeeActivation(null), null);

console.log("bookingFeeTriggers.test.ts: all assertions passed");
