/**
 * Run with: npx --yes tsx src/components/common/calendar/buildSalesOverviewCards.helpers.test.ts
 */
import assert from "node:assert/strict";
import {
  buildCancellationFeeInvoiceMetaLines,
  resolveProtectiveFeeSalesCardSpec,
  shouldShowAfterTreatmentCard,
} from "./buildSalesOverviewCards.helpers";

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: false,
    ended: true,
  }),
  false,
  "prepaid + clock ended alone must hide after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: true,
    isCompleted: false,
    ended: true,
  }),
  true,
  "prepaid + in progress shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: true,
    ended: true,
  }),
  true,
  "prepaid + completed shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: false,
    isInProgress: false,
    isCompleted: false,
    ended: true,
  }),
  true,
  "no prepay + ended still shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: false,
    ended: false,
    hasCollectedAfterTreatment: true,
  }),
  true,
  "already-collected after-treatment stays visible",
);

assert.equal(
  resolveProtectiveFeeSalesCardSpec({
    status: "Cancelled",
    showLateCancellation: false,
    lateCancellationFeePercent: 50,
    lineSubtotal: 100,
  }),
  null,
  "plain cancel without fee section yields no invoice",
);

const feeCard = resolveProtectiveFeeSalesCardSpec({
  status: "Cancelled",
  showLateCancellation: true,
  lateCancellationFeePercent: 50,
  lineSubtotal: 100,
  cancellationFeeAt: "2026-09-23T10:00:00.000Z",
  exceededCancellationWindow: true,
});
assert.ok(feeCard, "cancelled + active late fee builds invoice spec");
assert.equal(feeCard?.feeLabel, "Cancellation fee");
assert.equal(feeCard?.feeAmount, 50);
assert.equal(feeCard?.title, "Cancellation Fee Invoice");
assert.ok(
  feeCard?.metaLines.some((line) => line.startsWith("Cancellation time:")),
  "stamps cancellation time",
);
assert.ok(
  feeCard?.metaLines.includes("Breached preset cancellation window"),
  "stamps window breach",
);

const within = buildCancellationFeeInvoiceMetaLines({
  cancellationFeeAt: "2026-09-23T10:00:00.000Z",
  exceededCancellationWindow: false,
});
assert.ok(within.includes("Within preset cancellation window"));

console.log("buildSalesOverviewCards.helpers.test.ts: all assertions passed");
