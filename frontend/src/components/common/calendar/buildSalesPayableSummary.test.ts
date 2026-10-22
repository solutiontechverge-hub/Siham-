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

// Cancelled: drop services; payable = fees − prepaid credit only.
const cancelled = buildSalesPayableSummary({
  ...baseFinance,
  basePrice: 111,
  addOnsTotal: 0,
  cancellationFee: 11.32,
  prepaymentTotal: 11.1,
  totalPaid: 11.1,
  prepaidRefunded: 0,
  netPrepaymentCredit: 11.1,
  totalRefunded: 0,
  amountDue: 111.22,
  bookingStatus: "cancelled",
  badge: "PENDING_FEE",
  ledger: [
    {
      id: "1",
      type: "CANCELLATION_FEE",
      amount: 11.32,
      status: "completed",
      metadata: { reason: "late_cancellation" },
    },
  ],
});
assert.ok(cancelled);
assert.ok(!cancelled!.lines.some((l) => l.id === "services"), "no services after cancel");
assert.ok(
  cancelled!.lines.some((l) => l.label === "Cancellation Fee" && l.amount === 11.32),
);
assert.equal(cancelled!.payable, 0.22, "due = fee − prepaid only");

const earlyCancel = buildSalesPayableSummary({
  ...baseFinance,
  basePrice: 111,
  addOnsTotal: 0,
  cancellationFee: 0,
  amountDue: 99.9,
  bookingStatus: "cancelled",
  badge: "REFUNDED",
  ledger: [],
  netPrepaymentCredit: 0,
  prepaymentTotal: 11.1,
  totalPaid: 11.1,
  prepaidRefunded: 11.1,
  totalRefunded: 11.1,
});
assert.equal(
  earlyCancel,
  null,
  "early cancel: no services/fees → no payable footer",
);

console.log("buildSalesPayableSummary.test.ts: all assertions passed");
