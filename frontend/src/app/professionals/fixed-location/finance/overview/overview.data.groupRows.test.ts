/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/finance/overview/overview.data.groupRows.test.ts
 */
import assert from "node:assert/strict";
import {
  groupFinanceOverviewRows,
  isFinanceGuestOrModelRow,
} from "./overview.data";
import type { TransactionRow } from "../data/transactions";

const base = {
  entryType: "onlineBooking" as const,
  entryId: "B1",
  date: "2026-10-01",
  clientEmail: "a@x.com",
  grossAmount: null,
  stripeFee: null,
  mollureFee: null,
  methodTitle: "Online",
  methodDetail: "",
  status: "Paid" as const,
  bookingId: "book-1",
};

const rows: TransactionRow[] = [
  {
    ...base,
    id: "1",
    clientName: "aliza",
    clientType: "mollure",
    entryLabel: "Prepayment",
    netAmount: 22,
    document: { documentNumber: "INV-PRE", serviceDate: "", invoiceDate: "", dueDate: "" },
  },
  {
    ...base,
    id: "2",
    clientName: "aliza",
    clientType: "mollure",
    entryLabel: "After treatment · Main Client",
    netAmount: 100,
    document: { documentNumber: "INV-AT", serviceDate: "", invoiceDate: "", dueDate: "" },
    bookingFinancials: { net_total: 122, outstanding_balance: 0 },
  },
  {
    ...base,
    id: "lcf",
    clientName: "aliza",
    clientType: "mollure",
    entryLabel: "Late Cancellation Booking Fee",
    netAmount: 10,
    document: { documentNumber: "INV-LCF", serviceDate: "", invoiceDate: "", dueDate: "" },
  },
  {
    ...base,
    id: "3",
    clientName: "Guest 1",
    clientType: "guest",
    entryLabel: "After treatment · Guest · Guest 1",
    netAmount: 128,
    document: { documentNumber: "INV-G", serviceDate: "", invoiceDate: "", dueDate: "" },
  },
  {
    ...base,
    id: "4",
    clientName: "Guest · Guest 1",
    clientType: "mollure",
    entryLabel: "Add-ons",
    netAmount: 128,
    document: { documentNumber: "INV-ADDON-1", serviceDate: "", invoiceDate: "", dueDate: "" },
  },
];

assert.equal(isFinanceGuestOrModelRow(rows[3]!), true);

const grouped = groupFinanceOverviewRows(rows);
// Main PRE+AT+LCF → 1 row; guest → 1 row
assert.equal(grouped.length, 2);

assert.equal(grouped[0]!.clientName, "aliza");
assert.equal(grouped[0]!.entryId, "B1");
assert.equal(grouped[0]!.entryLabel, undefined);
assert.equal(grouped[0]!.netAmount, 122);
assert.equal(grouped[0]!.document?.documentNumber, "INV-AT");

assert.equal(grouped[1]!.clientName, "Guest 1");
assert.equal(grouped[1]!.entryId, null);
assert.equal(grouped[1]!.netAmount, 128);
assert.equal(grouped[1]!.document?.documentNumber, "INV-G");

const solo = groupFinanceOverviewRows(rows.slice(0, 3));
assert.equal(solo.length, 1);
assert.equal(solo[0]!.clientName, "aliza");

console.log("overview.data.groupRows.test.ts: ok");
