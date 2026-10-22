import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  isRefundableTransactionStatus,
  isTransactionOnlinePayment,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  formatCurrencyDisplay,
  parseCurrencyValue,
} from "../../common/finance-documents/financeDocumentUtils";
import {
  matchesFinanceBooking,
  salesCardKindToPaymentPhase,
} from "../../common/finance-documents/findIssuedFinanceTransaction";
import {
  isProtectiveFeeEntryLabel,
  isProtectiveFeeLineDescription,
} from "../../common/finance-documents/protectiveFeeInvoice";

export type RefundSalesItem = {
  id: string;
  name: string;
  meta: string;
  amount?: number;
  /** finance_transactions.id when this line came from a finance document */
  transactionId?: string;
};

export type RefundBankDetails = {
  accountHolder: string;
  iban: string;
};

export type RefundSalesSavePayload = {
  mode: "item" | "amount";
  itemIds: string[];
  /** Resolved drawer lines (include transactionId when hydrated from finance). */
  items: RefundSalesItem[];
  amount: number;
  method?: string;
  reason?: string;
  /** Required when original payment was offline and refund method is Online. */
  bankDetails?: RefundBankDetails;
};

export type RefundCardMatch = {
  bookingId?: string | null;
  bookingCode?: string | null;
  kind?: string | null;
  financeTransactionId?: string | null;
  title?: string | null;
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

export type RefundMethodValue = (typeof REFUND_METHOD_OPTIONS)[number]["value"];

/** Map sales-card / checkout paymentMethod → drawer refund method value. */
export function refundMethodFromPaymentMethod(
  method?: string | null,
): RefundMethodValue | "" {
  const value = String(method ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  if (!value) return "";
  if (value.includes("invoice") || value.includes("nondirect")) {
    return value.startsWith("offline")
      ? "offline-non-direct"
      : "online-non-direct";
  }
  if (value.startsWith("offline")) return "offline-direct";
  if (value.startsWith("online")) return "online-direct";
  return "";
}

/** Map finance_transactions.method_title → drawer refund method value. */
export function refundMethodFromMethodTitle(
  methodTitle?: string | null,
): RefundMethodValue | "" {
  const t = String(methodTitle ?? "")
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, "-");
  if (!t) return "";
  const online = t.startsWith("online");
  const offline = t.startsWith("offline");
  if (!online && !offline) return "";
  const invoice =
    t.includes("invoice") || t.includes("non-direct") || t.includes("non direct");
  if (online) return invoice ? "online-non-direct" : "online-direct";
  return invoice ? "offline-non-direct" : "offline-direct";
}

export function isOnlineRefundMethod(method?: string | null): boolean {
  return String(method ?? "")
    .trim()
    .toLowerCase()
    .startsWith("online");
}

/**
 * Prefill / lock destination from original charge.
 * Finance row methodTitle wins; sales-card paymentMethod is fallback.
 */
export function resolvePreferredRefundMethod(
  rows: readonly TransactionRow[],
  cardPaymentMethod?: string | null,
): RefundMethodValue | "" {
  for (const row of rows) {
    const fromTitle = refundMethodFromMethodTitle(row.methodTitle);
    if (fromTitle) return fromTitle;
  }
  return refundMethodFromPaymentMethod(cardPaymentMethod);
}

export function isOriginalOnlineCharge(
  rows: readonly TransactionRow[],
  cardPaymentMethod?: string | null,
): boolean {
  if (rows.some((row) => isTransactionOnlinePayment(row.methodTitle))) {
    return true;
  }
  return isOnlineRefundMethod(
    resolvePreferredRefundMethod(rows, cardPaymentMethod),
  );
}

/** Amounts a full-row refund may match (net, paid snapshot, line sum). */
export function refundableRowMatchAmounts(row: TransactionRow): number[] {
  const amounts = [Number(row.netAmount) || 0];
  const doc = row.issuedDocument ?? row.document;
  if (doc?.paidAmount != null) amounts.push(Number(doc.paidAmount) || 0);
  if (doc?.totalPrice != null) amounts.push(Number(doc.totalPrice) || 0);
  if (doc?.prepaymentAmount != null) {
    amounts.push(Number(doc.prepaymentAmount) || 0);
  }
  const bookingSum = (doc?.bookingItems ?? []).reduce(
    (sum, item) => sum + parseCurrencyValue(item.value),
    0,
  );
  if (bookingSum > 0) amounts.push(bookingSum);
  const lineSum = (doc?.lineItems ?? []).reduce(
    (sum, item) => sum + (Number(item.totalPrice) || 0),
    0,
  );
  if (lineSum > 0) amounts.push(lineSum);
  return [...new Set(amounts.filter((n) => Number.isFinite(n) && n > 0))];
}

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

export function moneyEq(a: number, b: number): boolean {
  return Math.abs(Number(a) - Number(b)) < 0.005;
}

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
  const txId = String(row.id);
  const doc = rowDocument(row);
  const bookingItems = doc?.bookingItems;
  if (bookingItems?.length) {
    return bookingItems.map((item, index) => ({
      id: `${idPrefix}-booking-${index}`,
      name: item.label,
      meta: formatCurrencyDisplay(item.value),
      amount: parseCurrencyValue(item.value),
      transactionId: txId,
    }));
  }

  const lineItems = doc?.lineItems;
  if (lineItems?.length) {
    return lineItems.map((item, index) => ({
      id: `${idPrefix}-line-${index}`,
      name: item.description,
      meta: formatCurrencyDisplay(item.totalPrice),
      amount: parseCurrencyValue(item.totalPrice),
      transactionId: txId,
    }));
  }

  // Row with no line breakdown — still refundable as a whole.
  return [
    {
      id: `${idPrefix}-row`,
      name: row.entryLabel || "Sale",
      meta: formatCurrencyDisplay(row.netAmount),
      amount: Number(row.netAmount) || 0,
      transactionId: txId,
    },
  ];
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

/**
 * First-wins dedupe by name+amount. Prefer the variant that already has a
 * finance transactionId when the same line appears in multiple groups.
 */
export function mergeRefundSalesItems(
  ...groups: Array<readonly RefundSalesItem[]>
): RefundSalesItem[] {
  const byKey = new Map<string, RefundSalesItem>();
  for (const group of groups) {
    for (const item of group) {
      const key = `${item.name}\0${item.amount ?? 0}`;
      const prev = byKey.get(key);
      if (!prev) {
        byKey.set(key, item);
        continue;
      }
      if (!prev.transactionId && item.transactionId) {
        byKey.set(key, { ...prev, transactionId: item.transactionId });
      }
    }
  }
  return [...byKey.values()];
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

/** Paid/Prepaid finance rows that belong to this Sales card. */
export function filterRefundableCardRows(
  rows: readonly TransactionRow[],
  card: RefundCardMatch,
): TransactionRow[] {
  if (card.financeTransactionId) {
    const linked = rows.find(
      (row) =>
        String(row.id) === String(card.financeTransactionId) &&
        isRefundableTransactionStatus(row.status),
    );
    // Add-on summary cards may span multiple addon txs — keep scanning below.
    if (linked && card.kind !== "addon") return [linked];
  }

  const phase = salesCardKindToPaymentPhase(card.kind);
  const protectiveFee =
    card.title === "Fee Summary" || card.title === "No-Show Fee Invoice"
      ? true
      : card.kind === "after_treatment"
        ? false
        : undefined;

  return rows.filter((row) => {
    if (!isRefundableTransactionStatus(row.status)) return false;
    if (!matchesFinanceBooking(row, card.bookingId, card.bookingCode)) {
      return false;
    }
    const rowPhase = (
      rowDocument(row) as { paymentPhase?: string } | undefined
    )?.paymentPhase;
    if (card.kind === "addon") return rowPhase === "addon";
    if (phase === "prepay") {
      if (isFeeFinanceRow(row)) return false;
      return rowPhase === "prepay" || !rowPhase;
    }
    if (phase === "full") {
      const fee = isFeeFinanceRow(row);
      if (protectiveFee === true) return fee;
      if (protectiveFee === false && fee) return false;
      return rowPhase === "full" || !rowPhase;
    }
    return true;
  });
}

function formatAmountList(rows: readonly TransactionRow[]): string {
  return rows
    .map((row) => `€${Number(row.netAmount || 0).toFixed(2)}`)
    .join(" or ");
}

/**
 * Map drawer Item/Amount selection → finance_transactions ids for bulk refund.
 * Partial amounts are not supported by the backend (full net_amount only).
 */
export function resolveRefundTargetIds(opts: {
  mode: "item" | "amount";
  itemIds: readonly string[];
  amount: number;
  items: readonly RefundSalesItem[];
  refundableRows: readonly TransactionRow[];
}): { ids: string[] } | { error: string } {
  const rows = opts.refundableRows;
  if (!rows.length) {
    return {
      error:
        "No Paid/Prepaid finance transactions found for this sale yet. Wait for them to load, then try again.",
    };
  }

  if (opts.mode === "amount") {
    const amount = Number(opts.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Enter a refund amount greater than zero." };
    }
    const exactNet = rows.filter((row) =>
      moneyEq(Number(row.netAmount), amount),
    );
    if (exactNet.length) {
      return { ids: exactNet.map((row) => String(row.id)) };
    }
    const bySnapshot = rows.filter((row) =>
      refundableRowMatchAmounts(row).some((candidate) =>
        moneyEq(candidate, amount),
      ),
    );
    if (bySnapshot.length === 1) {
      return { ids: [String(bySnapshot[0].id)] };
    }
    if (bySnapshot.length > 1) {
      // Ambiguous same-amount rows — refund all exact matches (same as net path).
      return { ids: bySnapshot.map((row) => String(row.id)) };
    }
    const sum = rows.reduce((s, row) => s + Number(row.netAmount || 0), 0);
    if (moneyEq(sum, amount)) return { ids: rows.map((row) => String(row.id)) };
    return {
      error: `Partial amount refunds aren't supported. Enter a full transaction amount (${formatAmountList(rows)}) or use Refund by Item.`,
    };
  }

  if (!opts.itemIds.length) {
    return { error: "Select at least one item to refund." };
  }

  const ids = new Set<string>();
  const rowIdSet = new Set(rows.map((row) => String(row.id)));

  for (const itemId of opts.itemIds) {
    const item = opts.items.find((entry) => entry.id === itemId);
    if (item?.transactionId && rowIdSet.has(String(item.transactionId))) {
      ids.add(String(item.transactionId));
      continue;
    }
    const prefixed = /^(.*?)-(?:booking|line|row)-\d+$/.exec(itemId);
    if (prefixed && rowIdSet.has(prefixed[1])) {
      ids.add(prefixed[1]);
      continue;
    }
    if (item) {
      const byLine = rows.find((row) =>
        itemsFromRow(row, String(row.id)).some(
          (line) =>
            line.name === item.name && moneyEq(line.amount ?? 0, item.amount ?? 0),
        ),
      );
      if (byLine) {
        ids.add(String(byLine.id));
        continue;
      }
    }
  }

  if (!ids.size && rows.length === 1) {
    // Fallback sale lines with no finance id yet, but one clear Paid row.
    return { ids: [String(rows[0].id)] };
  }

  if (!ids.size) {
    return {
      error:
        "Could not map selected items to finance transactions. Wait for finance rows to load, or refund the full amount.",
    };
  }

  return { ids: [...ids] };
}
