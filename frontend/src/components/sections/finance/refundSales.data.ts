import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { formatCurrencyDisplay } from "../../common/finance-documents/financeDocumentUtils";

export type RefundSalesItem = {
  id: string;
  name: string;
  meta: string;
  amount?: number;
};

function moneyAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;
}

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

export function refundItemsFromTransactions(rows: readonly TransactionRow[]): RefundSalesItem[] {
  const primary = rows[0];
  const bookingItems = primary?.document?.bookingItems;
  if (bookingItems?.length) {
    return bookingItems.map((item, index) => {
      const amount = moneyAmount(item.value);
      return {
        id: `booking-${index}`,
        name: item.label,
        meta: formatCurrencyDisplay(amount),
        amount,
      };
    });
  }

  const lineItems = primary?.document?.lineItems;
  if (lineItems?.length) {
    return lineItems.map((item, index) => {
      const amount = moneyAmount(item.totalPrice);
      return {
        id: `line-${index}`,
        name: item.description,
        meta: formatCurrencyDisplay(amount),
        amount,
      };
    });
  }

  return [];
}
