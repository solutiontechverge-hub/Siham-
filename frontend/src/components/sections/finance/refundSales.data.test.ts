/**
 * Run with: npx --yes tsx src/components/sections/finance/refundSales.data.test.ts
 */
import assert from "node:assert/strict";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  filterRefundableCardRows,
  isOriginalOnlineCharge,
  mergeRefundSalesItems,
  refundItemsFromSaleLines,
  refundItemsFromTransactions,
  refundMethodFromMethodTitle,
  refundMethodFromPaymentMethod,
  resolvePreferredRefundMethod,
  resolveRefundTargetIds,
} from "./refundSales.data";

function row(
  partial: Partial<TransactionRow> & {
    id: string;
    entryLabel?: string;
    lineItems?: Array<{ description: string; totalPrice: number }>;
    bookingItems?: Array<{ label: string; value: number }>;
    paymentPhase?: string;
  },
): TransactionRow {
  const { lineItems, bookingItems, paymentPhase, ...rest } = partial;
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
      serviceDate: "2026-10-01",
      invoiceDate: "2026-10-01",
      dueDate: "2026-10-08",
      ...(paymentPhase ? { paymentPhase } : {}),
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
assert.equal(items[0].transactionId, "tx-full");
assert.equal(items[2].transactionId, "tx-lcf");

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
assert.equal(
  merged.find((i) => i.name.startsWith("Late Cancellation"))?.transactionId,
  "tx-lcf",
  "merge keeps finance transactionId",
);

const paid = row({
  id: "tx-paid",
  bookingId: "uuid-1",
  entryId: "BK-CODE",
  netAmount: 58.25,
  paymentPhase: "prepay",
  bookingItems: [
    { label: "eyelash", value: 47.25 },
    { label: "Muhammad umer arshad", value: 11 },
  ],
});

const refundable = filterRefundableCardRows([paid], {
  bookingId: "uuid-1",
  bookingCode: "BK-CODE",
  kind: "prepayment",
});
assert.equal(refundable.length, 1);

const itemLines = refundItemsFromTransactions([paid]);
const byItem = resolveRefundTargetIds({
  mode: "item",
  itemIds: [itemLines[1].id],
  amount: 11,
  items: itemLines,
  refundableRows: refundable,
});
assert.ok(!("error" in byItem));
assert.deepEqual(byItem.ids, ["tx-paid"]);

const byAmountOk = resolveRefundTargetIds({
  mode: "amount",
  itemIds: [],
  amount: 58.25,
  items: itemLines,
  refundableRows: refundable,
});
assert.ok(!("error" in byAmountOk));
assert.deepEqual(byAmountOk.ids, ["tx-paid"]);

const byAmountPartial = resolveRefundTargetIds({
  mode: "amount",
  itemIds: [],
  amount: 40,
  items: itemLines,
  refundableRows: refundable,
});
assert.ok("error" in byAmountPartial);
assert.match(byAmountPartial.error, /Partial amount/);

const empty = resolveRefundTargetIds({
  mode: "item",
  itemIds: ["x"],
  amount: 0,
  items: [],
  refundableRows: [],
});
assert.ok("error" in empty);

assert.equal(refundMethodFromPaymentMethod("onlineDirect"), "online-direct");
assert.equal(
  refundMethodFromPaymentMethod("onlineNonDirect"),
  "online-non-direct",
);
assert.equal(refundMethodFromPaymentMethod("offlineDirect"), "offline-direct");
assert.equal(
  refundMethodFromMethodTitle("Online – invoice with due date"),
  "online-non-direct",
);
assert.equal(
  refundMethodFromMethodTitle("Offline – direct"),
  "offline-direct",
);

const onlineRow = row({
  id: "tx-online",
  netAmount: 55.98,
  methodTitle: "Online Non-Direct",
  document: {
    serviceDate: "2026-10-01",
    invoiceDate: "2026-10-01",
    dueDate: "2026-10-08",
    paidAmount: 55.98,
  },
});
assert.equal(
  resolvePreferredRefundMethod([onlineRow], "offlineDirect"),
  "online-non-direct",
);
assert.equal(isOriginalOnlineCharge([onlineRow], null), true);
assert.equal(isOriginalOnlineCharge([], "offlineDirect"), false);

const byPaidSnapshot = resolveRefundTargetIds({
  mode: "amount",
  itemIds: [],
  amount: 55.98,
  items: [],
  refundableRows: [onlineRow],
});
assert.ok(!("error" in byPaidSnapshot));
assert.deepEqual(byPaidSnapshot.ids, ["tx-online"]);

console.log("refundSales.data.test.ts: ok");
