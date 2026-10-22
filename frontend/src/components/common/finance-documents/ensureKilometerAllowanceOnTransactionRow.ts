import type {
  TransactionDocument,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import { getIssuedDocument } from "./financeDocumentUtils";

function isKilometerAllowanceLine(line: {
  description?: string;
  sourceReference?: string;
}): boolean {
  const ref = String(line.sourceReference ?? "").trim();
  if (ref === "kilometer-allowance") return true;
  return /^kilometer allowance$/i.test(String(line.description ?? "").trim());
}

export type EnsureKilometerAllowanceOpts = {
  kilometerAllowanceAmount: number;
  /** Inclusive booking total (services + km) for Total (Incl. VAT). */
  bookingTotal?: number;
  /** Inclusive prepaid (e.g. 20% of booking total) for PRE Gross / Prepaid. */
  prepaidAmount?: number;
};

/**
 * Issued PRE/full docs built before km sync omit the allowance line. Patch the
 * in-memory row so Invoice modal/PDF match Booking & Payment Details.
 */
export function ensureKilometerAllowanceOnTransactionRow(
  row: TransactionRow | null | undefined,
  opts: number | EnsureKilometerAllowanceOpts,
): TransactionRow | null {
  if (!row) return null;
  const options =
    typeof opts === "number" ? { kilometerAllowanceAmount: opts } : opts;
  const amount =
    Number.isFinite(options.kilometerAllowanceAmount) &&
    options.kilometerAllowanceAmount > 0
      ? options.kilometerAllowanceAmount
      : 0;
  if (!(amount > 0)) return row;

  const document = getIssuedDocument(row);
  if (!document) return row;
  const lines = Array.isArray(document.lineItems) ? document.lineItems : [];
  const alreadyHasKm = lines.some(isKilometerAllowanceLine);
  const nextLines = alreadyHasKm
    ? lines
    : [
        ...lines,
        {
          description: "Kilometer Allowance",
          sourceReference: "kilometer-allowance",
          sourceType: "uniqueItemCode" as const,
          quantity: 1,
          vat: "0%",
          vatRate: 0,
          pricePerUnit: amount,
          totalPrice: amount,
        },
      ];
  const linesTotal = nextLines.reduce(
    (sum, line) => sum + (Number(line.totalPrice) || 0),
    0,
  );
  const bookingTotal =
    options.bookingTotal != null && options.bookingTotal > 0
      ? options.bookingTotal
      : 0;
  const nextTotal = Math.max(
    Number(document.totalPrice) || 0,
    linesTotal,
    bookingTotal,
  );
  const isPrepay =
    (document as { paymentPhase?: string }).paymentPhase === "prepay" ||
    String(row.entryLabel ?? "")
      .trim()
      .toLowerCase() === "prepayment";
  const prepaid =
    isPrepay &&
    options.prepaidAmount != null &&
    options.prepaidAmount > 0
      ? options.prepaidAmount
      : null;

  if (
    alreadyHasKm &&
    nextTotal === Number(document.totalPrice) &&
    (prepaid == null || prepaid === Number(document.prepaymentAmount))
  ) {
    return row;
  }

  const nextDocument: TransactionDocument = {
    ...document,
    lineItems: nextLines,
    totalPrice: nextTotal,
    ...(prepaid != null ? { prepaymentAmount: prepaid } : {}),
  };

  return {
    ...row,
    ...(prepaid != null ? { grossAmount: prepaid } : {}),
    document: nextDocument,
    ...(row.issuedDocument ? { issuedDocument: nextDocument } : {}),
  };
}
