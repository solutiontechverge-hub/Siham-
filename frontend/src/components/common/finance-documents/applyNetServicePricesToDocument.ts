import type { TransactionDocument, TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";

type NetLine = { label: string; amount: number; originalAmount?: number };

function patchDocument(
  doc: TransactionDocument,
  byLabel: Map<string, { amount: number; originalAmount: number }>,
): TransactionDocument {
  if (!doc.lineItems?.length) return doc;
  let changed = false;
  const lineItems = doc.lineItems.map((item) => {
    const hit = byLabel.get(String(item.description || "").trim().toLowerCase());
    if (!hit) return item;
    const current = roundMoney(Number(item.totalPrice) || 0);
    if (Math.abs(current - hit.originalAmount) > 0.02) return item;
    changed = true;
    const qty = Math.max(1, Number(item.quantity) || 1);
    return {
      ...item,
      pricePerUnit: roundMoney(hit.amount / qty),
      totalPrice: hit.amount,
    };
  });
  if (!changed) return doc;
  const oldSum = roundMoney(
    doc.lineItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0),
  );
  const newSum = roundMoney(lineItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0));
  const bookingItems = doc.bookingItems?.map((item) => {
    const hit = byLabel.get(String(item.label || "").trim().toLowerCase());
    const value = Number(item.value);
    if (!hit || !Number.isFinite(value) || Math.abs(value - hit.originalAmount) > 0.02) {
      return item;
    }
    return { ...item, value: hit.amount };
  });
  const total = Number(doc.totalPrice) || 0;
  return {
    ...doc,
    lineItems,
    ...(bookingItems ? { bookingItems } : {}),
    ...(Math.abs(total - oldSum) < 0.02 ? { totalPrice: newSum } : {}),
  };
}

/** Issued invoice/receipt lines that still show the list price pick up the net service price. */
export function applyNetServicePricesToDocument<T extends TransactionRow | null>(
  row: T,
  lines: readonly NetLine[],
): T {
  if (!row || !lines.length) return row;
  const byLabel = new Map<string, { amount: number; originalAmount: number }>();
  for (const line of lines) {
    const original = Number(line.originalAmount);
    if (!(original > line.amount)) continue;
    byLabel.set(line.label.trim().toLowerCase(), {
      amount: roundMoney(line.amount),
      originalAmount: roundMoney(original),
    });
  }
  if (!byLabel.size) return row;
  const document = row.document ? patchDocument(row.document, byLabel) : row.document;
  const issuedDocument = row.issuedDocument
    ? patchDocument(row.issuedDocument, byLabel)
    : row.issuedDocument;
  if (document === row.document && issuedDocument === row.issuedDocument) return row;
  return { ...row, document, issuedDocument };
}
