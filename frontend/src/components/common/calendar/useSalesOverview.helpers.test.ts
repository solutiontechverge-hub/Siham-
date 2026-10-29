/**
 * Run with: npx --yes tsx src/components/common/calendar/useSalesOverview.helpers.test.ts
 */
import assert from "node:assert/strict";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  financeDocumentLinesToSalesLines,
  salesPaymentMethodFromMethodTitle,
  toFinanceHints,
} from "./useSalesOverview.helpers";

const row = {
  id: "tx-1",
  entryType: "onlineBooking",
  entryId: "BK-1",
  date: "2026-10-12",
  entryLabel: "After treatment · Main Client",
  clientName: "Ada",
  clientEmail: "a@b.c",
  clientType: "nonMollure",
  netAmount: 90,
  grossAmount: 90,
  methodTitle: "Online - Direct",
  methodDetail: "",
  status: "Paid",
  bookingId: "booking-1",
  document: {
    serviceDate: "2026-10-12",
    invoiceDate: "2026-10-12",
    dueDate: "2026-10-14",
    paymentPhase: "full",
    payerKey: "main-client",
    lineItems: [
      {
        description: "Cut",
        sourceReference: "svc-cut",
        sourceType: "serviceId",
        quantity: 1,
        vat: "21%",
        pricePerUnit: 40,
        totalPrice: 40,
      },
      {
        description: "Blow",
        sourceReference: "svc-blow",
        sourceType: "serviceId",
        quantity: 1,
        vat: "21%",
        pricePerUnit: 50,
        totalPrice: 50,
      },
    ],
  },
} as TransactionRow;

const lines = financeDocumentLinesToSalesLines(row);
assert.equal(lines.length, 2);
assert.deepEqual(lines, [
  { id: "svc-cut", label: "Cut", amount: 40 },
  { id: "svc-blow", label: "Blow", amount: 50 },
]);

const hints = toFinanceHints([row]);
assert.equal(hints[0]?.transactionId, row.id);
assert.equal(hints[0]?.lineItems?.length, 2);
assert.equal(hints[0]?.phase, "full");
assert.equal(hints[0]?.dueDate, "2026-10-14");
assert.equal(hints[0]?.paymentMethod, "onlineDirect");

assert.equal(
  salesPaymentMethodFromMethodTitle("Online – invoice with due date"),
  "onlineNonDirect",
);
assert.equal(
  salesPaymentMethodFromMethodTitle("Offline – invoice with due date"),
  "offlineNonDirect",
);
assert.equal(
  salesPaymentMethodFromMethodTitle("Offline – direct"),
  "offlineDirect",
);

// payment_deadline column wins over document.dueDate (backend COALESCE).
const withColumn = toFinanceHints([
  {
    ...row,
    paymentDeadline: "2026-10-20",
    document: { ...row.document!, dueDate: "2026-10-14" },
  },
]);
assert.equal(withColumn[0]?.dueDate, "2026-10-20");

// Snapshotted paymentTerms ride along on finance hints (reissue prompt freeze).
const withSnap = toFinanceHints([
  {
    ...row,
    document: {
      ...row.document!,
      issuedSnapshot: {
        invoiceSettings: {
          paymentTerms: {
            originalDueValue: "2",
            originalDueUnit: "Weeks",
            firstReissueTrigger: "Manual",
          },
        },
      },
    },
  },
]);
assert.equal(withSnap[0]?.paymentTerms?.firstReissueTrigger, "Manual");
assert.equal(withSnap[0]?.paymentTerms?.originalDueUnit, "Weeks");

console.log("useSalesOverview.helpers.test.ts: ok");
