/**
 * Run with: npx --yes tsx src/components/common/booking-finance/mapBookingFinance.test.ts
 */
import assert from "node:assert/strict";
import {
  bookingFinanceBadgeLabel,
  deriveBookingFinanceBadge,
  mapBookingFinanceResponse,
} from "./mapBookingFinance";

assert.equal(
  deriveBookingFinanceBadge({
    paymentStatus: "Paid",
    totalPaid: 100,
    amountDue: 0,
    netTotal: 100,
  }),
  "PAID",
);

assert.equal(
  deriveBookingFinanceBadge({
    paymentStatus: "Pending",
    totalPaid: 40,
    amountDue: 60,
    netTotal: 100,
  }),
  "PARTIALLY_PAID",
);

assert.equal(
  deriveBookingFinanceBadge({
    paymentStatus: "Unpaid",
    totalPaid: 0,
    amountDue: 100,
    netTotal: 100,
  }),
  "UNPAID",
);

assert.equal(
  deriveBookingFinanceBadge({
    bookingStatus: "cancelled",
    cancellationPaymentStatus: "PARTIALLY_REFUNDED",
    totalPaid: 58,
    totalRefunded: 12,
    amountDue: 0,
    netTotal: 46,
  }),
  "PARTIALLY_REFUNDED",
);

assert.equal(bookingFinanceBadgeLabel("PARTIALLY_PAID"), "Partially Paid");

const mapped = mapBookingFinanceResponse({
  bookingId: "b1",
  uniqueCode: "CODE",
  financials: {
    basePrice: 200,
    add_ons: 25,
    cancellation_fee: 10,
    total_paid: 100,
    prepayment_total: 80,
    payment_total: 20,
    prepaid_refunded: 0,
    net_prepayment_credit: 80,
    total_refunded: 0,
    net_total: 235,
    outstanding_balance: 135,
    payment_status: "Pending",
  },
  ledger: [
    {
      id: "a1",
      type: "ADD_ON",
      amount: 25,
      status: "completed",
      metadata: { name: "Extra wax" },
    },
  ],
});

assert.equal(mapped.badge, "PARTIALLY_PAID");
assert.equal(mapped.netPrepaymentCredit, 80);
assert.equal(mapped.prepaidRefunded, 0);
assert.equal(mapped.addOnLines[0]?.label, "Extra wax");
assert.ok(mapped.breakdownRows.some((r) => r.id === "amount-due" && r.amount === 135));

console.log("mapBookingFinance.test.ts: ok");
