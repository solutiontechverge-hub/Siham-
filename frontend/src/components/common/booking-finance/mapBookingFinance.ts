import type {
  BookingFinanceBadge,
  BookingFinanceViewModel,
  BookingFinancialsSnapshot,
  BookingLedgerLine,
  BookingPriceBreakdownRow,
} from "./bookingFinance.types";

function money(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function titleCaseAddonLabel(meta: Record<string, unknown> | null | undefined, index: number) {
  const name =
    (typeof meta?.name === "string" && meta.name.trim()) ||
    (typeof meta?.label === "string" && meta.label.trim()) ||
    (typeof meta?.title === "string" && meta.title.trim()) ||
    "";
  return name || `Add-on ${index + 1}`;
}

/**
 * Map ledger + aggregates → PAID / PARTIALLY_PAID / UNPAID / REFUNDED / CANCELLED (+ fee variants).
 */
export function deriveBookingFinanceBadge(input: {
  paymentStatus?: string | null;
  cancellationPaymentStatus?: string | null;
  bookingStatus?: string | null;
  totalPaid?: number;
  totalRefunded?: number;
  amountDue?: number;
  netTotal?: number;
}): BookingFinanceBadge {
  const bookingStatus = String(input.bookingStatus ?? "").toLowerCase();
  const cancelPay = String(
    input.cancellationPaymentStatus ?? input.paymentStatus ?? "",
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const paid = money(input.totalPaid);
  const refunded = money(input.totalRefunded);
  const due = money(input.amountDue);
  const net = money(input.netTotal);

  if (bookingStatus === "cancelled" || bookingStatus === "canceled") {
    if (cancelPay === "PENDING_FEE") return "PENDING_FEE";
    if (cancelPay === "PARTIALLY_REFUNDED") return "PARTIALLY_REFUNDED";
    if (cancelPay === "REFUNDED" || (refunded > 0 && refunded >= paid && paid > 0)) {
      return "REFUNDED";
    }
    if (due > 0) return "PENDING_FEE";
    return "CANCELLED";
  }

  if (cancelPay === "PENDING_FEE") return "PENDING_FEE";
  if (cancelPay === "PARTIALLY_REFUNDED") return "PARTIALLY_REFUNDED";
  if (cancelPay === "REFUNDED") return "REFUNDED";

  const raw = String(input.paymentStatus ?? "").trim().toLowerCase();
  if (raw === "refunded") return "REFUNDED";
  if (raw === "failed") return "UNPAID";
  if (raw === "prepaid") return paid > 0 && due > 0 ? "PARTIALLY_PAID" : "PREPAID";
  if (refunded > 0 && paid > 0 && refunded >= paid) return "REFUNDED";
  if (due <= 0 && (paid > 0 || net <= 0)) return "PAID";
  if (paid > 0 && due > 0) return "PARTIALLY_PAID";
  if (raw === "paid") return "PAID";
  if (raw === "unpaid" || raw === "payment due" || raw === "prepayment due") {
    return "UNPAID";
  }
  if (paid <= 0 && due > 0) return "UNPAID";
  return due > 0 ? "UNPAID" : "PAID";
}

export function bookingFinanceBadgeLabel(badge: BookingFinanceBadge): string {
  switch (badge) {
    case "PAID":
      return "Paid";
    case "PARTIALLY_PAID":
      return "Partially Paid";
    case "UNPAID":
      return "Unpaid";
    case "REFUNDED":
      return "Refunded";
    case "PARTIALLY_REFUNDED":
      return "Partially Refunded";
    case "PENDING_FEE":
      return "Pending Fee";
    case "CANCELLED":
      return "Cancelled";
    case "PREPAID":
      return "Prepaid";
  }
}

export function mapBookingFinanceResponse(data: {
  bookingId: string;
  uniqueCode?: string | null;
  financials?: BookingFinancialsSnapshot | null;
  statuses?: {
    payment_status?: string | null;
    prepayment_status?: string | null;
    booking_status?: string | null;
  } | null;
  ledger?: BookingLedgerLine[] | null;
  bookingStatus?: string | null;
}): BookingFinanceViewModel {
  const financials = data.financials ?? {};
  const ledger = Array.isArray(data.ledger) ? data.ledger : [];
  const completed = ledger.filter(
    (row) => String(row.status).toLowerCase() === "completed",
  );

  const addOnRows = completed.filter(
    (row) => String(row.type).toUpperCase() === "ADD_ON",
  );
  const addOnLines: BookingPriceBreakdownRow[] = addOnRows.map((row, index) => ({
    id: row.id || `addon-${index}`,
    label: titleCaseAddonLabel(row.metadata ?? undefined, index),
    amount: money(row.amount),
    tone: "default",
  }));

  const basePrice = money(
    financials.basePrice ?? (financials as { base_price?: number }).base_price,
  );
  const addOnsTotal = money(
    financials.add_ons ??
      (financials as { addOns?: number }).addOns ??
      addOnLines.reduce((s, r) => s + r.amount, 0),
  );
  const cancellationFee = money(
    financials.cancellation_fee ??
      (financials as { cancellationFee?: number }).cancellationFee,
  );
  const totalPaid = money(
    financials.total_paid ?? (financials as { totalPaid?: number }).totalPaid,
  );
  const totalRefunded = money(
    financials.total_refunded ??
      (financials as { totalRefunded?: number }).totalRefunded,
  );
  const netTotal = money(
    financials.net_total ?? (financials as { netTotal?: number }).netTotal,
  );
  const amountDue = money(
    financials.outstanding_balance ??
      (financials as { outstandingBalance?: number }).outstandingBalance,
  );
  const prepaymentTotal = money(financials.prepayment_total);
  const paymentTotal = money(financials.payment_total);
  const prepaidRefunded = money(
    financials.prepaid_refunded ??
      (financials as { prepaidRefunded?: number }).prepaidRefunded,
  );
  const netPrepaymentCredit = money(
    financials.net_prepayment_credit ??
      (financials as { netPrepaymentCredit?: number }).netPrepaymentCredit,
  );
  const subtotal = money(financials.subtotal ?? basePrice + addOnsTotal);
  const bookingStatus =
    data.bookingStatus ?? data.statuses?.booking_status ?? null;
  const paymentStatusRaw =
    financials.cancellation_payment_status ??
    financials.payment_status ??
    data.statuses?.payment_status ??
    null;

  const badge = deriveBookingFinanceBadge({
    paymentStatus: paymentStatusRaw,
    cancellationPaymentStatus: financials.cancellation_payment_status,
    bookingStatus,
    totalPaid,
    totalRefunded,
    amountDue,
    netTotal,
  });

  const breakdownRows: BookingPriceBreakdownRow[] = [
    ...(basePrice > 0
      ? [{ id: "base-price", label: "Base Price", amount: basePrice }]
      : []),
    ...addOnLines,
    ...(cancellationFee > 0
      ? [
          {
            id: "cancellation-fee",
            label: "Cancellation Fee",
            amount: cancellationFee,
            tone: "due" as const,
          },
        ]
      : []),
    ...(prepaymentTotal > 0
      ? [
          {
            id: "prepayment",
            label: "Prepayment",
            amount: prepaymentTotal,
            tone: "paid" as const,
          },
        ]
      : []),
    ...(paymentTotal > 0
      ? [
          {
            id: "payments",
            label: "Payments",
            amount: paymentTotal,
            tone: "paid" as const,
          },
        ]
      : []),
    ...(totalPaid > 0
      ? [
          {
            id: "total-paid",
            label: "Total Paid",
            amount: totalPaid,
            tone: "paid" as const,
          },
        ]
      : []),
    ...(totalRefunded > 0
      ? [
          {
            id: "total-refunded",
            label: "Total Refunded",
            amount: -totalRefunded,
            tone: "refund" as const,
          },
        ]
      : []),
    {
      id: "amount-due",
      label: "Amount Due",
      amount: amountDue,
      tone: amountDue > 0 ? ("due" as const) : ("paid" as const),
    },
  ];

  const normalizedFinancials: BookingFinancialsSnapshot = {
    ...financials,
    basePrice,
    add_ons: addOnsTotal,
    cancellation_fee: cancellationFee,
    total_paid: totalPaid,
    total_refunded: totalRefunded,
    net_total: netTotal,
    outstanding_balance: amountDue,
    prepayment_total: prepaymentTotal,
    payment_total: paymentTotal,
    prepaid_refunded: prepaidRefunded,
    net_prepayment_credit: netPrepaymentCredit,
    subtotal,
    payment_status: paymentStatusRaw ? String(paymentStatusRaw) : financials.payment_status,
    cancellation_payment_status: financials.cancellation_payment_status,
    updatedAt: financials.updatedAt ?? new Date().toISOString(),
  };

  return {
    bookingId: data.bookingId,
    uniqueCode: data.uniqueCode ?? null,
    basePrice,
    addOnsTotal,
    addOnLines,
    cancellationFee,
    discounts: money((financials as { discounts?: number }).discounts),
    subtotal,
    netTotal,
    totalPaid,
    prepaymentTotal,
    paymentTotal,
    prepaidRefunded,
    netPrepaymentCredit,
    totalRefunded,
    amountDue,
    badge,
    paymentStatusRaw: paymentStatusRaw ? String(paymentStatusRaw) : null,
    bookingStatus: bookingStatus ? String(bookingStatus) : null,
    breakdownRows,
    financials: normalizedFinancials,
    ledger,
  };
}
