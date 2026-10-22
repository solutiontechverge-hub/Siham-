/**
 * Run with: npx --yes tsx src/components/common/finance-documents/ensureKilometerAllowanceOnTransactionRow.test.ts
 */
import assert from "node:assert/strict";
import { ensureKilometerAllowanceOnTransactionRow } from "./ensureKilometerAllowanceOnTransactionRow";
import { buildClientBookingTransactionRow } from "./buildClientBookingTransactionRow";
import { buildPreviewLineItems } from "./financeDocumentUtils";
import type { FinanceInvoiceSettings } from "./useFinanceInvoiceSettings";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";

const emptySettings = {
  services: [],
  products: [],
  uniqueItems: [],
  paymentTerms: {
    originalDueValue: "2",
    originalDueUnit: "days",
    originalPenaltyValue: "",
    originalPenaltyUnit: "",
  },
} as unknown as FinanceInvoiceSettings;

const stalePrepayRow: TransactionRow = {
  id: "tx-pre",
  entryType: "onlineBooking",
  entryId: "ol1",
  date: "2026-10-22",
  bookingId: "ol1",
  entryLabel: "Prepayment",
  clientName: "aliza",
  clientEmail: "a@b.c",
  clientType: "mollure",
  netAmount: 17.6,
  grossAmount: 17.6,
  methodTitle: "Online - Direct",
  methodDetail: "Stripe",
  status: "Prepaid",
  document: {
    documentNumber: "INV-ol1-PRE",
    paymentPhase: "prepay",
    serviceDate: "2026-10-22",
    invoiceDate: "2026-10-22",
    dueDate: "2026-10-22",
    lineItems: [
      {
        description: "hair dye",
        quantity: 1,
        vat: "21%",
        vatRate: 21,
        pricePerUnit: 44,
        totalPrice: 44,
      },
      {
        description: "buzz cutt",
        quantity: 1,
        vat: "21%",
        vatRate: 21,
        pricePerUnit: 44,
        totalPrice: 44,
      },
    ],
    totalPrice: 88,
    prepaymentAmount: 17.6,
  },
};

const healed = ensureKilometerAllowanceOnTransactionRow(stalePrepayRow, {
  kilometerAllowanceAmount: 50,
  bookingTotal: 138,
  prepaidAmount: 27.6,
});

assert.ok(healed);
assert.equal(
  healed!.document?.lineItems?.some((l) => l.description === "Kilometer Allowance"),
  true,
  "km line must appear in Description",
);
assert.equal(healed!.document?.totalPrice, 138);
assert.equal(healed!.document?.prepaymentAmount, 27.6);
assert.equal(healed!.grossAmount, 27.6);

const previewLines = buildPreviewLineItems(emptySettings, healed);
assert.equal(previewLines.length, 3);
assert.equal(previewLines[2]?.description, "Kilometer Allowance");
assert.equal(previewLines[2]?.totalPrice, 50);

const built = buildClientBookingTransactionRow({
  bookingRef: "B-km",
  draft: {
    selectedDateISO: "2026-10-22",
    selectedTime: "09:30",
    combineServices: false,
    services: [
      { id: "s1", name: "hair dye", price: 44, durationMins: 15 },
      { id: "s2", name: "buzz cutt", price: 44, durationMins: 15 },
    ],
    total: 138,
  },
  requesterName: "aliza",
  financeSettings: emptySettings,
  prepaymentAmount: 27.6,
  prepaymentPaid: true,
  kilometerAllowanceAmount: 50,
});
assert.equal(built.document?.lineItems?.length, 3);
assert.equal(
  built.document?.lineItems?.[2]?.description,
  "Kilometer Allowance",
);
assert.equal(built.document?.totalPrice, 138);

console.log("ensureKilometerAllowanceOnTransactionRow.test.ts: ok");
