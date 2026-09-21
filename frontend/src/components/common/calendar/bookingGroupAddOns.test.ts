/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingGroupAddOns.test.ts
 */
import assert from "node:assert/strict";
import {
  canAddLateCancellation,
  canAddLateRescheduling,
  canAddNoShowFee,
  canAddPrepayment,
  canCheckoutProtectiveFee,
  clampProtectiveFeePercent,
  isPolicyFeeConfigured,
} from "./bookingGroupAddOns";

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
