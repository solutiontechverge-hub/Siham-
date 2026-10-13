/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingGroupAddOns.test.ts
 */
import assert from "node:assert/strict";
import {
  canAddKilometerAllowance,
  canAddLateCancellation,
  canAddLateRescheduling,
  canAddNoShowFee,
  canAddPrepayment,
  canCheckoutProtectiveFee,
  canRestoreKilometerAllowance,
  canRestoreLateCancellation,
  canRestoreLateRescheduling,
  canRestoreNoShowFee,
  clampProtectiveFeePercent,
  isPolicyFeeConfigured,
} from "./bookingGroupAddOns";
import { buildProtectiveFeeActivation } from "./bookingFeeTriggers";

assert.equal(isPolicyFeeConfigured(null), false);
assert.equal(isPolicyFeeConfigured(0), false);
assert.equal(isPolicyFeeConfigured("50"), true);

assert.equal(canAddPrepayment({}), true);
assert.equal(canAddPrepayment({ alreadyShown: true }), false);
assert.equal(canAddPrepayment({ alreadyPaid: true }), false);
assert.equal(
  canAddPrepayment({ alreadyShown: false, alreadyPaid: true }),
  false,
);

assert.equal(
  canAddLateCancellation({
    policyPercent: 20,
    status: "Confirmed",
  }),
  false,
);
assert.equal(
  canAddLateCancellation({
    policyPercent: 20,
    status: "Cancelled",
  }),
  true,
);
assert.equal(
  canAddLateCancellation({
    policyPercent: 20,
    status: "Confirmed",
    cancelledServiceIds: ["svc-1"],
  }),
  true,
);
assert.equal(
  canAddLateCancellation({
    policyPercent: 0,
    status: "Cancelled",
  }),
  false,
);
assert.equal(
  canAddLateCancellation({
    policyPercent: 20,
    status: "Cancelled",
    alreadyShown: true,
  }),
  false,
);
assert.equal(
  canAddLateCancellation({
    policyPercent: 20,
    status: "Cancelled",
    appointmentStartMs: Date.parse("2026-10-15T12:00:00Z"),
    noticeHours: 24,
    nowMs: Date.parse("2026-10-13T12:00:00Z"),
  }),
  false,
  "within cancellation notice → no add",
);

assert.equal(
  canAddLateRescheduling({
    policyPercent: 15,
    scheduleEdited: true,
  }),
  true,
);
assert.equal(
  canAddLateRescheduling({
    policyPercent: 15,
    scheduleEdited: false,
  }),
  false,
);

assert.equal(
  canAddNoShowFee({ policyPercent: 30, status: "No Show" }),
  true,
);
assert.equal(
  canAddNoShowFee({ policyPercent: 30, status: "Cancelled" }),
  false,
);

assert.equal(canAddKilometerAllowance({ location: "DL" }), true);
assert.equal(canAddKilometerAllowance({ location: "FL" }), false);

// --- Restore after remove (alreadyShown false) while trigger still active ---
const lateCancelRestoreCtx = {
  policyPercent: 20,
  status: "Cancelled" as const,
  appointmentStartMs: Date.parse("2026-10-13T14:00:00Z"),
  noticeHours: 24,
  nowMs: Date.parse("2026-10-13T12:00:00Z"),
};
assert.equal(
  canRestoreLateCancellation({ ...lateCancelRestoreCtx, alreadyShown: true }),
  false,
  "shown → no restore action",
);
assert.equal(
  canRestoreLateCancellation({ ...lateCancelRestoreCtx, alreadyShown: false }),
  true,
  "removed + late cancel still active → restore",
);
assert.equal(
  canRestoreLateCancellation({
    ...lateCancelRestoreCtx,
    alreadyShown: false,
    status: "Confirmed",
  }),
  false,
  "removed but trigger cleared → blocked",
);
assert.equal(
  canRestoreLateRescheduling({
    policyPercent: 15,
    scheduleEdited: true,
    alreadyShown: false,
  }),
  true,
);
assert.equal(
  canRestoreLateRescheduling({
    policyPercent: 15,
    scheduleEdited: false,
    alreadyShown: false,
  }),
  false,
  "removed but scheduleEdited cleared → blocked",
);
assert.equal(
  canRestoreNoShowFee({
    policyPercent: 30,
    status: "No Show",
    alreadyShown: false,
  }),
  true,
);
assert.equal(
  canRestoreNoShowFee({
    policyPercent: 30,
    status: "Confirmed",
    alreadyShown: false,
  }),
  false,
);
// KM: manual restore/add for DL negotiated location only
assert.equal(
  canRestoreKilometerAllowance({ location: "DL", alreadyShown: false }),
  true,
);
assert.equal(
  canRestoreKilometerAllowance({ location: "DL", alreadyShown: true }),
  false,
);
assert.equal(
  canRestoreKilometerAllowance({ location: "FL", alreadyShown: false }),
  false,
);
const restored = buildProtectiveFeeActivation(25, { kind: "lateCancellation" });
assert.ok(restored);
assert.equal(restored?.percent, "25", "restore reapplies template cap");
assert.equal(restored?.ceiling, "25");

assert.equal(clampProtectiveFeePercent("40", 25), "25");
assert.equal(clampProtectiveFeePercent("10", 25), "10");
assert.equal(clampProtectiveFeePercent("0", 25), "0");
assert.equal(clampProtectiveFeePercent("", 25), "");

assert.equal(
  canCheckoutProtectiveFee({
    status: "Cancelled",
    showLateCancellation: true,
    lateCancellationFeeAmount: 12,
  }),
  true,
);
assert.equal(
  canCheckoutProtectiveFee({
    status: "Cancelled",
    showLateCancellation: true,
    lateCancellationFeeAmount: 0,
  }),
  false,
);
assert.equal(
  canCheckoutProtectiveFee({
    status: "No Show",
    showNoShowFee: true,
    noShowFeeAmount: 8,
  }),
  true,
);

console.log("bookingGroupAddOns.test.ts: all assertions passed");
