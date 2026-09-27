/**
 * Run with: npx --yes tsx src/components/common/calendar/buildSalesOverviewCards.helpers.test.ts
 */
import assert from "node:assert/strict";
import {
  buildCancellationFeeInvoiceMetaLines,
  mergeAddonRecordsIntoCards,
  resolveProtectiveFeeSalesCardSpec,
  shouldShowAfterTreatmentCard,
} from "./buildSalesOverviewCards.helpers";
import type { SalesAddonRecord, SalesOverviewCardData } from "./salesOverview.types";

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

const kmFee = resolveProtectiveFeeSalesCardSpec({
  status: "Cancelled",
  showLateCancellation: true,
  lateCancellationFeePercent: 50,
  lineSubtotal: 100,
  extrasAmount: 20,
});
assert.equal(kmFee?.feeAmount, 60, "km extras enter cancellation fee base");

const baseCard: SalesOverviewCardData = {
  id: "b1-after-treatment",
  bookingId: "b1",
  bookingCode: "BK1",
  kind: "after_treatment",
  title: "After treatment Summary",
  clientName: "aliza",
  lines: [
    { id: "s1", label: "hair dye", amount: 44 },
    { id: "kilometer-allowance", label: "Kilometer Allowance", amount: 20 },
  ],
  total: 64,
  highlightLabel: "Payment",
  highlightAmount: 64,
  showAddOns: true,
  occurredAt: "2026-09-28T00:00:00.000Z",
};

const addon: SalesAddonRecord = {
  id: "a1",
  bookingId: "b1",
  bookingCode: "BK1",
  clientName: "aliza",
  lines: [
    {
      id: "l1",
      kind: "item",
      name: "Eye Lashes",
      quantity: 1,
      unitPrice: 50,
    },
  ],
  discount: null,
  discountAmount: 0,
  totalPrice: 50,
  paymentMethod: "onlineDirect",
  createdAt: "2026-09-28T01:00:00.000Z",
};

const merged = mergeAddonRecordsIntoCards([baseCard], [addon], {
  financeHints: [],
});
assert.equal(merged.length, 1, "addons merge into prior summary — no separate card");
assert.ok(
  merged[0].lines.some((line) => line.label === "Eye Lashes"),
  "addon line appears on prior card",
);
assert.ok(
  merged[0].lines.some((line) => line.id === "kilometer-allowance"),
  "km line preserved after merge",
);
assert.equal(merged[0].total, 114);
assert.equal(merged[0].highlightAmount, 114);

console.log("buildSalesOverviewCards.helpers.test.ts: all assertions passed");
