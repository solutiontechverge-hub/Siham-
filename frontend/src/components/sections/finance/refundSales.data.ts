import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  formatCurrencyDisplay,
  parseCurrencyValue,
} from "../../common/finance-documents/financeDocumentUtils";
import {
  isProtectiveFeeEntryLabel,
  isProtectiveFeeLineDescription,
} from "../../common/finance-documents/protectiveFeeInvoice";

export type RefundSalesItem = {
  id: string;
  name: string;
  meta: string;
  amount?: number;
};

export const DEFAULT_REFUND_ITEMS: RefundSalesItem[] = [
  { id: "buzz-cut", name: "Buzz Cut", meta: "45 Mins • €25" },
  { id: "scissor-cut", name: "Scissor Cut", meta: "60 Mins • €35" },
  { id: "hair-wash", name: "Hair Wash Style", meta: "30 Mins • €20" },
];

export const REFUND_METHOD_OPTIONS = [
  { value: "online-direct", label: "Online Direct" },
  { value: "online-non-direct", label: "Online Non-Direct" },
  { value: "offline-direct", label: "Offline Direct" },
  { value: "offline-non-direct", label: "Offline Non-Direct" },
] as const;

export const REFUND_REASON_OPTIONS_ITEM = [
  { value: "accidental-charge", label: "Accidental Charge" },
  { value: "incorrect-amount", label: "Incorrect Amount" },
  { value: "duplicate-transaction", label: "Duplicate Transaction" },
  { value: "client-request", label: "Client Request" },
  { value: "other", label: "Other" },
] as const;

export const REFUND_REASON_OPTIONS_AMOUNT = [
  { value: "accidental-charge", label: "Accidental Charge" },
  { value: "incorrect-amount", label: "Incorrect Amount" },
  { value: "duplicate-transaction", label: "Duplicate Transaction" },
  { value: "client-request", label: "Client Request" },
  { value: "write-reason", label: "Write Reason" },
] as const;

function rowDocument(row: TransactionRow) {
  return row.issuedDocument ?? row.document;
}

function isFeeFinanceRow(row: TransactionRow): boolean {
  if (isProtectiveFeeEntryLabel(row.entryLabel)) return true;
  const lines = rowDocument(row)?.lineItems ?? [];
  return lines.some((line) =>
    isProtectiveFeeLineDescription(line?.description),
  );
}

function itemsFromRow(row: TransactionRow, idPrefix: string): RefundSalesItem[] {
  const doc = rowDocument(row);
  const bookingItems = doc?.bookingItems;
  if (bookingItems?.length) {
    return bookingItems.map((item, index) => ({
      id: `${idPrefix}-booking-${index}`,
      name: item.label,
      meta: formatCurrencyDisplay(item.value),
      amount: parseCurrencyValue(item.value),
    }));
  }

  const lineItems = doc?.lineItems;
  if (lineItems?.length) {
    return lineItems.map((item, index) => ({
      id: `${idPrefix}-line-${index}`,
      name: item.description,
      meta: formatCurrencyDisplay(item.totalPrice),
      amount: parseCurrencyValue(item.totalPrice),
    }));
  }

  return [];
}

/** Deduped Refund-by-Item rows from Sales card lines (services / products / fees). */
export function refundItemsFromSaleLines(
  lines: readonly { id: string; label: string; amount: number }[],
): RefundSalesItem[] {
  return mergeRefundSalesItems(
    lines.map((line) => ({
      id: line.id,
      name: line.label,
      meta: `€${Number(line.amount).toFixed(2)}`,
      amount: line.amount,
    })),
  );
}

/** First-wins dedupe by name+amount (card lines, then finance rows). */
export function mergeRefundSalesItems(
  ...groups: Array<readonly RefundSalesItem[]>
): RefundSalesItem[] {
  const seen = new Set<string>();
  const out: RefundSalesItem[] = [];
  for (const group of groups) {
    for (const item of group) {
      const key = `${item.name}\0${item.amount ?? 0}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

/**
 * Build Refund-by-Item options from finance rows.
 * Scans all rows (not only [0]): sale/booking lines first, protective fees still included.
 */
export function refundItemsFromTransactions(
  rows: readonly TransactionRow[],
): RefundSalesItem[] {
  if (!rows.length) return [];
  const ordered = [...rows].sort(
    (a, b) => Number(isFeeFinanceRow(a)) - Number(isFeeFinanceRow(b)),
  );
  const seen = new Set<string>();
  const out: RefundSalesItem[] = [];
  for (const row of ordered) {
    const prefix = String(row.id ?? out.length);
    for (const item of itemsFromRow(row, prefix)) {
      const key = `${item.name}\0${item.amount ?? 0}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}
