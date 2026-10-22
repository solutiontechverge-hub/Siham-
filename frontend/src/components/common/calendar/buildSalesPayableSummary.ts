import type { BookingFinanceViewModel } from "../booking-finance/bookingFinance.types";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";

export type SalesPayableLine = {
  id: string;
  label: string;
  amount: number;
  /** charge = due; credit = already paid / prepaid */
  tone?: "charge" | "credit";
};

export type SalesPayableSummary = {
  lines: SalesPayableLine[];
  /** Final amount the client still owes. */
  payable: number;
};

function money(n: number | undefined | null): number {
  const v = Number(n);
  return Number.isFinite(v) ? roundMoney(v) : 0;
}

function feeLabelFromLedger(row: {
  type: string;
  metadata?: Record<string, unknown> | null;
}): string {
  const meta = row.metadata ?? {};
  const reason = String(meta.reason ?? meta.feeKind ?? meta.source ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const label = String(meta.label ?? meta.entryLabel ?? "").toLowerCase();
  if (
    reason.includes("reschedule") ||
    label.includes("reschedule") ||
    reason === "late_rescheduling"
  ) {
    return "Reschedule Fee";
  }
  if (reason.includes("no_show") || label.includes("no-show") || label.includes("no show")) {
    return "No-Show Fee";
  }
  return "Cancellation Fee";
}

/**
 * Sticky Sales footer.
 * Charges = services + add-ons + protective fees only (the real total).
 * Prepayment is a formality credit against that total — refunds reduce the
 * credit, they must NOT be added again on top of services (that inflates due).
 * Cancelled: services dropped (never availed); payable = unpaid fees only.
 */
export function buildSalesPayableSummary(
  finance: BookingFinanceViewModel | null | undefined,
  opts?: { bookingStatus?: string | null },
): SalesPayableSummary | null {
  if (!finance) return null;

  const lines: SalesPayableLine[] = [];
  const base = money(finance.basePrice);
  const addOns = money(finance.addOnsTotal);
  const prepaid = money(finance.prepaymentTotal);
  const paidOther = Math.max(0, money(finance.totalPaid) - prepaid);
  const refunded = money(finance.totalRefunded);
  // Backend owns prepaid − refund math; UI only displays.
  const prepaidRefunded = money(finance.prepaidRefunded);
  const netPrepayCredit = money(finance.netPrepaymentCredit);
  const payableRaw = money(finance.amountDue);
  const bookingStatus = String(
    opts?.bookingStatus ?? finance.bookingStatus ?? "",
  ).toLowerCase();
  const isCancelledBooking =
    bookingStatus === "cancelled" || bookingStatus === "canceled";

  // Cancelled: drop service/add-on charges — client did not take them.
  const chargeBase = isCancelledBooking ? 0 : base;
  const chargeAddOns = isCancelledBooking ? 0 : addOns;

  if (chargeBase > 0) {
    lines.push({
      id: "services",
      label: "Services",
      amount: chargeBase,
      tone: "charge",
    });
  }
  if (chargeAddOns > 0) {
    lines.push({
      id: "addons",
      label: "Add-ons",
      amount: chargeAddOns,
      tone: "charge",
    });
  }

  // Split protective fees from ledger (cancel / reschedule / no-show).
  const feeBuckets = new Map<string, number>();
  for (const row of finance.ledger ?? []) {
    if (String(row.status).toLowerCase() !== "completed") continue;
    if (String(row.type).toUpperCase() !== "CANCELLATION_FEE") continue;
    const label = feeLabelFromLedger(row);
    feeBuckets.set(label, money((feeBuckets.get(label) ?? 0) + money(row.amount)));
  }
  if (feeBuckets.size === 0 && money(finance.cancellationFee) > 0) {
    feeBuckets.set("Cancellation Fee", money(finance.cancellationFee));
  }
  for (const [label, amount] of feeBuckets) {
    if (amount > 0) {
      lines.push({
        id: `fee-${label.toLowerCase().replace(/\s+/g, "-")}`,
        label,
        amount,
        tone: "charge",
      });
    }
  }

  const chargesTotal = roundMoney(
    lines
      .filter((line) => line.tone !== "credit")
      .reduce((sum, line) => sum + money(line.amount), 0),
  );
  if (chargesTotal > 0 && lines.length > 1) {
    lines.push({
      id: "charges-total",
      label: isCancelledBooking
        ? "Total (fees)"
        : "Total (services & products)",
      amount: chargesTotal,
      tone: "charge",
    });
  }

  // Never add refund as a charge — credit comes from API net_prepayment_credit.
  if (netPrepayCredit > 0) {
    lines.push({
      id: "prepayment-credit",
      label:
        prepaidRefunded > 0 || refunded > 0
          ? "Prepayment credit (after refund)"
          : "Prepayment credit",
      amount: -netPrepayCredit,
      tone: "credit",
    });
  }

  const paymentRows = (finance.ledger ?? []).filter(
    (row) =>
      String(row.status).toLowerCase() === "completed" &&
      String(row.type).toUpperCase() === "PAYMENT",
  );

  let paymentCredit = 0;
  if (paymentRows.length > 0) {
    paymentCredit = roundMoney(
      paymentRows.reduce((sum, row) => sum + money(row.amount), 0),
    );
    if (paymentCredit > 0) {
      lines.push({
        id: "payments",
        label: "Payments received",
        amount: -paymentCredit,
        tone: "credit",
      });
    }
  } else if (paidOther > 0) {
    paymentCredit = paidOther;
    lines.push({
      id: "payments",
      label: "Payments received",
      amount: -paidOther,
      tone: "credit",
    });
  }

  // Cancelled: amountDue may still include stale service balance — recompute from fees only.
  const payable = isCancelledBooking
    ? roundMoney(
        Math.max(0, chargesTotal - netPrepayCredit - paymentCredit),
      )
    : payableRaw;

  if (lines.length === 0 && payable <= 0) return null;

  return { lines, payable };
}
