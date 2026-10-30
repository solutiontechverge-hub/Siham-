/**
 * Client After Treatment Payment rows from pro checkout splitBill + finance.
 * Empty until checkout has run (see hasAfterTreatmentCheckoutSignal).
 */
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { formatFinanceMethodLabel } from "../booking-finance/formatBookingFinance";
import { isOfflinePaymentMethod } from "../client-booking/checkoutPaymentOptions";
import { findIssuedFinanceTransaction } from "../finance-documents/findIssuedFinanceTransaction";
import { isProtectiveFeeEntryLabel } from "../finance-documents/protectiveFeeInvoice";
import type { SalesPayerRole } from "./salesOverview.types";
import {
  type BookingSplitBillState,
  type BookingSplitPayerRecord,
} from "./salesSplitBill";

export type AfterTreatmentPayerRow = {
  payerKey: string;
  role: SalesPayerRole;
  labelName: string;
  amount: number;
  methodRaw: string | null;
  methodLabel: string;
  statusLabel: "Paid" | "Pending" | "Payment Due" | "Overdue";
  showPayNow: boolean;
  showInvoice: boolean;
  showReceipt: boolean;
  note?: string;
  financeTransactionId?: string | null;
};

function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function payerLabelName(
  payer: Pick<BookingSplitPayerRecord, "role" | "displayName" | "label">,
) {
  if (payer.role === "main_client") return "Main Client";
  const raw = String(payer.displayName || payer.label || "").trim() || "Guest";
  if (payer.role === "model") {
    return raw.toLowerCase().startsWith("model") ? raw : `Model ${raw}`;
  }
  return raw.toLowerCase().startsWith("guest") ? raw : `Guest ${raw}`;
}

function normalizeMethod(raw?: string | null): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

/** Online Direct (client Pay Now) — not invoice/non-direct. */
export function isOnlineDirectMethod(raw?: string | null): boolean {
  const v = normalizeMethod(raw);
  if (!v) return false;
  if (v.includes("invoice") || v.includes("nondirect")) return false;
  if (v.startsWith("offline")) return false;
  return (
    v === "onlinedirect" ||
    v === "online" ||
    v.includes("onlinedirect")
  );
}

function financeRowForPayer(
  rows: readonly TransactionRow[],
  opts: {
    bookingId?: string | null;
    bookingCode?: string | null;
    payerKey: string;
  },
): TransactionRow | null {
  const matches = rows.filter((row) => {
    const doc = (row.issuedDocument ?? row.document) as
      | { payerKey?: string; paymentPhase?: string }
      | undefined;
    if (isProtectiveFeeEntryLabel(row.entryLabel)) return false;
    if (doc?.paymentPhase === "prepay") return false;
    const status = String(row.status ?? "").toLowerCase();
    if (status === "voided" || status === "refunded") return false;
    return String(doc?.payerKey ?? "") === opts.payerKey;
  });
  // Prefer Paid so a voided/reissue Pending sibling does not hide settlement.
  const keyed =
    matches.find((row) => {
      const s = String(row.status ?? "").toLowerCase();
      return s === "paid" || s === "prepaid";
    }) ?? matches[0];
  if (keyed) return keyed;
  if (opts.payerKey !== "main-client" && opts.payerKey !== "main_client") {
    return null;
  }
  return findIssuedFinanceTransaction(rows, {
    bookingId: opts.bookingId,
    bookingCode: opts.bookingCode,
    phase: "full",
    protectiveFee: false,
  });
}

function statusFromFinance(
  row: TransactionRow | null,
): "Paid" | "Pending" | null {
  if (!row) return null;
  const s = String(row.status ?? "").toLowerCase();
  if (s === "paid" || s === "prepaid") return "Paid";
  if (s === "pending") return "Pending";
  return null;
}

/** True once pro checkout has produced after-treatment state (not mere confirm/complete). */
export function hasAfterTreatmentCheckoutSignal(input: {
  splitBill: BookingSplitBillState | null;
  waitingForPayment?: boolean;
  financeHasAfterTreatmentTx?: boolean;
  /** @deprecated unused — In Progress after checkout still shows AT via splitBill/finance */
  postCheckoutCompleted?: boolean;
}): boolean {
  // splitBill is written only by pro BookingCheckoutFlow.
  if (input.splitBill?.payers?.length) return true;
  // Explicit AT finance rows from checkout (entryLabel After treatment · …).
  if (input.financeHasAfterTreatmentTx) return true;
  // Non-direct / unpaid online after checkout stamps this flag.
  if (input.waitingForPayment) return true;
  return false;
}

export function bookingSharesIncludeGuestOrModel(
  shares: ReadonlyArray<{ role: SalesPayerRole }>,
): boolean {
  return shares.some((s) => s.role === "guest" || s.role === "model");
}

export function resolveAfterTreatmentPayerRows(input: {
  splitBill: BookingSplitBillState | null;
  bookingPaymentMethod?: string | null;
  bookingPaid?: boolean;
  paymentDue?: boolean;
  paymentOverdue?: boolean;
  invoiceDueDateLabel?: string | null;
  financeRows?: readonly TransactionRow[];
  bookingId?: string | null;
  bookingCode?: string | null;
  /** Fallback amount when single checkout has no split paymentAmount. */
  fallbackMainAmount?: number;
  enabled: boolean;
}): AfterTreatmentPayerRow[] {
  if (!input.enabled) return [];

  const rows = input.financeRows ?? [];
  const payers: BookingSplitPayerRecord[] = input.splitBill?.payers?.length
    ? input.splitBill.payers.filter(
        (p) => roundMoney(p.paymentAmount) > 0 || Boolean(p.paid),
      )
    : [
        {
          key: "main-client",
          role: "main_client",
          label: "Main Client",
          displayName: "Main Client",
          subtotal: input.fallbackMainAmount ?? 0,
          paymentAmount: input.fallbackMainAmount ?? 0,
          lineIds: [],
          paid: Boolean(input.bookingPaid) && !input.paymentDue,
          paymentMethod: input.bookingPaymentMethod ?? null,
        },
      ];

  return payers.map((payer) => {
    const methodRaw =
      payer.paymentMethod || input.bookingPaymentMethod || null;
    const methodLabel = formatFinanceMethodLabel(methodRaw);
    const offline = isOfflinePaymentMethod(methodRaw);
    const onlineDirect = isOnlineDirectMethod(methodRaw);
    const financeRow = financeRowForPayer(rows, {
      bookingId: input.bookingId,
      bookingCode: input.bookingCode,
      payerKey: payer.key,
    });
    const financeStatus = statusFromFinance(financeRow);

    // Notes.paid (client Pay Now) or finance Paid. Pending finance only blocks when notes unpaid.
    let paid = Boolean(payer.paid) || financeStatus === "Paid";
    if (offline && methodRaw) paid = true;
    if (!payer.paid && financeStatus === "Pending") paid = false;

    let statusLabel: AfterTreatmentPayerRow["statusLabel"] = paid
      ? "Paid"
      : input.paymentOverdue
        ? "Overdue"
        : input.paymentDue && !onlineDirect
          ? "Payment Due"
          : "Pending";
    if (financeStatus === "Pending" && !paid) statusLabel = "Pending";
    if (paid) statusLabel = "Paid";

    const amount =
      roundMoney(payer.paymentAmount) > 0
        ? roundMoney(payer.paymentAmount)
        : financeRow
          ? roundMoney(Number(financeRow.netAmount) || 0)
          : roundMoney(input.fallbackMainAmount ?? 0);

    return {
      payerKey: payer.key,
      role: payer.role,
      labelName: payerLabelName(payer),
      amount,
      methodRaw,
      methodLabel,
      statusLabel,
      showPayNow: onlineDirect && !paid && !input.paymentOverdue,
      showInvoice: paid,
      showReceipt: paid,
      note:
        !paid && input.paymentOverdue
          ? "Due date passed — please wait while the professional reissues your invoice."
          : !paid && input.paymentDue && input.invoiceDueDateLabel
            ? `Due date ${input.invoiceDueDateLabel}`
            : undefined,
      financeTransactionId: financeRow?.id ?? null,
    };
  });
}
