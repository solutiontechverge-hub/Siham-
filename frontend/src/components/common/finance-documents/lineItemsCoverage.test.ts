/**
 * Run with: npx --yes tsx src/components/common/finance-documents/lineItemsCoverage.test.ts
 */
import assert from "node:assert/strict";
import {
  buildPreviewLineItems,
  getInvoiceLineItemColumns,
  INVOICE_TOTAL_VAT_INCLUDED_LABEL,
  resolveInvoiceTemplateType,
  toInvoiceDisplayLineItems,
} from "./financeDocumentUtils";
import { buildClientBookingTransactionRow } from "./buildClientBookingTransactionRow";
import { resolveSalesPayerShares } from "../calendar/salesSplitBill";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { FinanceInvoiceSettings } from "./useFinanceInvoiceSettings";

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

// Gap 1: never invent "Professional Service" when stored lines are empty.
assert.deepEqual(
  buildPreviewLineItems(emptySettings, {
    id: "t1",
    entryType: "onlineBooking",
    entryId: "1",
    date: "2026-10-06",
    entryLabel: "Booking",
    clientName: "Ada",
    clientEmail: "a@b.c",
    clientType: "mollure",
    netAmount: 50,
    methodTitle: "Online - Direct",
    methodDetail: "",
    status: "Paid",
    document: {
      serviceDate: "2026-10-06",
      invoiceDate: "2026-10-06",
      dueDate: "2026-10-08",
      bookingItems: [],
      lineItems: [],
      totalPrice: 50,
    },
  }),
  [],
  "empty stored lines must not invent Professional Service",
);

// Gap 2: builders stamp catalog sourceReference/sourceType.
const row = buildClientBookingTransactionRow({
  bookingRef: "B1",
  draft: {
    selectedDateISO: "2026-10-06",
    selectedTime: "10:00",
    combineServices: false,
    services: [{ id: "svc-1", name: "Cut", price: 40, durationMins: 30 }],
    products: [{ id: "prod-1", name: "Shampoo", price: 10, quantity: 1, unitPrice: 10 }],
    total: 50,
  },
  requesterName: "Ada",
  financeSettings: emptySettings,
});
assert.equal(row.document?.lineItems?.[0]?.sourceReference, "svc-1");
assert.equal(row.document?.lineItems?.[0]?.sourceType, "serviceId");
assert.equal(row.document?.lineItems?.[1]?.sourceReference, "prod-1");
assert.equal(row.document?.lineItems?.[1]?.sourceType, "productId");

// Gap 3: composite line ids keep main + guest when catalog ids collide.
const event = {
  id: "b-1",
  resourceId: "r1",
  date: "2026-10-06",
  start: "10:00",
  end: "11:00",
  title: "Cut",
  status: "Confirmed",
  details: {
    clientSnapshot: {
      people: [
        { id: "main", name: "Ada", isRequester: true },
        { id: "guest-1", name: "Bea", participantType: "guest" },
      ],
      services: [
        { id: "svc-same", name: "Cut", price: 40, durationMins: 30, guestId: null },
        { id: "svc-same", name: "Cut", price: 40, durationMins: 30, guestId: "guest-1" },
      ],
    },
  },
} as CalendarEvent;

const shares = resolveSalesPayerShares({
  event,
  allLines: [
    { id: "svc-same::::0", label: "Cut", amount: 40 },
    { id: "svc-same::guest-1::1", label: "Cut", amount: 40 },
  ],
  mainClientName: "Ada",
});
assert.equal(shares.length, 2, "main + guest shares must both survive");
assert.equal(shares.find((s) => s.role === "main_client")?.lines.length, 1);
assert.equal(shares.find((s) => s.role === "guest")?.lines.length, 1);
assert.notEqual(
  shares.find((s) => s.role === "main_client")?.lines[0]?.id,
  shares.find((s) => s.role === "guest")?.lines[0]?.id,
);

// BC mock: Description | Quantity | VAT % | Price Per Unit | Total Price
assert.deepEqual(
  getInvoiceLineItemColumns("itemized").map((c) => c.label),
  ["Description", "Quantity", "VAT %", "Price Per Unit", "Total Price"],
);
assert.deepEqual(
  getInvoiceLineItemColumns("simplified").map((c) => c.label),
  ["Description", "Price (Incl. VAT)"],
);
assert.equal(INVOICE_TOTAL_VAT_INCLUDED_LABEL, "Total (Incl. VAT)");
assert.equal(INVOICE_TOTAL_VAT_INCLUDED_LABEL.includes("%"), false);

// BC clientType beats a frozen individual snapshot / default.
assert.equal(
  resolveInvoiceTemplateType({
    clientType: "business",
    invoiceType: "individual",
    fallback: "individual",
  }),
  "company",
);
assert.equal(
  resolveInvoiceTemplateType({
    clientKind: "company",
    invoiceType: "individual",
  }),
  "company",
);
assert.equal(
  resolveInvoiceTemplateType({
    vatNumber: "NL123",
    invoiceType: "individual",
  }),
  "company",
);
assert.equal(
  resolveInvoiceTemplateType({
    clientType: "mollure",
    invoiceType: "individual",
    fallback: "individual",
  }),
  "individual",
);
// Individual Mollure beats a wrong frozen company snapshot from defaultInvoiceType.
assert.equal(
  resolveInvoiceTemplateType({
    clientType: "mollure",
    invoiceType: "company",
  }),
  "individual",
);

// Stored payload → individual display: inline 3× qty, preserved totals (read-only path).
const storedLines = [
  {
    description: "Shampoo",
    quantity: 3,
    vat: "21%",
    pricePerUnit: 10,
    totalPrice: 30,
  },
];
const individualDisplay = toInvoiceDisplayLineItems(storedLines, "individual", true);
assert.equal(individualDisplay[0]?.displayDescription, "3× Shampoo");
assert.equal(individualDisplay[0]?.totalPrice, 30);
assert.equal(individualDisplay[0]?.vat, "21%");

const companyDisplay = toInvoiceDisplayLineItems(storedLines, "company", true);
assert.equal(companyDisplay[0]?.displayDescription, "Shampoo");
assert.equal(companyDisplay[0]?.unit, "3");
assert.deepEqual(
  getInvoiceLineItemColumns("itemized").map((c) => c.key),
  ["description", "unit", "vat", "pricePerUnit", "totalPrice"],
);
assert.equal(
  getInvoiceLineItemColumns("simplified").find((c) => c.key === "totalPrice")
    ?.label,
  "Price (Incl. VAT)",
);

console.log("lineItemsCoverage.test.ts: ok");
