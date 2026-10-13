import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { hasStoredDocumentSnapshot } from "./financeDocumentUtils";
import {
  isProtectiveFeeEntryLabel,
  isProtectiveFeeLineDescription,
} from "./protectiveFeeInvoice";

export type FinanceDocPaymentPhase = "prepay" | "full" | "addon";

type DocPhaseFields = {
  paymentPhase?: string;
  addonId?: string;
  payerKey?: string;
  receiptNumber?: string;
};

function docPhaseFields(row: TransactionRow): DocPhaseFields {
  const doc = (row.issuedDocument ?? row.document) as DocPhaseFields | undefined;
  return doc ?? {};
}

function isFeeInvoiceRow(row: TransactionRow): boolean {
  if (isProtectiveFeeEntryLabel(row.entryLabel)) return true;
  const lines = (row.issuedDocument ?? row.document)?.lineItems ?? [];
  return lines.some((line) => isProtectiveFeeLineDescription(line?.description));
}

export function salesCardKindToPaymentPhase(
  kind: string | null | undefined,
): FinanceDocPaymentPhase | null {
  if (kind === "prepayment") return "prepay";
  if (kind === "addon") return "addon";
  if (kind === "after_treatment" || kind === "reissued_invoice") return "full";
  return null;
}

export function matchesFinanceBooking(
  row: TransactionRow,
  bookingId?: string | null,
  bookingCode?: string | null,
): boolean {
  const id = bookingId ? String(bookingId) : "";
  const code = bookingCode ? String(bookingCode) : "";
  if (!id && !code) return false;
  const rowBooking = row.bookingId ? String(row.bookingId) : "";
  const rowEntry = row.entryId ? String(row.entryId) : "";
  return (
    (id !== "" && (rowBooking === id || rowEntry === id)) ||
    (code !== "" && (rowBooking === code || rowEntry === code))
  );
}

/** Pick the issued finance row for a booking document surface (invoice/receipt). */
export function findIssuedFinanceTransaction(
  rows: readonly TransactionRow[],
  opts: {
    bookingId?: string | null;
    bookingCode?: string | null;
    phase?: FinanceDocPaymentPhase | string | null;
    addonId?: string | null;
    /** Prefer exact finance_transactions.id when Sales card is linked. */
    transactionId?: string | null;
    /**
     * true = only LCF/LRF/NS rows; false = exclude them.
     * Omit: prefer fee among full-phase matches (Fee Summary); never for prepay.
     */
    protectiveFee?: boolean;
  },
): TransactionRow | null {
  if (opts.transactionId) {
    const byId = rows.find(
      (row) => String(row.id) === String(opts.transactionId),
    );
    if (byId) return byId;
  }
  const phase = opts.phase ?? null;
  const addonId = opts.addonId ? String(opts.addonId) : "";
  const candidates = rows.filter((row) => {
    if (!matchesFinanceBooking(row, opts.bookingId, opts.bookingCode)) return false;
    const doc = docPhaseFields(row);
    const rowPhase = doc.paymentPhase;
    if (addonId) {
      return (
        doc.addonId === addonId ||
        doc.payerKey === addonId ||
        (rowPhase === "addon" && (!doc.addonId || String(row.id).includes(addonId)))
      );
    }
    if (!phase) return true;
    // PRE docs are never protective-fee invoices (LCF/LRF/NS live on full phase).
    if (phase === "prepay") {
      if (isFeeInvoiceRow(row)) return false;
      return rowPhase === "prepay" || (!rowPhase && Boolean(doc.receiptNumber));
    }
    if (phase === "full") return rowPhase === "full" || rowPhase == null || rowPhase === "";
    if (phase === "addon") return rowPhase === "addon";
    return rowPhase === phase;
  });

  const feeFiltered =
    opts.protectiveFee === true
      ? candidates.filter((row) => isFeeInvoiceRow(row))
      : opts.protectiveFee === false
        ? candidates.filter((row) => !isFeeInvoiceRow(row))
        : candidates;

  if (!feeFiltered.length) return null;
  const withSnapshot = feeFiltered.filter((row) => hasStoredDocumentSnapshot(row));
  const pool = withSnapshot.length ? withSnapshot : feeFiltered;
  const live = pool.filter((row) => row.status !== "Voided");
  const prefer = live.length ? live : pool;
  // Fee Summary (full, unspecified): prefer LCF/LRF/NS over voided service sales.
  if (opts.protectiveFee !== false && phase === "full") {
    return prefer.find((row) => isFeeInvoiceRow(row)) ?? prefer[0] ?? null;
  }
  return prefer[0] ?? null;
}
