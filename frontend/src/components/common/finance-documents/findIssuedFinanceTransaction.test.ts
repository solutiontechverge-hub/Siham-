/**
 * Run with: npx --yes tsx src/components/common/finance-documents/findIssuedFinanceTransaction.test.ts
 */
import assert from "node:assert/strict";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  findIssuedFinanceTransaction,
  salesCardKindToPaymentPhase,
} from "./findIssuedFinanceTransaction";

const base = {
  entryType: "onlineBooking" as const,
  entryId: "BK-1",
  date: "2026-01-01",
  clientName: "Ada",
  clientEmail: "a@b.c",
  clientType: "mollure" as const,
  netAmount: 100,
  methodTitle: "Online",
  methodDetail: "",
  status: "Paid" as const,
};

const rows: TransactionRow[] = [
  {
    ...base,
    id: "tx-prepay",
    bookingId: "booking-uuid",
    issuedDocument: {
      documentNumber: "INV-1",
      receiptNumber: "RCP-1",
      serviceDate: "2026-01-01",
      invoiceDate: "2026-01-01",
      dueDate: "2026-01-01",
      paymentPhase: "prepay",
      lineItems: [{ description: "Prepay", quantity: 1, vat: "21%", pricePerUnit: 40, totalPrice: 40 }],
      totalPrice: 40,
      issuedSnapshot: { templateType: "individual" },
    } as never,
  },
  {
    ...base,
    id: "tx-full",
    bookingId: "BK-1",
    issuedDocument: {
      documentNumber: "INV-2",
      serviceDate: "2026-01-01",
      invoiceDate: "2026-01-01",
      dueDate: "2026-01-01",
      paymentPhase: "full",
      lineItems: [{ description: "Cut", quantity: 1, vat: "21%", pricePerUnit: 100, totalPrice: 100 }],
      totalPrice: 100,
      issuedSnapshot: { templateType: "individual" },
    } as never,
  },
];

assert.equal(salesCardKindToPaymentPhase("prepayment"), "prepay");
assert.equal(salesCardKindToPaymentPhase("after_treatment"), "full");

const prepay = findIssuedFinanceTransaction(rows, {
  bookingId: "booking-uuid",
  bookingCode: "BK-1",
  phase: "prepay",
});
assert.equal(prepay?.id, "tx-prepay");

const full = findIssuedFinanceTransaction(rows, {
  bookingId: "booking-uuid",
  bookingCode: "BK-1",
  phase: "full",
});
assert.equal(full?.id, "tx-full");

const missing = findIssuedFinanceTransaction(rows, {
  bookingId: "other",
  phase: "full",
});
assert.equal(missing, null);

const feeRows: TransactionRow[] = [
  {
    ...base,
    id: "tx-voided-services",
    bookingId: "fee-booking",
    status: "Voided",
    entryLabel: "Booking",
    issuedDocument: {
      documentNumber: "INV-OLD",
      paymentPhase: "full",
      lineItems: [{ description: "Dye", quantity: 1, vat: "21%", pricePerUnit: 100, totalPrice: 100 }],
      totalPrice: 100,
      issuedSnapshot: { templateType: "individual" },
    } as never,
  },
  {
    ...base,
    id: "tx-late-cancel-fee",
    bookingId: "fee-booking",
    status: "Payment due",
    entryLabel: "Late Cancellation Booking Fee",
    issuedDocument: {
      documentNumber: "INV-FEE",
      paymentPhase: "full",
      lineItems: [
        {
          description: "Late Cancellation Booking Fee (10% Of €230)",
          quantity: 1,
          vat: "0%",
          pricePerUnit: 23,
          totalPrice: 23,
        },
      ],
      totalPrice: 23,
      issuedSnapshot: { templateType: "individual" },
    } as never,
  },
];

const feeInvoice = findIssuedFinanceTransaction(feeRows, {
  bookingId: "fee-booking",
  phase: "full",
});
assert.equal(feeInvoice?.id, "tx-late-cancel-fee");

const feeOnly = findIssuedFinanceTransaction(feeRows, {
  bookingId: "fee-booking",
  phase: "full",
  protectiveFee: true,
});
assert.equal(feeOnly?.id, "tx-late-cancel-fee");

const nonFeeFull = findIssuedFinanceTransaction(
  [
    ...feeRows,
    {
      ...base,
      id: "tx-services-live",
      bookingId: "fee-booking",
      status: "Paid",
      entryLabel: "After treatment · Main Client",
      issuedDocument: {
        documentNumber: "INV-AT",
        paymentPhase: "full",
        lineItems: [
          {
            description: "Cut",
            quantity: 1,
            vat: "21%",
            pricePerUnit: 100,
            totalPrice: 100,
          },
        ],
        totalPrice: 100,
        issuedSnapshot: { templateType: "individual" },
      } as never,
    },
  ],
  { bookingId: "fee-booking", phase: "full", protectiveFee: false },
);
assert.equal(nonFeeFull?.id, "tx-services-live", "protectiveFee:false skips LCF");

// PRE phase must never return an LCF row even if mis-labeled phase-wise.
const prepayIgnoresFee = findIssuedFinanceTransaction(
  [
    {
      ...base,
      id: "tx-fee-as-prepay-noise",
      bookingId: "pre-booking",
      entryLabel: "Late Cancellation Booking Fee",
      issuedDocument: {
        documentNumber: "INV-LCF",
        paymentPhase: "prepay",
        lineItems: [
          {
            description: "Late Cancellation Booking Fee (2% Of €108)",
            quantity: 1,
            vat: "0%",
            pricePerUnit: 2.16,
            totalPrice: 2.16,
          },
        ],
        totalPrice: 2.16,
        issuedSnapshot: { templateType: "individual" },
      } as never,
    },
    {
      ...base,
      id: "tx-real-prepay",
      bookingId: "pre-booking",
      entryLabel: "Prepayment",
      issuedDocument: {
        documentNumber: "INV-PRE",
        paymentPhase: "prepay",
        prepaymentAmount: 10.8,
        lineItems: [
          {
            description: "Cut",
            quantity: 1,
            vat: "21%",
            pricePerUnit: 108,
            totalPrice: 108,
          },
        ],
        totalPrice: 108,
        issuedSnapshot: { templateType: "individual" },
      } as never,
    },
  ],
  { bookingId: "pre-booking", phase: "prepay" },
);
assert.equal(prepayIgnoresFee?.id, "tx-real-prepay", "prepay excludes fee rows");

// Linked card: financeTransactionId wins over phase heuristics.
const byTx = findIssuedFinanceTransaction(rows, {
  bookingId: "booking-uuid",
  phase: "full",
  transactionId: "tx-prepay",
});
assert.equal(byTx?.id, "tx-prepay", "transactionId preferred over phase");

console.log("findIssuedFinanceTransaction.test.ts: ok");
