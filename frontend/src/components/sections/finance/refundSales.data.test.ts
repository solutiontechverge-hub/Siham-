/**
 * Run with: npx --yes tsx src/components/sections/finance/refundSales.data.test.ts
 */
import assert from "node:assert/strict";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  mergeRefundSalesItems,
  refundItemsFromSaleLines,
  refundItemsFromTransactions,
} from "./refundSales.data";

function row(
  partial: Partial<TransactionRow> & {
    id: string;
    entryLabel?: string;
    lineItems?: Array<{ description: string; totalPrice: number }>;
    bookingItems?: Array<{ label: string; value: number }>;
  },
): TransactionRow {
  const { lineItems, bookingItems, ...rest } = partial;
  return {
    entryType: "onlineBooking",
    entryId: "BK-1",
    date: "2026-10-01",
    bookingId: "BK-1",
    entryLabel: partial.entryLabel ?? "Booking",
    clientName: "Ada",
    clientEmail: "a@b.c",
    clientType: "individual",
    netAmount: 0,
    methodTitle: "Online Direct",
    status: "Paid",
    document: {
      ...(bookingItems?.length ? { bookingItems } : {}),
      ...(lineItems?.length ? { lineItems } : {}),
    },
    ...rest,
  } as TransactionRow;
}

const lcfFirst = [
  row({
    id: "tx-lcf",
    entryLabel: "Late Cancellation Booking Fee",
    lineItems: [
      {
        description: "Late Cancellation Booking Fee (2% Of €108)",
        totalPrice: 2.16,
      },
    ],
  }),
  row({
    id: "tx-full",
    entryLabel: "Booking",
    status: "Voided",
    bookingItems: [
      { label: "Buzz Cut", value: 45 },
      { label: "Hair Wash", value: 20 },
    ],
  }),
];

const items = refundItemsFromTransactions(lcfFirst);
assert.equal(items.length, 3, "sale items + fee, not fee-only from rows[0]");
assert.equal(items[0].name, "Buzz Cut");
assert.equal(items[1].name, "Hair Wash");
assert.equal(items[2].name, "Late Cancellation Booking Fee (2% Of €108)");
assert.equal(items[2].amount, 2.16);

const fromLines = refundItemsFromSaleLines([
  { id: "s1", label: "Scissor Cut", amount: 35 },
  { id: "fee", label: "Late Cancellation Booking Fee (2% Of €108)", amount: 2.16 },
  { id: "s1-dup", label: "Scissor Cut", amount: 35 },
]);
assert.equal(fromLines.length, 2, "dedupe sale lines across cards");
assert.equal(fromLines[0].name, "Scissor Cut");

const merged = mergeRefundSalesItems(items, [
  { id: "fee", name: "Late Cancellation Booking Fee (2% Of €108)", meta: "€2.16", amount: 2.16 },
  { id: "extra", name: "Add-on Serum", meta: "€12.00", amount: 12 },
]);
assert.equal(merged.length, 4, "tx sale+fee merges with extra card line");
assert.equal(merged[0].name, "Buzz Cut");
assert.equal(merged[3].name, "Add-on Serum");

console.log("refundSales.data.test.ts: ok");
