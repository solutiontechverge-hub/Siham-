/**
 * Run with: npx --yes tsx src/components/common/finance-documents/paymentTermsFreeze.test.ts
 *
 * Contract: issue snapshot → change live settings → issued doc still resolves frozen terms.
 */
import assert from "node:assert/strict";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  defaultFinanceInvoiceSettings,
  type FinanceInvoiceSettings,
} from "./useFinanceInvoiceSettings";
import { resolveIssuedInvoiceSettings } from "./financeDocumentUtils";

const frozenTerms = {
  ...defaultFinanceInvoiceSettings.paymentTerms,
  originalDueValue: "2",
  originalDueUnit: "Weeks",
  originalPenaltyValue: "10",
  originalPenaltyUnit: "%",
  firstReissueTrigger: "Manual",
};

const liveAfterEdit: FinanceInvoiceSettings = {
  ...defaultFinanceInvoiceSettings,
  paymentTerms: {
    ...defaultFinanceInvoiceSettings.paymentTerms,
    originalDueValue: "10",
    originalDueUnit: "Days",
    originalPenaltyValue: "50",
    originalPenaltyUnit: "%",
    firstReissueTrigger: "Automatic",
  },
};

const issuedRow = {
  id: "tx-freeze",
  entryType: "onlineBooking",
  entryId: "BK-1",
  date: "2026-10-13",
  clientName: "Ada",
  clientEmail: "a@b.c",
  clientType: "mollure",
  netAmount: 100,
  methodTitle: "Online - Direct",
  methodDetail: "",
  status: "Payment due",
  issuedDocument: {
    documentNumber: "INV-BK-1",
    serviceDate: "2026-10-13",
    invoiceDate: "2026-10-13",
    dueDate: "2026-10-27",
    issuedSnapshot: {
      templateType: "individual",
      layout: "simplified",
      invoiceSettings: {
        ...defaultFinanceInvoiceSettings,
        paymentTerms: frozenTerms,
      },
    },
  },
} as TransactionRow;

const liveWithReminders: FinanceInvoiceSettings = {
  ...liveAfterEdit,
  reminders: {
    reminder1Value: "5",
    reminder1Unit: "Days",
    reminder2Value: "1",
    reminder2Unit: "Weeks",
  },
};

const resolved = resolveIssuedInvoiceSettings(issuedRow, liveWithReminders);
assert.equal(resolved.paymentTerms.originalDueValue, "2");
assert.equal(resolved.paymentTerms.originalDueUnit, "Weeks");
assert.equal(resolved.paymentTerms.firstReissueTrigger, "Manual");
assert.equal(resolved.paymentTerms.originalPenaltyValue, "10");
assert.notEqual(
  resolved.paymentTerms.originalDueUnit,
  liveWithReminders.paymentTerms.originalDueUnit,
);
// Reminders freeze with issuedSnapshot (same path as paymentTerms).
assert.equal(resolved.reminders.reminder1Value, "1");
assert.equal(resolved.reminders.reminder1Unit, "Weeks");
assert.equal(resolved.reminders.reminder2Value, "3");
assert.equal(resolved.reminders.reminder2Unit, "Days");
assert.notEqual(
  resolved.reminders.reminder1Unit,
  liveWithReminders.reminders.reminder1Unit,
);

// Draft / no snapshot → live settings.
const draftRow = {
  ...issuedRow,
  issuedDocument: {
    serviceDate: "2026-10-13",
    invoiceDate: "2026-10-13",
    dueDate: "",
  },
} as TransactionRow;
assert.equal(
  resolveIssuedInvoiceSettings(draftRow, liveAfterEdit).paymentTerms
    .originalDueUnit,
  "Days",
);

console.log("paymentTermsFreeze.test.ts: ok");
