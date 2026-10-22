import type { CalendarBooking } from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  calculateManualEntryDiscountAmount,
  lineTotal,
  type ManualEntryDiscount,
} from "../../sections/finance/manualEntry.data";
import {
  parseApiCalendarEventId,
  parseCalendarEntryNotes,
  parseBookingFinancialsFromNotes,
  resolveKilometerAllowanceAmount,
  type BookingFinancialsSnapshot,
} from "./bookingEventDetails";
import { isBookingRequestRejected } from "./bookingStatus";
import { getSalesCardMeta, resolveLiveCardId } from "./salesOverview.storage";
import type {
  SalesAddonRecord,
  SalesCardMetaRecord,
  SalesCheckoutPaymentMethod,
  SalesClientKind,
  SalesFinanceHint,
  SalesLineItem,
  SalesOverviewCardData,
  SalesPaymentState,
  SalesPaymentTermsInput,
  SalesPenaltyPrompt,
  SalesSubCardData,
} from "./salesOverview.types";
import { financeStatusToSalesPaymentState } from "./salesOverview.types";
import { buildSplitPaymentAmounts, parseSplitBillState, resolveSalesPayerShares } from "./salesSplitBill";
import {
  formatFinanceDueDate,
  prepaidBreakdownLabel,
} from "../booking-finance/formatBookingFinance";
import {
  bookingFinanceBadgeLabel,
  deriveBookingFinanceBadge,
} from "../booking-finance/mapBookingFinance";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";
import { computeBookingPrice } from "./bookingTotal";
import {
  formatProtectiveFeeLineDescription,
  isProtectiveFeeEntryLabel,
  LATE_CANCELLATION_BOOKING_FEE,
  LATE_RESCHEDULING_FEE,
} from "../finance-documents/protectiveFeeInvoice";
import {
  applyVisualState,
  discountLine,
  formatDateTimeLabel,
  formatMethodDateTime,
  isInvoicePaymentMethod,
  isOnlineBookingType,
  isOnlineDirectPayment,
  isAutomaticTrigger,
  isDueDatePast,
  matchFinanceHint,
  paymentMethodLabel,
  resolvePenaltyPrompt,
  deriveDueDate,
  toIsoDateOnly,
  addDaysToIsoDate,
  durationToDays,
} from "./buildSalesOverviewCards.format";

function isSettledProtectiveFeeStatus(status?: string | null): boolean {
  const s = String(status ?? "").toLowerCase();
  return s === "paid" || s === "prepaid" || s === "confirmed";
}

/** Open protective-fee invoice (Payment Due / pending) — still drives Fee Summary UI. */
function isOpenProtectiveFeeStatus(status?: string | null): boolean {
  const s = String(status ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();
  return (
    s === "payment due" ||
    s === "pending" ||
    s === "unpaid" ||
    s === "overdue" ||
    s === "partially paid"
  );
}

function isDisplayableProtectiveFeeStatus(status?: string | null): boolean {
  return (
    isSettledProtectiveFeeStatus(status) || isOpenProtectiveFeeStatus(status)
  );
}

/** Reconstruct booking services base from Paid fee amount ÷ % (cancel may store fee-only total_price). */
function recoverBookingBaseFromFeeHints(
  hints: readonly SalesFinanceHint[],
  percents: {
    lateCancel?: string | number | null;
    lateReschedule?: string | number | null;
    noShow?: string | number | null;
  },
): number {
  let best = 0;
  for (const hint of hints) {
    const amount = Number(hint.amount) || 0;
    if (amount <= 0) continue;
    const label = String(hint.entryLabel ?? "").trim();
    const pct =
      label === LATE_RESCHEDULING_FEE
        ? Number(percents.lateReschedule) || 0
        : label.toLowerCase() === "no-show fee"
          ? Number(percents.noShow) || 0
          : Number(percents.lateCancel) || 0;
    if (pct <= 0) continue;
    best = Math.max(best, roundMoney(amount / (pct / 100)));
  }
  return best;
}

export type BuilderCtx = {
  financeHints: SalesFinanceHint[];
  paymentTerms?: SalesPaymentTermsInput;
  /** Business setup `late_cancellation_fee_percentage` — heal Fee Summary when booking stamp/LCF missing. */
  lateCancellationFeePercentDefault?: string | number | null;
  /** Live GET /bookings/:id/financials — preferred over notes.financials stamp. */
  liveFinancials?: BookingFinancialsSnapshot | null;
};
function buildLinesFromEvent(event: CalendarEvent): { lines: SalesLineItem[]; subtotal: number } {
  const details = event.details;
  const lines: SalesLineItem[] = [];
  let subtotal = 0;

  const snapshotServices = details?.clientSnapshot?.services;
  if (snapshotServices?.length) {
    snapshotServices.forEach((service, index) => {
      // Same catalog service can appear for main + guest — keep line keys unique.
      const lineId = `${service.id}::${String(service.guestId ?? "")}::${index}`;
      lines.push({
        id: lineId,
        label: service.name,
        amount: roundMoney(service.price),
      });
      subtotal += service.price;
    });
  } else {
    for (const service of details?.services ?? []) {
      lines.push({ id: service.id, label: service.name, amount: roundMoney(service.price) });
      subtotal += service.price;
    }
    for (const guest of details?.guests ?? []) {
      for (const [index, service] of (guest.services ?? []).entries()) {
        // Same catalog id on main + guest must both survive — composite keys.
        const lineId = `${service.id}::${String(guest.id)}::${index}`;
        lines.push({ id: lineId, label: service.name, amount: roundMoney(service.price) });
        subtotal += service.price;
      }
      for (const [index, product] of (guest.products ?? []).entries()) {
        const lineId = `${product.id}::${String(guest.id)}::${index}`;
        const amount = roundMoney(product.price);
        lines.push({
          id: lineId,
          label: product.quantity > 1 ? `${product.name} ×${product.quantity}` : product.name,
          amount,
        });
        subtotal += product.price;
      }
    }
  }

  for (const product of details?.products ?? []) {
    if (lines.some((line) => line.id === product.id)) continue;
    const amount = roundMoney(product.price);
    lines.push({
      id: product.id,
      label: product.quantity > 1 ? `${product.name} ×${product.quantity}` : product.name,
      amount,
    });
    subtotal += product.price;
  }

  const kmAmount = resolveKilometerAllowanceAmount(details?.kilometerAllowance);
  if (kmAmount > 0) {
    lines.push({
      id: "kilometer-allowance",
      label: "Kilometer Allowance",
      amount: roundMoney(kmAmount),
    });
    subtotal += kmAmount;
  }

  const discount = discountLine(details?.totalDiscount ?? null, subtotal);
  if (discount) {
    lines.push(discount);
    subtotal += discount.amount;
  }

  return { lines, subtotal: roundMoney(Math.max(0, subtotal)) };
}

/** Keep booking discount rows on the payer card so Total matches listed lines. */
function withNegativeLines(
  shareLines: SalesLineItem[],
  allLines: SalesLineItem[],
): SalesLineItem[] {
  const negatives = allLines.filter((line) => line.amount < 0);
  if (!negatives.length) return shareLines;
  const seen = new Set(shareLines.map((line) => line.id));
  return [
    ...shareLines,
    ...negatives.filter((line) => !seen.has(line.id)),
  ];
}

function sumLineAmounts(lines: SalesLineItem[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
}

/** Align Sales summary cards with server ledger aggregates (notes.financials / live GET). */
export function applyLedgerFinancialsToCards(
  cards: SalesOverviewCardData[],
  financials: BookingFinancialsSnapshot | null | undefined,
  opts?: { bookingStatus?: string | null },
): SalesOverviewCardData[] {
  if (!financials) return cards;
  const net = financials.net_total;
  const outstanding = financials.outstanding_balance;
  const refunded = financials.total_refunded ?? 0;
  const prepay = financials.prepayment_total;
  const paid = financials.total_paid ?? 0;
  const cancelFee = financials.cancellation_fee ?? 0;
  const basePrice = financials.basePrice;
  const addOns = financials.add_ons ?? 0;

  const badge = deriveBookingFinanceBadge({
    paymentStatus: financials.payment_status,
    cancellationPaymentStatus: financials.cancellation_payment_status,
    bookingStatus: opts?.bookingStatus,
    totalPaid: paid,
    totalRefunded: refunded,
    amountDue: outstanding ?? 0,
    netTotal: net ?? 0,
  });
  const badgeLabel = bookingFinanceBadgeLabel(badge);
  const paymentState = (() => {
    switch (badge) {
      case "PAID":
        return "paid" as const;
      case "PREPAID":
        return "prepaid" as const;
      case "PARTIALLY_PAID":
        return "pending" as const;
      case "UNPAID":
      case "PENDING_FEE":
        return "unpaid" as const;
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return "refunded" as const;
      case "CANCELLED":
        return "voided" as const;
      default:
        return undefined;
    }
  })();

  return cards.map((card) => {
    // Prepayment card = phase document only (don't stamp booking-level PARTIALLY_PAID).
    if (card.kind === "prepayment" && prepay != null && prepay >= 0) {
      const prepayPaid =
        card.paymentState === "paid" ||
        card.paymentState === "prepaid" ||
        Boolean(card.paidAt);
      return {
        ...card,
        total: roundMoney(prepay),
        highlightAmount: roundMoney(prepay),
        documentAmount: roundMoney(prepay),
        statusBadge: prepayPaid ? "Prepaid" : card.statusBadge || "Prepayment Due",
        paymentState: prepayPaid ? ("prepaid" as const) : card.paymentState,
      };
    }

    if (card.kind !== "after_treatment" && card.title !== "Summary") return card;

    const next: SalesOverviewCardData = { ...card };
    if (typeof net === "number" && Number.isFinite(net)) {
      next.total = roundMoney(net);
      if (typeof next.documentAmount === "number") {
        next.documentAmount = roundMoney(net);
      }
    }
    if (typeof outstanding === "number" && Number.isFinite(outstanding)) {
      next.highlightAmount = roundMoney(Math.max(0, outstanding));
      next.highlightLabel = outstanding > 0 ? "Amount Due" : next.highlightLabel;
    }
    if (paymentState) next.paymentState = paymentState;
    next.statusBadge = badgeLabel;

    // Subcards keep their own share totals (guest/model ≠ booking outstanding).
    // Booking Amount Due stays on the payable footer only.
    if (next.subCards?.length) {
      next.subCards = next.subCards.map((sub) => {
        const shareTotal = roundMoney(
          (sub.lines ?? []).reduce((sum, line) => sum + (Number(line.amount) || 0), 0),
        );
        return {
          ...sub,
          statusBadge: badgeLabel,
          paymentState: paymentState ?? sub.paymentState,
          highlightAmount: shareTotal > 0 ? shareTotal : sub.highlightAmount,
          highlightLabel: "Total",
        };
      });
    }

    const rows = [...(next.secondaryRows ?? [])];
    const upsert = (id: string, label: string, amount: number) => {
      if (amount === 0) return;
      const idx = rows.findIndex((row) => row.id === id);
      const line = { id, label, amount: roundMoney(amount) };
      if (idx >= 0) rows[idx] = line;
      else rows.push(line);
    };
    if (typeof basePrice === "number" && basePrice > 0) {
      upsert("ledger-base", "Base Price", basePrice);
    }
    if (addOns > 0) upsert("ledger-addons", "Add-ons", addOns);
    if (cancelFee > 0) upsert("ledger-cancel-fee", "Cancellation Fee", cancelFee);
    if (paid > 0) upsert("ledger-paid", "Total Paid", paid);
    if (refunded > 0) upsert("ledger-refunded", "Refunded", -roundMoney(refunded));
    if (typeof outstanding === "number" && outstanding > 0) {
      upsert("ledger-due", "Amount Due", outstanding);
    }
    next.secondaryRows = rows;
    return next;
  });
}

/** Same product/total within 60s = accidental multi-save, not a second checkout. */
const ADDON_BURST_DEDUPE_MS = 60_000;

function addonRecordFingerprint(record: SalesAddonRecord): string {
  const lines = [...(record.lines ?? [])]
    .map((line) => `${line.name}|${line.quantity}|${line.unitPrice}`)
    .sort()
    .join(";");
  return `${lines}|${record.paymentMethod}|${record.totalPrice}|${Boolean(record.voided)}|${Boolean(record.refunded)}`;
}

/** Drop burst-duplicate sales_addon rows (same booking + fingerprint within 60s). */
export function collapseBurstDuplicateAddons(
  records: SalesAddonRecord[],
): SalesAddonRecord[] {
  const sorted = [...records].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const kept: SalesAddonRecord[] = [];
  for (const record of sorted) {
    const fp = addonRecordFingerprint(record);
    const t = new Date(record.createdAt).getTime();
    const burstDup = kept.some(
      (prev) =>
        String(prev.bookingId) === String(record.bookingId) &&
        addonRecordFingerprint(prev) === fp &&
        Math.abs(new Date(prev.createdAt).getTime() - t) < ADDON_BURST_DEDUPE_MS,
    );
    if (burstDup) continue;
    kept.push(record);
  }
  return kept;
}

/** Fold saved add-ons into after-treatment summary totals/lines; keep addon cards for pay/cancel. */
export function mergeAddonRecordsIntoCards(
  cards: SalesOverviewCardData[],
  addonRecords: SalesAddonRecord[],
  ctx: BuilderCtx,
): SalesOverviewCardData[] {
  // Keep one add-ons card per booking. New add-ons are folded into the same
  // card, so the summary and total never repeat for the same booking.
  const collapsed = collapseBurstDuplicateAddons(addonRecords);
  const grouped = new Map<string, SalesAddonRecord>();
  for (const record of collapsed) {
    const key = String(record.bookingId);
    const previous = grouped.get(key);
    if (!previous) {
      grouped.set(key, { ...record, lines: [...record.lines] });
      continue;
    }
    const latest = new Date(record.createdAt).getTime() > new Date(previous.createdAt).getTime()
      ? record
      : previous;
    grouped.set(key, {
      ...latest,
      id: previous.id,
      lines: [...previous.lines, ...record.lines],
      discountAmount: roundMoney(previous.discountAmount + record.discountAmount),
      totalPrice: roundMoney(previous.totalPrice + record.totalPrice),
      createdAt: latest.createdAt,
      voided: Boolean(previous.voided && record.voided),
      refunded: Boolean(previous.refunded || record.refunded),
    });
  }

  const foldTargetIds = new Set<string>();
  for (const bookingKey of grouped.keys()) {
    const forBooking = cards.filter((c) => String(c.bookingId) === bookingKey);
    const target =
      forBooking.find((c) => c.kind === "after_treatment") ??
      forBooking.find((c) => c.title === "Summary") ??
      forBooking.find((c) => c.showAddOns) ??
      forBooking.find(
        (c) => c.kind !== "prepayment" && c.kind !== "refund" && c.kind !== "addon",
      );
    if (target) foldTargetIds.add(target.id);
  }

  const withFoldedTotals = cards.map((card) => {
    if (!foldTargetIds.has(card.id)) return card;
    const group = grouped.get(String(card.bookingId));
    if (!group || group.voided || group.refunded) return card;
    const addonLines: SalesLineItem[] = group.lines.map((line) => ({
      id: `addon-${group.id}-${line.id}`,
      label: line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
      amount: roundMoney(lineTotal(line)),
    }));
    if (group.discountAmount > 0) {
      addonLines.push({
        id: `addon-${group.id}-discount`,
        label: "Discount",
        amount: -roundMoney(group.discountAmount),
      });
    }
    const addonNet = roundMoney(group.totalPrice);
    return {
      ...card,
      lines: [...card.lines, ...addonLines],
      total: roundMoney(card.total + addonNet),
      highlightAmount: roundMoney((card.highlightAmount ?? card.total) + addonNet),
      documentAmount:
        typeof card.documentAmount === "number"
          ? roundMoney(card.documentAmount + addonNet)
          : card.documentAmount,
    };
  });

  return [
    ...withFoldedTotals,
    ...[...grouped.values()].map((record) => buildAddonCard(record, ctx)),
  ];
}

function applyPenaltyAmount<T extends {
  highlightAmount: number;
  documentAmount?: number;
  total: number;
  penaltyAmount?: number;
}>(next: T, penaltyAmount?: number): T {
  if (!penaltyAmount || penaltyAmount <= 0) return next;
  next.highlightAmount = roundMoney(next.highlightAmount + penaltyAmount);
  if (typeof next.documentAmount === "number") {
    next.documentAmount = next.highlightAmount;
  }
  next.total = roundMoney(next.total + penaltyAmount);
  next.penaltyAmount = penaltyAmount;
  return next;
}

function applyDueDateMeta<T extends {
  paymentMethodLabel?: string;
  methodDateLine?: string;
  paymentState?: SalesPaymentState;
  statusBadge?: string;
  dueDate?: string | null;
  paymentMethod?: SalesOverviewCardData["paymentMethod"];
  highlightLabel?: string;
  highlightAmount: number;
  documentAmount?: number;
  total: number;
  title?: string;
  kind?: SalesOverviewCardData["kind"];
  limitedMenu?: boolean;
  penaltyAmount?: number;
  overdueKind?: SalesOverviewCardData["overdueKind"];
  paidAt?: string | null;
  penaltyPrompt?: SalesPenaltyPrompt;
}>(
  next: T,
  meta: {
    dueDate?: string | null;
    paymentMethod?: SalesOverviewCardData["paymentMethod"];
    canceled?: boolean;
    penaltyAmount?: number;
    reissuedAt?: string;
  },
  kind: SalesOverviewCardData["kind"],
): T {
  if (!meta.dueDate) return next;

  const settled =
    next.paymentState === "prepaid" ||
    next.paymentState === "paid" ||
    next.paymentState === "refunded" ||
    next.paymentState === "voided" ||
    next.paymentState === "failed";
  if (settled) return next;

  const methodLabel = next.paymentMethodLabel || paymentMethodLabel(meta.paymentMethod);
  next.dueDate = meta.dueDate;
  next.methodDateLine = `${methodLabel} (Due date ${formatFinanceDueDate(meta.dueDate)})`;
  next.highlightLabel = next.highlightLabel || "Payment";

  const past = isDueDatePast(meta.dueDate) && !meta.canceled;
  if (past && kind === "prepayment") {
    applyVisualState(next, "overdue", {
      method: meta.paymentMethod,
      dueDate: meta.dueDate,
      kind,
    });
  } else if (past) {
    applyVisualState(next, "overdue_invoice", {
      method: meta.paymentMethod,
      dueDate: meta.dueDate,
      kind,
    });
  } else {
    applyVisualState(next, "payment_due", {
      method: meta.paymentMethod,
      dueDate: meta.dueDate,
      kind,
    });
  }

  // Reissued Invoice Summary only for after-treatment (never prepay/addon).
  if (
    meta.reissuedAt &&
    (kind === "after_treatment" || kind === "reissued_invoice")
  ) {
    if (typeof next.title === "string") next.title = "Reissued Invoice Summary";
    if (next.kind) next.kind = "reissued_invoice";
    next.limitedMenu = true;
  }

  applyPenaltyAmount(next, meta.penaltyAmount);
  return next;
}

function applyEditedLines<T extends {
  id: string;
  lines: SalesLineItem[];
  total: number;
  highlightAmount: number;
  documentAmount?: number;
  secondaryRows?: SalesLineItem[];
  title?: string;
  kind?: SalesOverviewCardData["kind"];
}>(next: T, meta: SalesCardMetaRecord): void {
  if (!meta.editedLines?.length) return;
  // Prepayment service breakdown follows the live booking (same policy as
  // skipping finance lineItems). Stale editedLines were duplicating services.
  const isPrepayment =
    next.title === "Prepayment Summary" || next.kind === "prepayment";
  if (isPrepayment) {
    return;
  }
  next.lines = meta.editedLines.map((line) => ({
    id: line.id,
    label: line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
    amount: roundMoney(lineTotal(line)),
  }));
  if (meta.discountAmount && meta.discountAmount > 0) {
    next.lines.push({
      id: `${next.id}-discount`,
      label:
        meta.discount?.type === "percentage"
          ? `Discount (${meta.discount.amount}%)`
          : "Discount",
      amount: -roundMoney(meta.discountAmount),
    });
  }
  if (typeof meta.totalPrice === "number") {
    // Fee Summary: Payment = Total − Prepaid (do not flatten to edited totalPrice).
    const isFeeSummary =
      next.title === "Fee Summary" || next.title === "No-Show Fee Invoice";
    // Prepayment: Total = service lines; teal stays prepaid (never flatten to deposit).
    const isPrepayment = next.title === "Prepayment Summary";
    if (isFeeSummary && next.secondaryRows?.length) {
      next.total = roundMoney(meta.totalPrice);
      const prepaidCredit = roundMoney(
        next.secondaryRows.reduce(
          (sum, row) => sum + Math.max(0, Number(row.amount) || 0),
          0,
        ),
      );
      next.highlightAmount = roundMoney(Math.max(0, next.total - prepaidCredit));
      if ("documentAmount" in next) {
        next.documentAmount =
          next.highlightAmount > 0 ? next.highlightAmount : next.total;
      }
    } else if (isPrepayment) {
      next.total = roundMoney(
        next.lines
          .filter((line) => line.amount >= 0)
          .reduce((sum, line) => sum + line.amount, 0),
      );
      // highlightAmount / documentAmount stay builder prepaid — do not overwrite.
    } else {
      next.total = roundMoney(meta.totalPrice);
      next.highlightAmount = roundMoney(meta.totalPrice);
      if ("documentAmount" in next) next.documentAmount = roundMoney(meta.totalPrice);
    }
  }
}

function resolveOpenState(input: {
  kind: SalesOverviewCardData["kind"];
  isOnlineBooking: boolean;
  paymentMethod?: string | null;
  dueDate?: string | null;
  markedUnpaid?: boolean;
  paidHint?: boolean;
  paidAt?: string | null;
  isPrepayPaid?: boolean;
  refunded?: boolean;
  voided?: boolean;
  isFailed?: boolean;
  occurredAt: string;
  paymentTerms?: SalesPaymentTermsInput;
  isAfterTreatment?: boolean;
}): { state: SalesPaymentState; dueDate?: string | null; paidAt?: string | null } {
  if (input.refunded) return { state: "refunded" };
  if (input.voided) return { state: "voided" };
  if (input.isFailed) return { state: "failed" };
  if (input.kind === "prepayment" && (input.isPrepayPaid || input.paidHint)) {
    return { state: "prepaid", paidAt: input.paidAt };
  }
  if (input.paidHint) return { state: "paid", paidAt: input.paidAt };

  const invoiceMethod = isInvoicePaymentMethod(input.paymentMethod);
  let dueDate = input.dueDate ?? null;
  if (
    !dueDate &&
    (input.kind === "prepayment" ||
      invoiceMethod ||
      (input.kind !== "addon" && !isOnlineDirectPayment(input.paymentMethod) && !input.isOnlineBooking))
  ) {
    dueDate = deriveDueDate(input.occurredAt, input.paymentTerms);
  }

  if (input.kind === "prepayment" && !input.isPrepayPaid) {
    const due = dueDate || deriveDueDate(input.occurredAt, input.paymentTerms);
    if (isDueDatePast(due)) return { state: "overdue", dueDate: due };
    return { state: "payment_due", dueDate: due };
  }

  if (dueDate || invoiceMethod) {
    const due = dueDate || deriveDueDate(input.occurredAt, input.paymentTerms);
    if (isDueDatePast(due)) {
      return {
        state: input.kind === "prepayment" ? "overdue" : "overdue_invoice",
        dueDate: due,
      };
    }
    return { state: "payment_due", dueDate: due };
  }

  if (input.markedUnpaid) return { state: "unpaid" };

  if (input.isAfterTreatment && input.isOnlineBooking && isOnlineDirectPayment(input.paymentMethod)) {
    return { state: "pending" };
  }

  if (input.kind === "addon" && isOnlineDirectPayment(input.paymentMethod) && input.isOnlineBooking) {
    return { state: "pending" };
  }

  if (input.kind === "addon") {
    return { state: "paid", paidAt: input.paidAt || input.occurredAt };
  }

  if (input.isAfterTreatment) {
    const due = deriveDueDate(input.occurredAt, input.paymentTerms);
    if (isDueDatePast(due)) return { state: "overdue_invoice", dueDate: due };
    return { state: "payment_due", dueDate: due };
  }

  return { state: "payment_due", dueDate: dueDate || deriveDueDate(input.occurredAt, input.paymentTerms) };
}

/** @returns true when status came from a matched finance row (skip booking re-derive). */
function applyFinanceAndMetaState(
  next: SalesOverviewCardData | SalesSubCardData,
  meta: SalesCardMetaRecord | null,
  ctx: BuilderCtx,
  kind: SalesOverviewCardData["kind"],
  extras: {
    isOnlineBooking: boolean;
    isPrepayPaid?: boolean;
    isFailed?: boolean;
    paidHint?: boolean;
    occurredAt: string;
    isAfterTreatment?: boolean;
  },
): boolean {
  const finance = matchFinanceHint(
    {
      id: next.id,
      bookingId: next.bookingId,
      bookingCode: next.bookingCode,
      kind,
      payerKey: "payerKey" in next ? next.payerKey : undefined,
      financeTransactionId: meta?.financeTransactionId,
    },
    ctx.financeHints,
  );
  // Prefer stored finance document.lineItems over calendar-derived lines so
  // Sales Card count matches finance_transactions (editedLines still win).
  // Fee Summary: keep builder fee lines + Payment = Total − Prepaid.
  // Prepayment: keep calendar service lines — prepay docs are deposit-only
  // ("Prepayment" €X), which would zero/wrong Total after cancel fee checkout.
  const isFeeSummaryCard =
    "title" in next &&
    (next.title === "Fee Summary" || next.title === "No-Show Fee Invoice");
  const isPrepaymentCard = kind === "prepayment";
  if (
    finance?.lineItems?.length &&
    !meta?.editedLines?.length &&
    Array.isArray(next.lines) &&
    !isFeeSummaryCard &&
    !isPrepaymentCard
  ) {
    next.lines = finance.lineItems.map((line) => ({ ...line }));
    if ("highlightedLineIds" in next) next.highlightedLineIds = undefined;
  }

  const paymentMethod =
    meta?.paymentMethod ||
    ("paymentMethod" in next ? next.paymentMethod : undefined) ||
    finance?.paymentMethod;
  const paidAt = meta?.paidAt || finance?.paidAt || extras.occurredAt;
  // Finance payment_deadline is SSOT, but fresher sales-card meta dueDate wins
  // (reissue stamp OR Edit Sales dueDateSetAt) until finance catches up.
  const metaDue = meta?.dueDate || null;
  const financeDue = finance?.dueDate || null;
  const metaReissueTs = meta?.reissuedAt ? Date.parse(meta.reissuedAt) : NaN;
  const metaDueSetTs = meta?.dueDateSetAt ? Date.parse(meta.dueDateSetAt) : NaN;
  const financeReissueTs = finance?.reissuedAt
    ? Date.parse(String(finance.reissuedAt))
    : NaN;
  const metaFreshTs = Math.max(
    Number.isFinite(metaReissueTs) ? metaReissueTs : 0,
    Number.isFinite(metaDueSetTs) ? metaDueSetTs : 0,
  );
  const preferMetaDue =
    Boolean(metaDue) &&
    metaDue !== financeDue &&
    metaFreshTs > 0 &&
    (meta?.cardKind === "reissued_invoice" ||
      !Number.isFinite(financeReissueTs) ||
      metaFreshTs >= financeReissueTs);
  const dueDate = preferMetaDue
    ? metaDue
    : financeDue || metaDue || next.dueDate;

  const linkedTxId = finance?.transactionId || meta?.financeTransactionId;
  if (linkedTxId) {
    (next as { financeTransactionId?: string }).financeTransactionId =
      String(linkedTxId);
  }

  // Linked finance row is SSOT for display status (do not re-derive from booking).
  const financeState = finance
    ? financeStatusToSalesPaymentState(finance.status, kind)
    : null;
  if (finance && financeState) {
    if (financeState === "refunded" && "refunded" in next) next.refunded = true;
    if (financeState === "voided") {
      if ("voided" in next) next.voided = true;
      if ("highlightLabel" in next) next.highlightLabel = "Payment";
    }
    applyVisualState(next, financeState, {
      method: paymentMethod,
      dueDate,
      paidAt,
      occurredAt: extras.occurredAt,
      kind,
    });
    next.markedUnpaid = Boolean(meta?.markedUnpaid) && financeState === "unpaid";
    next.paidAt =
      financeState === "paid" || financeState === "prepaid"
        ? paidAt ?? null
        : null;
    // Finance reissueLevel is SSOT when linked — do not promote from meta.reissuedAt
    // alone (Edit Sales used to set that on first Non-Direct issue).
    const reissueLevel = Number(finance.reissueLevel) || 0;
    const canShowReissued =
      kind === "after_treatment" || kind === "reissued_invoice";
    if (
      canShowReissued &&
      reissueLevel >= 1 &&
      (financeState === "payment_due" || financeState === "overdue_invoice")
    ) {
      if ("title" in next && typeof next.title === "string") {
        next.title = "Reissued Invoice Summary";
      }
      if ("kind" in next) next.kind = "reissued_invoice";
      next.limitedMenu = true;
    }
    next.penaltyPrompt = resolvePenaltyPrompt(
      financeState,
      finance.paymentTerms ?? ctx.paymentTerms,
      reissueLevel,
    );
    return true;
  }

  // Unlinked (or unknown finance status): booking/meta-derived path.
  const refunded =
    Boolean(meta?.refunded) || Boolean("refunded" in next && next.refunded);
  const voided =
    Boolean(meta?.voided) || Boolean("voided" in next && next.voided);
  const failed = Boolean(extras.isFailed);
  const paidHint =
    Boolean(extras.paidHint) ||
    Boolean(meta?.paidAt) ||
    Boolean(meta?.paid);

  if (refunded) {
    if ("refunded" in next) next.refunded = true;
    applyVisualState(next, "refunded", {
      method: paymentMethod,
      occurredAt: extras.occurredAt,
      kind,
    });
    return false;
  }
  if (voided) {
    if ("voided" in next) next.voided = true;
    if ("highlightLabel" in next) next.highlightLabel = "Payment";
    applyVisualState(next, "voided", {
      method: paymentMethod,
      occurredAt: extras.occurredAt,
      kind,
    });
    return false;
  }
  if (failed) {
    applyVisualState(next, "failed", {
      method: paymentMethod,
      occurredAt: extras.occurredAt,
      kind,
    });
    return false;
  }

  const open = resolveOpenState({
    kind,
    isOnlineBooking: extras.isOnlineBooking,
    paymentMethod,
    dueDate,
    markedUnpaid: Boolean(meta?.markedUnpaid),
    paidHint,
    paidAt,
    isPrepayPaid: extras.isPrepayPaid,
    occurredAt: extras.occurredAt,
    paymentTerms: ctx.paymentTerms,
    isAfterTreatment: extras.isAfterTreatment,
  });

  applyVisualState(next, open.state, {
    method: paymentMethod,
    dueDate: open.dueDate,
    paidAt: open.paidAt,
    occurredAt: extras.occurredAt,
    kind,
  });
  next.markedUnpaid = Boolean(meta?.markedUnpaid) && open.state === "unpaid";
  next.paidAt = open.paidAt ?? null;
  const openReissueLevel = meta?.reissuedAt ? 1 : 0;
  if (
    (kind === "after_treatment" || kind === "reissued_invoice") &&
    openReissueLevel >= 1 &&
    (open.state === "payment_due" || open.state === "overdue_invoice")
  ) {
    if ("title" in next && typeof next.title === "string") {
      next.title = "Reissued Invoice Summary";
    }
    if ("kind" in next) next.kind = "reissued_invoice";
    next.limitedMenu = true;
  }
  next.penaltyPrompt = resolvePenaltyPrompt(open.state, ctx.paymentTerms, openReissueLevel);
  return false;
}

function applySubMeta(
  sub: SalesSubCardData,
  ctx: BuilderCtx,
  extras: {
    isOnlineBooking: boolean;
    occurredAt: string;
    isAfterTreatment?: boolean;
    paidHint?: boolean;
  },
): SalesSubCardData {
  // Main nested under after-treatment may still have meta on the parent card id.
  const parentId =
    sub.payerRole === "main_client" && sub.id.includes("-sub-")
      ? sub.id.slice(0, sub.id.lastIndexOf("-sub-"))
      : null;
  const meta =
    getSalesCardMeta(sub.id) ||
    (parentId ? getSalesCardMeta(parentId) : null);
  if (meta?.canceled && !meta.voided) {
    return { ...sub, statusBadge: undefined, paymentState: sub.paymentState };
  }

  const next: SalesSubCardData = {
    ...sub,
    dueDate: meta?.dueDate ?? sub.dueDate,
    markedUnpaid: meta?.markedUnpaid ?? sub.markedUnpaid,
    paidAt: meta?.paidAt ?? sub.paidAt,
  };

  if (meta) applyEditedLines(next, meta);
  if (meta?.paymentMethod) {
    next.methodDateLine = paymentMethodLabel(meta.paymentMethod);
  }

  const usedFinance = applyFinanceAndMetaState(next, meta, ctx, "after_treatment", {
    isOnlineBooking: extras.isOnlineBooking,
    paidHint: extras.paidHint,
    occurredAt: extras.occurredAt,
    isAfterTreatment: extras.isAfterTreatment ?? true,
  });

  // Linked finance status is SSOT — do not re-badge from due-date heuristics.
  if (
    !usedFinance &&
    (meta?.dueDate || next.dueDate) &&
    next.paymentState !== "paid" &&
    next.paymentState !== "refunded"
  ) {
    applyDueDateMeta(next, {
      dueDate: meta?.dueDate ?? next.dueDate,
      paymentMethod: meta?.paymentMethod,
      canceled: meta?.canceled,
      penaltyAmount: meta?.penaltyAmount,
      reissuedAt: meta?.reissuedAt,
    }, "after_treatment");
  }

  next.penaltyPrompt = resolvePenaltyPrompt(
    next.paymentState,
    ctx.paymentTerms,
    meta?.reissuedAt ? 1 : 0,
  );
  return next;
}

function applyMeta(
  card: SalesOverviewCardData,
  ctx: BuilderCtx,
  extras: {
    isOnlineBooking: boolean;
    isPrepayPaid?: boolean;
    isFailed?: boolean;
    paidHint?: boolean;
    isAfterTreatment?: boolean;
  },
): SalesOverviewCardData {
  const meta = getSalesCardMeta(card.id);
  let next: SalesOverviewCardData = meta
    ? {
        ...card,
        note: meta.note ?? card.note,
        voided: Boolean(meta.voided) || Boolean(card.voided),
        refunded: Boolean(meta.refunded) || Boolean(card.refunded),
        canceled: Boolean(meta.canceled),
        dueDate: meta.dueDate ?? card.dueDate,
        penaltyAmount: meta.penaltyAmount ?? card.penaltyAmount,
        paymentMethod: meta.paymentMethod ?? card.paymentMethod,
        markedUnpaid: Boolean(meta.markedUnpaid),
        paidAt: meta.paidAt ?? card.paidAt,
        invoiceSeq: meta.invoiceSeq ?? card.invoiceSeq,
      }
    : { ...card };

  if (meta) {
    applyEditedLines(next, meta);
    if (meta.paymentMethod) {
      next.paymentMethodLabel = paymentMethodLabel(meta.paymentMethod);
    }
  }

  const usedFinance = applyFinanceAndMetaState(next, meta, ctx, next.kind, {
    isOnlineBooking: extras.isOnlineBooking,
    isPrepayPaid: extras.isPrepayPaid,
    isFailed: extras.isFailed,
    paidHint: extras.paidHint,
    occurredAt: next.occurredAt,
    isAfterTreatment: extras.isAfterTreatment,
  });

  if (meta) {
    if (!usedFinance) applyDueDateMeta(next, meta, next.kind);
    applyPenaltyAmount(next, meta.penaltyAmount);
    if (meta.canceled) {
      next.canceled = true;
      // Cancel Sales sets voided+canceled → keep Voided badge; supersede-only clears it.
      if (!(meta.voided || next.voided)) {
        next.statusBadge = undefined;
      }
    }
  }

  next.penaltyPrompt = resolvePenaltyPrompt(
    next.paymentState,
    ctx.paymentTerms,
    meta?.reissuedAt ? 1 : 0,
  );

  if (next.subCards?.length) {
    next = {
      ...next,
      subCards: next.subCards
        .map((sub) =>
          applySubMeta(sub, ctx, {
            isOnlineBooking: extras.isOnlineBooking,
            occurredAt: next.occurredAt,
            isAfterTreatment: extras.isAfterTreatment,
            paidHint: sub.paymentState === "paid" || Boolean(sub.paidAt),
          }),
        )
        .filter((sub) => {
          const subMeta = getSalesCardMeta(sub.id);
          return !subMeta?.canceled || Boolean(subMeta.voided);
        }),
    };
    // After-treatment shell: main + guest/model live in subCards — strip parent body.
    // Title/reissue is per-payer; shell shows Reissued only when any open payer was reissued.
    const subCards = next.subCards ?? [];
    if (subCards.some((sub) => sub.payerRole === "main_client")) {
      const mainSub = subCards.find((sub) => sub.payerRole === "main_client");
      const anyReissued = subCards.some((sub) => {
        const subMeta =
          getSalesCardMeta(sub.id) ||
          (sub.payerRole === "main_client" ? getSalesCardMeta(next.id) : null);
        const fin = matchFinanceHint(
          {
            id: sub.id,
            bookingId: next.bookingId,
            bookingCode: next.bookingCode,
            kind: "after_treatment",
            payerKey: sub.payerKey,
            financeTransactionId:
              sub.financeTransactionId || subMeta?.financeTransactionId,
          },
          ctx.financeHints,
        );
        return (
          (Number(fin?.reissueLevel) || 0) >= 1 ||
          subMeta?.cardKind === "reissued_invoice"
        );
      });
      next = {
        ...next,
        title: anyReissued
          ? "Reissued Invoice Summary"
          : "After treatment Summary",
        kind: anyReissued ? "reissued_invoice" : "after_treatment",
        lines: [],
        secondaryRows: undefined,
        highlightedLineIds: undefined,
        financeTransactionId: undefined,
        total: 0,
        highlightAmount: 0,
        documentAmount: 0,
        methodDateLine: undefined,
        dueDate: null,
        statusBadge: mainSub?.statusBadge,
        paymentState: mainSub?.paymentState,
        penaltyPrompt: subCards.some((s) => s.penaltyPrompt === "manual")
          ? "manual"
          : subCards.some((s) => s.penaltyPrompt === "automatic")
            ? "automatic"
            : "none",
      };
    }
  }

  return next;
}

export function buildAddonCard(record: SalesAddonRecord, ctx: BuilderCtx): SalesOverviewCardData {
  const lines: SalesLineItem[] = record.lines.map((line) => ({
    id: line.id,
    label: line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
    amount: roundMoney(lineTotal(line)),
  }));
  if (record.discountAmount > 0) {
    lines.push({
      id: `${record.id}-discount`,
      label:
        record.discount?.type === "percentage"
          ? `Discount (${record.discount.amount}%)`
          : "Discount",
      amount: -roundMoney(record.discountAmount),
    });
  }

  const isOnlinePay = record.paymentMethod === "onlineDirect";
  return applyMeta(
    {
      id: `addon-${record.id}`,
      bookingId: record.bookingId,
      bookingCode: record.bookingCode,
      kind: "addon",
      title: "Add-ons Summary",
      clientName: record.clientName,
      clientEmail: record.clientEmail,
      lines,
      total: roundMoney(record.totalPrice),
      totalLabel: "Total",
      highlightLabel: `Paid · ${paymentMethodLabel(record.paymentMethod)}`,
      highlightAmount: roundMoney(record.totalPrice),
      methodDateLine: formatMethodDateTime(paymentMethodLabel(record.paymentMethod), record.createdAt),
      showAddOns: false,
      voided: record.voided,
      refunded: record.refunded,
      note: record.note,
      paymentMethod: record.paymentMethod,
      paymentMethodLabel: paymentMethodLabel(record.paymentMethod),
      documentAmount: roundMoney(record.totalPrice),
      occurredAt: record.createdAt,
      paidAt: isOnlinePay ? null : record.createdAt,
    },
    ctx,
    {
      isOnlineBooking: isOnlinePay,
      paidHint: !record.voided && !record.refunded && !isOnlinePay,
    },
  );
}

function refundMethodDisplayLabel(method?: string | null): string {
  const value = String(method ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (!value) return paymentMethodLabel(null);
  if (value === "online-non-direct" || value === "onlinenondirect") {
    return "Online transfer / bank";
  }
  if (value === "offline-direct" || value === "offlinedirect") {
    return "Offline Direct";
  }
  if (value === "offline-non-direct" || value === "offlinenondirect") {
    return "Offline transfer / bank";
  }
  if (value === "online-direct" || value === "onlinedirect") return "Online Direct";
  return paymentMethodLabel(method as SalesCheckoutPaymentMethod);
}

/** Backend-created credit-note / refund receipt card (separate from the original sale). */
export function buildRefundCard(
  meta: SalesCardMetaRecord,
  ctx: BuilderCtx,
): SalesOverviewCardData {
  const lines: SalesLineItem[] = (meta.editedLines ?? []).map((line) => ({
    id: line.id,
    label: line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
    amount: roundMoney(lineTotal(line)),
  }));
  const total = roundMoney(
    Number(meta.totalPrice) ||
      lines.reduce((sum, line) => sum + line.amount, 0),
  );
  const methodLabel = refundMethodDisplayLabel(
    meta.refundMethod || meta.paymentMethod,
  );
  const modeLabel =
    meta.refundMode === "item"
      ? "Refund by item"
      : meta.refundMode === "amount"
        ? "Refund by amount"
        : "Refund";
  const occurredAt = new Date().toISOString();
  const card: SalesOverviewCardData = {
    id: meta.cardId,
    bookingId: meta.bookingId,
    bookingCode: meta.bookingCode || meta.bookingId,
    kind: "refund",
    title: "Refund Summary",
    clientName: meta.clientName || "Client",
    clientEmail: meta.clientEmail,
    lines: lines.length
      ? lines
      : [{ id: `${meta.cardId}-amount`, label: "Refund", amount: total }],
    total,
    totalLabel: "Total",
    highlightLabel: "Refunded",
    highlightAmount: total,
    methodDateLine: formatMethodDateTime(methodLabel, occurredAt),
    metaLines: [
      modeLabel,
      ...(meta.refundReason ? [`Reason: ${meta.refundReason}`] : []),
    ],
    showAddOns: false,
    limitedMenu: true,
    refunded: true,
    paymentMethod: meta.paymentMethod,
    paymentMethodLabel: methodLabel,
    documentAmount: total,
    occurredAt,
    financeTransactionId: meta.financeTransactionId,
    statusBadge: "Refunded",
    paymentState: "refunded",
  };
  const next = applyMeta(card, ctx, {
    isOnlineBooking: false,
    paidHint: false,
  });
  // Keep refund-method wording (transfer/bank) — applyMeta remaps paymentMethod labels.
  next.paymentMethodLabel = methodLabel;
  next.methodDateLine = formatMethodDateTime(methodLabel, next.occurredAt);
  next.metaLines = card.metaLines;
  next.title = "Refund Summary";
  next.kind = "refund";
  next.refunded = true;
  next.limitedMenu = true;
  return next;
}

export function mergeRefundMetaIntoCards(
  cards: SalesOverviewCardData[],
  refundMetas: SalesCardMetaRecord[],
  ctx: BuilderCtx,
): SalesOverviewCardData[] {
  if (!refundMetas.length) return cards;
  const existing = new Set(cards.map((card) => card.id));
  const extras = refundMetas
    .filter((meta) => !existing.has(meta.cardId))
    .map((meta) => buildRefundCard(meta, ctx));
  return extras.length ? [...cards, ...extras] : cards;
}

function bookingEndIso(event: CalendarEvent, booking?: CalendarBooking): string | null {
  if (booking?.end_time) return booking.end_time;
  if (event.date && event.end) return `${event.date}T${event.end}:00`;
  return null;
}

function hasBookingEnded(endIso: string | null): boolean {
  if (!endIso) return false;
  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() <= Date.now();
}

/** Stamp lines for cancellation-fee invoices (time + policy window breach). */
export function buildCancellationFeeInvoiceMetaLines(input: {
  cancellationFeeAt?: string | null;
  exceededCancellationWindow?: boolean;
}): string[] {
  const lines: string[] = [];
  const stamped = formatDateTimeLabel(input.cancellationFeeAt);
  if (stamped) lines.push(`Cancellation time: ${stamped}`);
  if (typeof input.exceededCancellationWindow === "boolean") {
    lines.push(
      input.exceededCancellationWindow
        ? "Breached preset cancellation window"
        : "Within preset cancellation window",
    );
  }
  return lines;
}

function kilometerExtrasAmount(event: CalendarEvent): number {
  return resolveKilometerAllowanceAmount(event.details?.kilometerAllowance);
}

export type ProtectiveFeeSalesCardSpec = {
  title: string;
  feeLabel: string;
  feeAmount: number;
  entryLabel: string;
  metaLines: string[];
};

/** Heal fee flags from booking.notes when calendar `currentEvent.details` is stale. */
export function protectiveFeeFlagsFromBooking(booking?: CalendarBooking | null): {
  showLateCancellation: boolean;
  lateCancellationFeePercent?: string | number | null;
  showNoShowFee: boolean;
  noShowFeePercent?: string | number | null;
  cancellationFeeAt?: string | null;
  exceededCancellationWindow?: boolean;
} {
  const notes = parseCalendarEntryNotes(booking?.notes ?? null);
  return {
    showLateCancellation: Boolean(notes?.showLateCancellation),
    lateCancellationFeePercent: notes?.lateCancellationFeePercent,
    showNoShowFee: Boolean(notes?.showNoShowFee),
    noShowFeePercent: notes?.noShowFeePercent,
    cancellationFeeAt: notes?.cancellationFeeAt ?? null,
    exceededCancellationWindow: notes?.exceededCancellationWindow,
  };
}

function financeHintMatchesBooking(
  hint: SalesFinanceHint,
  bookingId: string,
  bookingCode: string,
): boolean {
  // finance_transactions.booking_id stores unique_code; calendar may pass UUID and/or code.
  return (
    (hint.bookingId != null && String(hint.bookingId) === String(bookingId)) ||
    (hint.bookingCode != null && String(hint.bookingCode) === String(bookingCode)) ||
    (hint.bookingId != null && String(hint.bookingId) === String(bookingCode)) ||
    (hint.bookingCode != null && String(hint.bookingCode) === String(bookingId))
  );
}

function protectiveFeeHintSortKey(entryLabel?: string | null): number {
  const label = String(entryLabel ?? "");
  if (label === LATE_RESCHEDULING_FEE) return 0;
  if (label.startsWith(LATE_CANCELLATION_BOOKING_FEE)) return 1;
  if (label.toLowerCase() === "no-show fee") return 2;
  return 3;
}

/** Protective-fee finance rows for Fee Summary (paid + open Payment Due). */
export function findProtectiveFeeFinanceHints(
  hints: readonly SalesFinanceHint[],
  bookingId: string,
  bookingCode: string,
): SalesFinanceHint[] {
  return hints
    .filter((hint) => {
      if (!financeHintMatchesBooking(hint, bookingId, bookingCode)) return false;
      if (!isProtectiveFeeEntryLabel(hint.entryLabel)) return false;
      return isDisplayableProtectiveFeeStatus(hint.status);
    })
    .sort(
      (a, b) =>
        protectiveFeeHintSortKey(a.entryLabel) -
        protectiveFeeHintSortKey(b.entryLabel),
    );
}

/** First displayable protective-fee finance row (Paid or Payment Due). */
export function findProtectiveFeeFinanceHint(
  hints: readonly SalesFinanceHint[],
  bookingId: string,
  bookingCode: string,
): SalesFinanceHint | undefined {
  return findProtectiveFeeFinanceHints(hints, bookingId, bookingCode)[0];
}

/**
 * Cancelled / No Show fee-only sales card when protective fee section is active.
 * Returns null when status/fee gate fails (caller keeps blank Sales for plain cancels).
 */
export function resolveProtectiveFeeSalesCardSpec(input: {
  status?: string | null;
  showLateCancellation?: boolean;
  lateCancellationFeePercent?: string | number | null;
  showNoShowFee?: boolean;
  noShowFeePercent?: string | number | null;
  lateRescheduleFeePercent?: string | number | null;
  lineSubtotal: number;
  extrasAmount?: number;
  discount?: { type: "fixed" | "percentage"; amount: number } | null;
  cancellationFeeAt?: string | null;
  exceededCancellationWindow?: boolean;
  /** LCF/LRF/NS finance row (Paid or Payment Due) — stamps alone handled by caller fallback. */
  financeFeeHint?: SalesFinanceHint | null;
}): ProtectiveFeeSalesCardSpec | null {
  const status = String(input.status ?? "").toLowerCase();
  const price = computeBookingPrice({
    lineSubtotal: input.lineSubtotal,
    extrasAmount: input.extrasAmount ?? 0,
    discount: input.discount ?? null,
    showLateCancellation: Boolean(input.showLateCancellation),
    lateCancellationFeePercent: input.lateCancellationFeePercent ?? undefined,
    showNoShowFee: Boolean(input.showNoShowFee),
    noShowFeePercent: input.noShowFeePercent ?? undefined,
  });

  const hint = input.financeFeeHint;
  const hintAmount = Number(hint?.amount);
  const hasFeeHint =
    Boolean(hint) &&
    isDisplayableProtectiveFeeStatus(hint?.status) &&
    Number.isFinite(hintAmount) &&
    hintAmount > 0 &&
    isProtectiveFeeEntryLabel(hint?.entryLabel);

  // Need a finance fee row (settled or open) — stamp-only invent is caller's job.
  if (!hasFeeHint) return null;

  const label = String(hint!.entryLabel ?? "");
  const isLateCancelLabel = label.startsWith(LATE_CANCELLATION_BOOKING_FEE);
  const isLateRescheduleLabel = label === LATE_RESCHEDULING_FEE;
  const isNoShowLabel = label.toLowerCase() === "no-show fee";

  if (
    isLateCancelLabel &&
    ((status === "cancelled" || status === "canceled") ||
      input.showLateCancellation)
  ) {
    const feeAmount =
      price.lateCancellationFeeAmount > 0
        ? price.lateCancellationFeeAmount
        : roundMoney(hintAmount);
    if (feeAmount > 0) {
      const percent = Number(input.lateCancellationFeePercent) || 0;
      const base =
        price.lateCancellationFeeAmount > 0
          ? price.afterDiscount
          : percent > 0
            ? roundMoney(feeAmount / (percent / 100))
            : price.afterDiscount;
      return {
        title: "Fee Summary",
        feeLabel:
          percent > 0
            ? formatProtectiveFeeLineDescription("lateCancellation", percent, base)
            : LATE_CANCELLATION_BOOKING_FEE,
        feeAmount,
        entryLabel: LATE_CANCELLATION_BOOKING_FEE,
        metaLines: buildCancellationFeeInvoiceMetaLines({
          cancellationFeeAt: input.cancellationFeeAt,
          exceededCancellationWindow: input.exceededCancellationWindow,
        }),
      };
    }
  }

  if (isNoShowLabel) {
    const feeAmount =
      price.noShowFeeAmount > 0
        ? price.noShowFeeAmount
        : roundMoney(hintAmount);
    if (feeAmount > 0) {
      return {
        title: "No-Show Fee Invoice",
        feeLabel: "No-show fee",
        feeAmount,
        entryLabel: "No-show fee",
        metaLines: buildCancellationFeeInvoiceMetaLines({
          cancellationFeeAt: input.cancellationFeeAt,
          exceededCancellationWindow: input.exceededCancellationWindow,
        }),
      };
    }
  }

  if (isLateRescheduleLabel) {
    const lrfPercent = Number(input.lateRescheduleFeePercent) || 0;
    const base =
      lrfPercent > 0
        ? roundMoney(hintAmount / (lrfPercent / 100))
        : price.afterDiscount;
    return {
      title: "Fee Summary",
      feeLabel:
        lrfPercent > 0
          ? formatProtectiveFeeLineDescription("lateRescheduling", lrfPercent, base)
          : LATE_RESCHEDULING_FEE,
      feeAmount: roundMoney(hintAmount),
      entryLabel: LATE_RESCHEDULING_FEE,
      metaLines: [],
    };
  }

  // Paid protective fee with unrecognized status string — still surface Fee Summary.
  if (isLateCancelLabel) {
    const percent = Number(input.lateCancellationFeePercent) || 0;
    const base =
      percent > 0 ? roundMoney(hintAmount / (percent / 100)) : price.afterDiscount;
    return {
      title: "Fee Summary",
      feeLabel:
        percent > 0
          ? formatProtectiveFeeLineDescription("lateCancellation", percent, base)
          : LATE_CANCELLATION_BOOKING_FEE,
      feeAmount: roundMoney(hintAmount),
      entryLabel: LATE_CANCELLATION_BOOKING_FEE,
      metaLines: buildCancellationFeeInvoiceMetaLines({
        cancellationFeeAt: input.cancellationFeeAt,
        exceededCancellationWindow: input.exceededCancellationWindow,
      }),
    };
  }

  return null;
}

/** Align with client `filterVisiblePaymentSummarySections`: prepaid hides after-treatment until due. */
export function shouldShowAfterTreatmentCard(input: {
  isPrepayPaid: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  ended: boolean;
  waitingForPayment?: boolean;
  hasCollectedAfterTreatment?: boolean;
}): boolean {
  const remainingPaymentStage =
    input.isInProgress ||
    input.isCompleted ||
    Boolean(input.waitingForPayment) ||
    Boolean(input.hasCollectedAfterTreatment);
  if (input.isPrepayPaid) return remainingPaymentStage;
  return remainingPaymentStage || input.ended;
}

function isSplitPayerPaid(
  split: ReturnType<typeof parseSplitBillState>,
  payerKey: string,
): boolean {
  if (!split) return false;
  if (split.mode === "single" && split.payers.some((payer) => payer.paid)) {
    return true;
  }
  return Boolean(split.payers.find((payer) => payer.key === payerKey)?.paid);
}

export function buildCardsForEvent(input: {
  event: CalendarEvent;
  booking?: CalendarBooking;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientKind?: SalesClientKind;
  isCurrent?: boolean;
  ctx: BuilderCtx;
}): SalesOverviewCardData[] {
  const { event, booking, clientName, clientEmail, clientPhone, clientKind, ctx } = input;
  const { lines, subtotal } = buildLinesFromEvent(event);
  const status = String(booking?.status ?? event.status ?? "").toLowerCase();
  const isCancelled = status === "cancelled" || status === "canceled";
  const isInvalid = status === "invalid" || isBookingRequestRejected(event);

  if (isInvalid) return [];

  const bookingId = parseApiCalendarEventId(event.id)?.id ?? event.id;
  const bookingCode = event.bookingCode || bookingId;
  const name = clientName || event.showClientName || booking?.customer_name || booking?.client_name || "Client";
  const email = clientEmail || event.details?.clientEmail || booking?.customer_email || undefined;
  const phone =
    clientPhone ||
    [event.details?.phoneCode, event.details?.phoneNumber].filter(Boolean).join(" ").trim() ||
    booking?.contact_number ||
    undefined;
  const eventPaymentMethod = event.details?.paymentMethod as SalesCheckoutPaymentMethod | undefined;
  const method = paymentMethodLabel(eventPaymentMethod);
  const invoiceDueFromNotes = event.details?.invoiceDueDate ?? null;
  const occurredAt =
    event.details?.cancellationFeeAt ||
    booking?.created_at ||
    booking?.start_time ||
    `${event.date}T${event.start}:00`;
  const endAt = bookingEndIso(event, booking);

  const lineSubtotalBeforeDiscount = roundMoney(
    lines.filter((line) => line.amount >= 0).reduce((sum, line) => sum + line.amount, 0),
  );
  const totalFromBooking = Number(booking?.total_price);
  const bookingFinancials =
    ctx.liveFinancials ?? parseBookingFinancialsFromNotes(booking?.notes);
  const rawBaseTotal = bookingFinancials?.basePrice != null
    ? roundMoney(bookingFinancials.basePrice)
    : lines.length
      ? subtotal
      : roundMoney(Number.isFinite(totalFromBooking) ? totalFromBooking : 0);

  // Prefer live event details; fall back to booking.notes when calendar state is stale.
  const notesFee = protectiveFeeFlagsFromBooking(booking);
  const showNoShowFee =
    Boolean(event.details?.showNoShowFee) || notesFee.showNoShowFee;
  const noShowFeePercent =
    event.details?.noShowFeePercent ?? notesFee.noShowFeePercent;
  const cancellationFeeAt =
    event.details?.cancellationFeeAt ?? notesFee.cancellationFeeAt;
  const exceededCancellationWindow =
    typeof event.details?.exceededCancellationWindow === "boolean"
      ? event.details.exceededCancellationWindow
      : notesFee.exceededCancellationWindow;

  const financeFeeHints = findProtectiveFeeFinanceHints(
    ctx.financeHints,
    String(bookingId),
    String(bookingCode),
  );
  const financeFeeHint = financeFeeHints[0];

  // Percent: booking stamp → notes → business policy (label % for Fee Summary / invoice line).
  const stampedLateCancelPercent =
    event.details?.lateCancellationFeePercent ?? notesFee.lateCancellationFeePercent;
  const lateCancellationFeePercent =
    Number(stampedLateCancelPercent) > 0
      ? stampedLateCancelPercent
      : ctx.lateCancellationFeePercentDefault;
  // Paid finance hint heals missing stamp; do not invent Fee Summary from policy alone.
  const showLateCancellation =
    Boolean(event.details?.showLateCancellation) ||
    notesFee.showLateCancellation ||
    Boolean(financeFeeHint);
  const isNoShowStatus = status === "no_show" || status === "no show";

  // Cancel fee checkout writes total_price = fee — recover services base for Prepayment Total.
  const feeRecoveredBase = recoverBookingBaseFromFeeHints(financeFeeHints, {
    lateCancel: lateCancellationFeePercent,
    lateReschedule: event.details?.lateRescheduleFeePercent,
    noShow: noShowFeePercent,
  });
  const baseTotal = roundMoney(Math.max(rawBaseTotal, feeRecoveredBase));
  const prepayStatus = String(
    booking?.prepayment_status ?? event.details?.prepaymentStatus ?? "",
  ).toLowerCase();
  const isPrepayPaid = prepayStatus === "paid" || prepayStatus === "confirmed";
  const showPrepayment =
    Boolean(event.details?.showPrepayment) ||
    prepayStatus === "paid" ||
    prepayStatus === "required" ||
    prepayStatus === "pending" ||
    prepayStatus === "failed" ||
    prepayStatus === "confirmed";
  const prepaymentPercent = Number(event.details?.prepaymentPercent) || 0;
  // Prefer ledger prepayment_total so refunds/repayments do not resurrect stale %.
  const prepaidAmount =
    bookingFinancials?.prepayment_total != null && bookingFinancials.prepayment_total > 0
      ? roundMoney(bookingFinancials.prepayment_total)
      : showPrepayment && prepaymentPercent > 0
        ? roundMoney((baseTotal * prepaymentPercent) / 100)
        : showPrepayment && isPrepayPaid
          ? roundMoney(baseTotal * 0.25)
          : showPrepayment
            ? roundMoney(
                prepaymentPercent > 0
                  ? (baseTotal * prepaymentPercent) / 100
                  : baseTotal * 0.5,
              )
            : 0;
  const onlineBooking = isOnlineBookingType(booking, event);

  const feeSpecInput = {
    status,
    showLateCancellation,
    lateCancellationFeePercent,
    showNoShowFee,
    noShowFeePercent,
    lateRescheduleFeePercent: event.details?.lateRescheduleFeePercent,
    lineSubtotal: Math.max(lineSubtotalBeforeDiscount, feeRecoveredBase),
    extrasAmount: kilometerExtrasAmount(event),
    discount: event.details?.totalDiscount ?? null,
    cancellationFeeAt,
    exceededCancellationWindow,
  };

  const buildProtectiveFeeSummaryCard = (): SalesOverviewCardData | null => {
    // Stack protective fees on one Fee Summary (finance Paid/Due, else stamp calc).
    let feeLines = financeFeeHints
      .map((hint, index) => {
        const spec = resolveProtectiveFeeSalesCardSpec({
          ...feeSpecInput,
          financeFeeHint: hint,
        });
        if (!spec) return null;
        const feeLineId =
          spec.entryLabel === LATE_CANCELLATION_BOOKING_FEE
            ? `late-cancellation-${bookingId}`
            : spec.entryLabel === LATE_RESCHEDULING_FEE
              ? `late-reschedule-${bookingId}`
              : `no-show-${bookingId}`;
        return {
          id: `${feeLineId}-${index}`,
          label: spec.feeLabel,
          amount: spec.feeAmount,
          entryLabel: spec.entryLabel,
          metaLines: spec.metaLines,
          title: spec.title,
          settled: isSettledProtectiveFeeStatus(hint.status),
        };
      })
      .filter((line): line is NonNullable<typeof line> => line != null);

    // No finance fee row yet: use cancel/no-show stamps + existing price logic (not policy alone).
    if (!feeLines.length) {
      const price = computeBookingPrice({
        lineSubtotal: feeSpecInput.lineSubtotal,
        extrasAmount: feeSpecInput.extrasAmount ?? 0,
        discount: feeSpecInput.discount ?? null,
        showLateCancellation: Boolean(showLateCancellation),
        lateCancellationFeePercent: lateCancellationFeePercent ?? undefined,
        showNoShowFee: Boolean(showNoShowFee) || isNoShowStatus,
        noShowFeePercent: noShowFeePercent ?? undefined,
      });
      if (
        (isCancelled || showLateCancellation) &&
        showLateCancellation &&
        price.lateCancellationFeeAmount > 0
      ) {
        const percent = Number(lateCancellationFeePercent) || 0;
        feeLines = [
          {
            id: `late-cancellation-${bookingId}-stamp`,
            label:
              percent > 0
                ? formatProtectiveFeeLineDescription(
                    "lateCancellation",
                    percent,
                    price.afterDiscount,
                  )
                : LATE_CANCELLATION_BOOKING_FEE,
            amount: price.lateCancellationFeeAmount,
            entryLabel: LATE_CANCELLATION_BOOKING_FEE,
            metaLines: buildCancellationFeeInvoiceMetaLines({
              cancellationFeeAt,
              exceededCancellationWindow,
            }),
            title: "Fee Summary",
            settled: false,
          },
        ];
      } else if (
        (isNoShowStatus || showNoShowFee) &&
        price.noShowFeeAmount > 0
      ) {
        feeLines = [
          {
            id: `no-show-${bookingId}-stamp`,
            label: "No-show fee",
            amount: price.noShowFeeAmount,
            entryLabel: "No-show fee",
            metaLines: buildCancellationFeeInvoiceMetaLines({
              cancellationFeeAt,
              exceededCancellationWindow,
            }),
            title: "No-Show Fee Invoice",
            settled: false,
          },
        ];
      }
    }

    if (!feeLines.length) return null;

    const feeId = resolveLiveCardId(bookingId, `${bookingId}-protective-fee`);
    const feeTotal = roundMoney(
      feeLines.reduce((sum, line) => sum + line.amount, 0),
    );
    // Mocks: Total → Prepaid applied → Payment (remainder). €0 when prepaid covers.
    const prepaidCredit =
      isPrepayPaid && prepaidAmount > 0
        ? roundMoney(Math.min(prepaidAmount, feeTotal))
        : 0;
    const paymentAmount = roundMoney(Math.max(0, feeTotal - prepaidCredit));
    const title = feeLines.some((l) => l.entryLabel === "No-show fee")
      && feeLines.length === 1
      ? "No-Show Fee Invoice"
      : "Fee Summary";
    const metaLines = feeLines.flatMap((l) => l.metaLines);
    const feeSettled =
      paymentAmount <= 0 || feeLines.every((line) => line.settled);
    return applyMeta(
      {
        id: feeId,
        bookingId,
        bookingCode,
        kind: "after_treatment",
        title,
        clientName: name,
        payerRole: "main_client",
        payerKey: "main-client",
        clientEmail: email,
        clientPhone: phone,
        clientKind,
        lines: feeLines.map(({ id, label, amount }) => ({ id, label, amount })),
        total: feeTotal,
        totalLabel: "Total",
        secondaryRows:
          prepaidCredit > 0
            ? [
                {
                  id: "prepaid-credit",
                  label: "Prepaid",
                  amount: prepaidCredit,
                },
              ]
            : undefined,
        highlightLabel: "Payment",
        // Always set (incl. €0) — renderer teal Payment row must stay visible.
        highlightAmount: paymentAmount,
        metaLines,
        methodDateLine: method,
        dueDate:
          invoiceDueFromNotes || deriveDueDate(occurredAt, ctx.paymentTerms),
        // Same + Add-Ons control as After Treatment (Prepayment stays false).
        showAddOns: true,
        paymentMethod: eventPaymentMethod,
        paymentMethodLabel: method,
        documentAmount: paymentAmount > 0 ? paymentAmount : feeTotal,
        occurredAt,
        bookingEndAt: endAt,
      },
      ctx,
      {
        isOnlineBooking: onlineBooking,
        isAfterTreatment: true,
        isPrepayPaid: false,
        isFailed: false,
        paidHint: feeSettled,
      },
    );
  };

  // Cancelled / no-show: Prepayment + Fee Summary only (never After treatment).
  if (isCancelled || isNoShowStatus) {
    const cancelledCards: SalesOverviewCardData[] = [];
    if (isPrepayPaid && prepaidAmount > 0) {
      const prepayId = resolveLiveCardId(bookingId, `${bookingId}-prepayment`);
      // Heal fee-poisoned single service line (mapper used total_price = fee).
      const prepayLines = (() => {
        const positive = lines.filter((line) => line.amount >= 0);
        const sum = roundMoney(positive.reduce((s, l) => s + l.amount, 0));
        if (
          feeRecoveredBase > sum &&
          positive.length === 1 &&
          financeFeeHints.some(
            (h) =>
              roundMoney(Number(h.amount) || 0) ===
              roundMoney(positive[0].amount),
          )
        ) {
          return [{ ...positive[0], amount: baseTotal }];
        }
        return positive;
      })();
      const listedTotal = roundMoney(
        prepayLines.reduce((sum, line) => sum + line.amount, 0) || baseTotal,
      );
      cancelledCards.push(
        applyMeta(
          {
            id: prepayId,
            bookingId,
            bookingCode,
            kind: "prepayment",
            title: "Prepayment Summary",
            clientName: name,
            payerRole: "main_client",
            payerKey: "main-client",
            clientEmail: email,
            clientPhone: phone,
            clientKind,
            lines: prepayLines,
            total: listedTotal,
            totalLabel: "Total",
            highlightLabel: prepaidBreakdownLabel(prepaymentPercent, true),
            highlightAmount: prepaidAmount,
            methodDateLine: formatMethodDateTime(method, occurredAt),
            dueDate: null,
            showAddOns: false,
            paymentMethod: eventPaymentMethod,
            paymentMethodLabel: method,
            documentAmount: prepaidAmount,
            occurredAt,
            bookingEndAt: endAt,
          },
          ctx,
          {
            isOnlineBooking: onlineBooking,
            isAfterTreatment: false,
            isPrepayPaid: true,
            isFailed: false,
            paidHint: true,
          },
        ),
      );
    }
    const feeCard = buildProtectiveFeeSummaryCard();
    if (feeCard) cancelledCards.push(feeCard);
    // Early return: no After treatment / remaining-payment scenarios.
    return cancelledCards;
  }

  if (!lines.length && !booking) return [];

  const lateReschedulePercent = Math.max(
    0,
    Number(event.details?.lateRescheduleFeePercent) || 0,
  );
  const lateRescheduleCeiling = Number(
    event.details?.lateRescheduleFeePercentCeiling,
  );
  const effectiveLateReschedulePercent =
    Number.isFinite(lateRescheduleCeiling) && lateRescheduleCeiling >= 0
      ? Math.min(lateReschedulePercent, lateRescheduleCeiling)
      : lateReschedulePercent;
  const lateRescheduleFee = event.details?.showLateRescheduling
    ? roundMoney((baseTotal * effectiveLateReschedulePercent) / 100)
    : 0;
  const total = roundMoney(baseTotal + lateRescheduleFee);

  // Prefer real calendar/catalog lines only — no synthetic filler without a catalog id.
  const fallbackServiceId = booking?.service_id ? String(booking.service_id) : "";
  const effectiveLines: SalesLineItem[] = [
    ...(lines.length > 0
      ? lines
      : fallbackServiceId
        ? [
            {
              id: fallbackServiceId,
              label: booking?.service_title || event.title || "Service",
              amount: baseTotal,
            },
          ]
        : []),
    ...(lateRescheduleFee > 0
      ? [{
          id: `late-reschedule-${bookingId}`,
          label: formatProtectiveFeeLineDescription(
            "lateRescheduling",
            effectiveLateReschedulePercent,
            baseTotal,
          ),
          amount: lateRescheduleFee,
        }]
      : []),
  ];

  const isFailed = prepayStatus === "failed";
  const isCompleted = status === "completed";
  const isPendingRequest = status === "requested";
  const isAccepted =
    status === "confirmed" || status === "completed" || status === "in_progress" || status === "in progress";

  const ended = hasBookingEnded(endAt);

  const shares = resolveSalesPayerShares({
    event,
    allLines: effectiveLines.filter((line) => line.amount >= 0),
    mainClientName: name,
    mainClientEmail: email,
    mainClientPhone: phone,
  });
  const guestModelSharesBase = shares.filter((s) => s.role !== "main_client");
  const mainShareBase = shares.find((s) => s.role === "main_client") ?? shares[0];

  const cards: SalesOverviewCardData[] = [];
  const applyExtras = {
    isOnlineBooking: onlineBooking,
    isPrepayPaid,
    isFailed,
  };

  const pushPrepaymentCard = () => {
    const prepayId = resolveLiveCardId(bookingId, `${bookingId}-prepayment`);
    cards.push(
      applyMeta(
        {
          id: prepayId,
          bookingId,
          bookingCode,
          kind: "prepayment",
          title: "Prepayment Summary",
          clientName: name,
          payerRole: "main_client",
          payerKey: "main-client",
          clientEmail: email,
          clientPhone: phone,
          clientKind,
          lines: effectiveLines.filter((line) => line.amount >= 0),
          total,
          totalLabel: "Total",
          highlightLabel: prepaidBreakdownLabel(prepaymentPercent, isPrepayPaid),
          highlightAmount: prepaidAmount,
          methodDateLine: isPrepayPaid ? formatMethodDateTime(method, occurredAt) : method,
          dueDate: isPrepayPaid
            ? null
            : invoiceDueFromNotes || deriveDueDate(occurredAt, ctx.paymentTerms),
          showAddOns: false,
          paymentMethod: eventPaymentMethod,
          paymentMethodLabel: method,
          documentAmount: prepaidAmount,
          occurredAt,
          bookingEndAt: endAt,
        },
        ctx,
        { ...applyExtras, isAfterTreatment: false, paidHint: isPrepayPaid },
      ),
    );
  };

  const withProtectiveFeeSummary = (list: SalesOverviewCardData[]) => {
    const feeCard = buildProtectiveFeeSummaryCard();
    let next = list;
    if (
      feeCard &&
      !list.some((c) => c.id === feeCard.id || c.title === feeCard.title)
    ) {
      next = [...list, feeCard];
    }
    return applyLedgerFinancialsToCards(next, bookingFinancials, {
      bookingStatus: status,
    });
  };

  if (isPendingRequest) {
    if (!mainShareBase) return [];
    // Requested + prepay: same Prepayment Summary as accepted (never Add-ons here).
    if (showPrepayment && prepaidAmount > 0) {
      pushPrepaymentCard();
      return withProtectiveFeeSummary(cards);
    }

    const summaryId = resolveLiveCardId(bookingId, `${bookingId}-summary`);
    const requestDue = invoiceDueFromNotes || deriveDueDate(occurredAt, ctx.paymentTerms);
    const hasGuestSubs = guestModelSharesBase.length > 0;
    const mainLines = withNegativeLines(mainShareBase.lines, effectiveLines);
    const mainTotal = sumLineAmounts(mainLines);

    const subCards: SalesSubCardData[] = guestModelSharesBase.map((share) => ({
      id: `${summaryId}-sub-${share.key}`,
      bookingId,
      bookingCode,
      payerRole: share.role,
      payerLabel: share.label,
      payerName: share.displayName,
      lines: share.lines,
      total: share.subtotal,
      highlightLabel: "Total Amount",
      highlightAmount: share.subtotal,
      dueDate: requestDue,
      methodDateLine: method,
      showAddOns: true,
      parentClientName: name,
    }));

    cards.push(
      applyMeta(
        {
          id: summaryId,
          bookingId,
          bookingCode,
          kind: "after_treatment",
          title: "Summary",
          clientName: name,
          payerRole: "main_client",
          payerKey: mainShareBase.key,
          clientEmail: email,
          clientPhone: phone,
          clientKind,
          lines: mainLines,
          highlightedLineIds: mainLines.map((line) => line.id),
          subCards: subCards.length ? subCards : undefined,
          total: hasGuestSubs ? total : mainTotal,
          totalLabel: "Total",
          highlightLabel: "Payment",
          highlightAmount: mainTotal,
          methodDateLine: method,
          dueDate: requestDue,
          showAddOns: true,
          paymentMethod: eventPaymentMethod,
          paymentMethodLabel: method,
          documentAmount: mainTotal,
          occurredAt,
          bookingEndAt: endAt,
        },
        ctx,
        { ...applyExtras, isAfterTreatment: false },
      ),
    );
    return withProtectiveFeeSummary(cards);
  }

  if (isAccepted && showPrepayment && prepaidAmount > 0) {
    pushPrepaymentCard();
  }

  const isInProgress = status === "in_progress" || status === "in progress";
  const splitState = parseSplitBillState(event.details?.splitBill);
  const hasCollectedAfterTreatment = Boolean(splitState?.payers.some((payer) => payer.paid));
  // Prepaid-only: hide until In Progress / Completed / waiting / already collected (not clock end).
  const showAfterTreatment = shouldShowAfterTreatmentCard({
    isPrepayPaid,
    isInProgress,
    isCompleted,
    ended,
    waitingForPayment: event.details?.waitingForPayment,
    hasCollectedAfterTreatment,
  });
  if (showAfterTreatment && isAccepted) {
    const splitPayments = buildSplitPaymentAmounts({
      shares,
      prepaidAmount: isPrepayPaid ? prepaidAmount : 0,
    });
    const guestModelShares = splitPayments.filter((s) => s.role !== "main_client");
    const mainShare = splitPayments.find((s) => s.role === "main_client") ?? splitPayments[0];
    const afterId = resolveLiveCardId(bookingId, `${bookingId}-after-treatment`);

    if (mainShare) {
      const mainPaid = isSplitPayerPaid(splitState, mainShare.key);
      const secondaryRows: SalesLineItem[] =
        isPrepayPaid && prepaidAmount > 0
          ? [{ id: "prepaid-deduction", label: "Prepaid", amount: -prepaidAmount }]
          : [];
      const hasGuestSubs = guestModelShares.length > 0;
      const mainLines = withNegativeLines(mainShare.lines, effectiveLines);
      const mainListedTotal = sumLineAmounts(mainLines);
      const mainPayable = roundMoney(
        Math.max(
          0,
          mainListedTotal - (isPrepayPaid && prepaidAmount > 0 ? prepaidAmount : 0),
        ),
      );
      const guestSubs: SalesSubCardData[] = guestModelShares.map((share) => {
        const subPaid = isSplitPayerPaid(splitState, share.key);
        const payer = splitState?.payers.find((row) => row.key === share.key);
        return {
          id: `${afterId}-sub-${share.key}`,
          bookingId,
          bookingCode,
          payerRole: share.role,
          payerLabel: share.label,
          payerName: share.displayName,
          payerKey: share.key,
          lines: share.lines,
          total: share.subtotal,
          highlightLabel: "Total Amount",
          highlightAmount: share.paymentAmount,
          paidAt: payer?.paidAt ?? (subPaid ? occurredAt : null),
          paymentState: subPaid ? ("paid" as const) : undefined,
          dueDate: invoiceDueFromNotes,
          methodDateLine: method,
          showAddOns: true,
          parentClientName: name,
        };
      });

      // Split: parent shell + main + guest/model subCards (Add-Ons on subCards only).
      // Solo main: flat parent card (no subCards) keeps Add-Ons.
      const mainPayer = splitState?.payers.find((row) => row.key === mainShare.key);
      const subCards: SalesSubCardData[] | undefined = hasGuestSubs
        ? [
            {
              id: `${afterId}-sub-${mainShare.key}`,
              bookingId,
              bookingCode,
              payerRole: "main_client",
              payerLabel: mainShare.label || name,
              payerName: mainShare.displayName || name,
              payerKey: mainShare.key,
              clientEmail: email,
              lines: mainLines,
              total: mainListedTotal,
              totalLabel: "Total Amount",
              secondaryRows: secondaryRows.length ? secondaryRows : undefined,
              highlightLabel: "Payment",
              highlightAmount: mainPayable,
              paidAt: mainPayer?.paidAt ?? (mainPaid ? occurredAt : null),
              paymentState: mainPaid ? ("paid" as const) : undefined,
              dueDate: invoiceDueFromNotes,
              methodDateLine: method,
              showAddOns: true,
              parentClientName: name,
            },
            ...guestSubs,
          ]
        : undefined;

      cards.push(
        applyMeta(
          {
            id: afterId,
            bookingId,
            bookingCode,
            kind: "after_treatment",
            title: "After treatment Summary",
            clientName: name,
            payerRole: "main_client",
            payerKey: hasGuestSubs ? undefined : mainShare.key,
            clientEmail: email,
            clientPhone: phone,
            clientKind,
            lines: hasGuestSubs ? [] : mainLines,
            highlightedLineIds: hasGuestSubs
              ? undefined
              : mainLines.map((line) => line.id),
            subCards,
            total: hasGuestSubs ? 0 : mainListedTotal,
            totalLabel: "Total Amount",
            secondaryRows: hasGuestSubs ? undefined : secondaryRows,
            highlightLabel: "Payment",
            highlightAmount: hasGuestSubs ? 0 : mainPayable,
            dueDate: invoiceDueFromNotes,
            showAddOns: !hasGuestSubs,
            paymentMethod: eventPaymentMethod,
            paymentMethodLabel: method,
            documentAmount: hasGuestSubs ? 0 : mainPayable,
            occurredAt,
            bookingEndAt: endAt,
          },
          ctx,
          {
            ...applyExtras,
            isAfterTreatment: true,
            paidHint: hasGuestSubs ? false : mainPaid,
          },
        ),
      );
    }
  }

  return withProtectiveFeeSummary(cards);
}
