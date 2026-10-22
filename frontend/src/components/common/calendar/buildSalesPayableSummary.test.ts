/**
 * Run with: npx --yes tsx src/components/common/calendar/buildSalesPayableSummary.test.ts
 */
import assert from "node:assert/strict";
import type { BookingFinanceViewModel } from "../booking-finance/bookingFinance.types";
import { buildSalesPayableSummary } from "./buildSalesPayableSummary";

const baseFinance = {
  bookingId: "b1",
  basePrice: 100,
  addOnsTotal: 50,
  addOnLines: [],
  cancellationFee: 20,
  discounts: 0,
  subtotal: 150,
  netTotal: 170,
  totalPaid: 40,
  prepaymentTotal: 40,
  paymentTotal: 0,
  prepaidRefunded: 40,
  netPrepaymentCredit: 0,
  totalRefunded: 40,
  amountDue: 170,
  badge: "PARTIALLY_PAID",
  paymentStatusRaw: "PartiallyPaid",
  bookingStatus: "confirmed",
  breakdownRows: [],
  financials: {},
  ledger: [
    {
      id: "1",
      type: "CANCELLATION_FEE",
      amount: 20,
      status: "completed",
      metadata: { reason: "late_cancellation" },
    },
    {
      id: "2",
      type: "CANCELLATION_FEE",
      amount: 15,
      status: "completed",
      metadata: { reason: "late_reschedule" },
    },
  ],
} satisfies BookingFinanceViewModel;

const summary = buildSalesPayableSummary(baseFinance);
assert.ok(summary, "summary exists");
assert.equal(summary!.payable, 170);
assert.ok(summary!.lines.some((l) => l.label === "Services" && l.amount === 100));
assert.ok(summary!.lines.some((l) => l.label === "Add-ons" && l.amount === 50));
assert.ok(
  summary!.lines.some((l) => l.label === "Cancellation Fee" && l.amount === 20),
);
assert.ok(
  summary!.lines.some((l) => l.label === "Reschedule Fee" && l.amount === 15),
);
assert.ok(
  summary!.lines.some((l) => l.id === "charges-total" && l.amount === 185),
  "charges total = services+addons+fees",
);
// Full prepaid refunded → no credit line (and never +40 charge on top of services).
assert.ok(
  !summary!.lines.some((l) => l.id === "prepayment-credit"),
  "full refund → no prepay credit line",
);
assert.ok(
  !summary!.lines.some((l) => l.id === "refunded-due"),
  "must not add refund as a charge (inflates payable)",
);
assert.ok(
  !summary!.lines.some((l) => l.label === "Paid"),
  "legacy Paid label removed",
);

// Partial prepaid refund: 58.25 paid, 55.98 refunded → net credit 2.27
const partial = buildSalesPayableSummary({
  ...baseFinance,
  basePrice: 233,
  addOnsTotal: 111,
  cancellationFee: 0,
  prepaymentTotal: 58.25,
  totalPaid: 58.25,
  prepaidRefunded: 55.98,
  netPrepaymentCredit: 2.27,
  totalRefunded: 55.98,
  amountDue: 341.73,
  ledger: [],
});
assert.ok(partial);
assert.equal(
  partial!.lines.find((l) => l.id === "prepayment-credit")?.amount,
  -2.27,
);
assert.ok(!partial!.lines.some((l) => l.id === "refunded-due"));
assert.equal(
  partial!.lines.find((l) => l.id === "charges-total")?.amount,
  344,
);

assert.equal(buildSalesPayableSummary(null), null);
console.log("buildSalesPayableSummary.test.ts: all assertions passed");
