/**
 * Dual invoice templates: business vs individual columns + stored-payload preview.
 * Run: npx --yes tsx src/components/common/finance-documents/dualInvoiceTemplates.test.ts
 */
import assert from "node:assert/strict";
import {
  buildInvoiceTemplatePreviewRow,
  buildPreviewLineItems,
  getInvoiceLineItemColumns,
  getInvoiceLineItemCellValue,
  hasStoredDocumentSnapshot,
  INVOICE_TOTAL_VAT_INCLUDED_LABEL,
  professionalBusinessInfoLines,
  resolveInvoiceLineItemLayout,
  resolveInvoiceTemplateType,
  resolveProfessionalBusinessDisplay,
  toInvoiceDisplayLineItems,
} from "./financeDocumentUtils";
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

function storedRow(
  clientType: TransactionRow["clientType"],
  templateType: "company" | "individual",
): TransactionRow {
  return {
    id: "tx-1",
    entryType: "onlineBooking",
    entryId: "B1",
    date: "2026-10-13",
    entryLabel: "Booking",
    clientName: clientType === "business" ? "Acme BV" : "Ada",
    clientEmail: "a@b.c",
    clientType,
    netAmount: 60,
    methodTitle: "Online - Direct",
    methodDetail: "",
    status: "Paid",
    issuedDocument: {
      documentNumber: "INV-1",
      serviceDate: "2026-10-13",
      invoiceDate: "2026-10-13",
      dueDate: "2026-10-15",
      client: {
        legalName: clientType === "business" ? "Acme BV" : "Ada",
        email: "a@b.c",
        ...(clientType === "business"
          ? {
              address: "1 Business St",
              vatNumber: "NL123",
              cocNumber: "12345678",
            }
          : {}),
      },
      lineItems: [
        {
          description: "Cut",
          quantity: 1,
          vat: "21%",
          pricePerUnit: 40,
          totalPrice: 40,
        },
        {
          description: "Shampoo",
          quantity: 2,
          vat: "21%",
          pricePerUnit: 10,
          totalPrice: 20,
        },
      ],
      totalPrice: 60,
      issuedSnapshot: {
        templateType,
        layout: templateType === "company" ? "itemized" : "simplified",
        professionalBusiness: {
          legalName: "Pro Legal BV",
          shopName: "Salon Mollure",
          address: "9 Pro Ave",
          vatNumber: "NL999",
          cocNumber: "87654321",
        },
      },
    },
  };
}

const businessType = resolveInvoiceTemplateType({
  clientType: "business",
  invoiceType: "individual",
  vatNumber: "NL123",
  cocNumber: "12345678",
});
assert.equal(businessType, "company");
assert.equal(resolveInvoiceLineItemLayout(businessType), "itemized");

const individualType = resolveInvoiceTemplateType({
  clientType: "mollure",
  invoiceType: "company",
});
assert.equal(individualType, "individual");
assert.equal(resolveInvoiceLineItemLayout(individualType), "simplified");

const businessRow = storedRow("business", "individual");
const businessLines = buildPreviewLineItems(emptySettings, businessRow);
assert.equal(businessLines.length, 2, "preview reads stored lineItems only");
const businessDisplay = toInvoiceDisplayLineItems(businessLines, businessType, true);
const businessCols = getInvoiceLineItemColumns("itemized");
assert.deepEqual(
  businessCols.map((c) => c.label),
  ["Description", "Quantity", "VAT %", "Price Per Unit", "Total Price"],
);
assert.equal(getInvoiceLineItemCellValue(businessDisplay[1]!, "description"), "Shampoo");
assert.equal(getInvoiceLineItemCellValue(businessDisplay[1]!, "vat"), "21%");
assert.match(String(getInvoiceLineItemCellValue(businessDisplay[1]!, "pricePerUnit")), /10/);
assert.match(String(getInvoiceLineItemCellValue(businessDisplay[1]!, "totalPrice")), /20/);

const businessHeader = professionalBusinessInfoLines(
  resolveProfessionalBusinessDisplay({
    legalName: "Pro Legal BV",
    shopName: "Salon Mollure",
    address: "9 Pro Ave",
    vatNumber: "NL999",
    cocNumber: "87654321",
  }),
  "company",
);
assert.ok(businessHeader.some((line) => line.includes("Salon Mollure")));
assert.ok(businessHeader.some((line) => line.includes("Pro Legal BV")));
assert.ok(businessHeader.some((line) => line.includes("NL999")));
assert.ok(businessHeader.some((line) => line.includes("87654321")));

const individualRow = storedRow("mollure", "company");
const individualLines = buildPreviewLineItems(emptySettings, individualRow);
const individualDisplay = toInvoiceDisplayLineItems(
  individualLines,
  individualType,
  true,
);
assert.deepEqual(
  getInvoiceLineItemColumns("simplified").map((c) => c.label),
  ["Description", "Price (Incl. VAT)"],
);
assert.deepEqual(
  getInvoiceLineItemColumns("itemized").map((c) => c.label),
  ["Description", "Quantity", "VAT %", "Price Per Unit", "Total Price"],
);
assert.equal(individualDisplay[1]?.displayDescription, "2× Shampoo");
assert.equal(individualDisplay[1]?.totalPrice, 20);
assert.equal(INVOICE_TOTAL_VAT_INCLUDED_LABEL.includes("%"), false);
assert.match(INVOICE_TOTAL_VAT_INCLUDED_LABEL, /Total \(Incl\. VAT\)/i);

// Read-only: same stored totals — no client-side reconstruction of amounts.
assert.equal(
  individualDisplay.reduce((sum, item) => sum + Number(item.totalPrice), 0),
  individualRow.issuedDocument?.totalPrice,
);

// Settings “View invoice” sample is a frozen stored payload for both types.
const settingsBusiness = buildInvoiceTemplatePreviewRow("company", {
  legalName: "Pro Legal BV",
  shopName: "Salon Mollure",
  address: "9 Pro Ave",
  vatNumber: "NL999",
  cocNumber: "87654321",
});
assert.equal(hasStoredDocumentSnapshot(settingsBusiness), true);
assert.equal(settingsBusiness.clientType, "business");
assert.equal(
  resolveInvoiceTemplateType({
    clientType: settingsBusiness.clientType,
    vatNumber: settingsBusiness.issuedDocument?.client?.vatNumber,
    cocNumber: settingsBusiness.issuedDocument?.client?.cocNumber,
  }),
  "company",
);
assert.equal(buildPreviewLineItems(emptySettings, settingsBusiness).length, 2);

const settingsIndividual = buildInvoiceTemplatePreviewRow("individual");
assert.equal(settingsIndividual.clientType, "mollure");
assert.equal(
  resolveInvoiceTemplateType({ clientType: settingsIndividual.clientType }),
  "individual",
);
assert.equal(
  toInvoiceDisplayLineItems(
    buildPreviewLineItems(emptySettings, settingsIndividual),
    "individual",
    true,
  )[1]?.displayDescription,
  "2× Shampoo",
);

console.log("dualInvoiceTemplates.test.ts: ok");
