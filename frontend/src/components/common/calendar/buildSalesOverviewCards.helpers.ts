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
  resolveKilometerAllowanceAmount,
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
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";
import { computeBookingPrice } from "./bookingTotal";
import {
  formatProtectiveFeeLineDescription,
  isProtectiveFeeEntryLabel,
  LATE_CANCELLATION_BOOKING_FEE,
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

export type BuilderCtx = {
  financeHints: SalesFinanceHint[];
  paymentTerms?: SalesPaymentTermsInput;
  /** Business setup `late_cancellation_fee_percentage` — heal Fee Summary when booking stamp/LCF missing. */
  lateCancellationFeePercentDefault?: string | number | null;
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

/** Fold saved add-ons into the live booking summary (not a separate add-ons-only card). */
export function mergeAddonRecordsIntoCards(
  cards: SalesOverviewCardData[],
  addonRecords: SalesAddonRecord[],
  ctx: BuilderCtx,
): SalesOverviewCardData[] {
  // Keep one add-ons card per booking. New add-ons are folded into the same
  // card, so the summary and total never repeat for the same booking.
  const grouped = new Map<string, SalesAddonRecord>();
  for (const record of addonRecords) {
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
    });
  }
  return [...cards, ...[...grouped.values()].map((record) => buildAddonCard(record, ctx))];
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

  if (meta.reissuedAt) {
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
}>(next: T, meta: SalesCardMetaRecord): void {
  if (!meta.editedLines?.length) return;
  next.lines = meta.editedLines.map((line) => ({
    id: line.id,
    label: line.quantity > 1 ? `${line.name} Ã—${line.quantity}` : line.name,
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
    next.total = roundMoney(meta.totalPrice);
    next.highlightAmount = roundMoney(meta.totalPrice);
    if ("documentAmount" in next) next.documentAmount = roundMoney(meta.totalPrice);
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
  if (
    finance?.lineItems?.length &&
    !meta?.editedLines?.length &&
    Array.isArray(next.lines)
  ) {
    next.lines = finance.lineItems.map((line) => ({ ...line }));
    if ("highlightedLineIds" in next) next.highlightedLineIds = undefined;
  }

  const paymentMethod =
    meta?.paymentMethod ||
    ("paymentMethod" in next ? next.paymentMethod : undefined) ||
    finance?.paymentMethod;
  const paidAt = meta?.paidAt || finance?.paidAt || extras.occurredAt;
  const dueDate = meta?.dueDate || finance?.dueDate || next.dueDate;

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
    if (
      meta?.reissuedAt &&
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
      ctx.paymentTerms,
      Boolean(meta?.reissuedAt),
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
  if (meta?.reissuedAt && (open.state === "payment_due" || open.state === "overdue_invoice")) {
    if ("title" in next && typeof next.title === "string") {
      next.title = "Reissued Invoice Summary";
    }
    if ("kind" in next) next.kind = "reissued_invoice";
    next.limitedMenu = true;
  }
  next.penaltyPrompt = resolvePenaltyPrompt(open.state, ctx.paymentTerms, Boolean(meta?.reissuedAt));
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
  const meta = getSalesCardMeta(sub.id);
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

  next.penaltyPrompt = resolvePenaltyPrompt(next.paymentState, ctx.paymentTerms, Boolean(meta?.reissuedAt));
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

  next.penaltyPrompt = resolvePenaltyPrompt(next.paymentState, ctx.paymentTerms, Boolean(meta?.reissuedAt));

  if (next.subCards?.length) {
    next = {
      ...next,
      subCards: next.subCards
        .map((sub) =>
          applySubMeta(sub, ctx, {
            isOnlineBooking: extras.isOnlineBooking,
            occurredAt: next.occurredAt,
            isAfterTreatment: extras.isAfterTreatment,
            paidHint: sub.paymentState === "paid",
          }),
        )
        .filter((sub) => {
          const subMeta = getSalesCardMeta(sub.id);
          return !subMeta?.canceled || Boolean(subMeta.voided);
        }),
    };
  }

  return next;
}

export function buildAddonCard(record: SalesAddonRecord, ctx: BuilderCtx): SalesOverviewCardData {
  const lines: SalesLineItem[] = record.lines.map((line) => ({
    id: line.id,
    label: line.quantity > 1 ? `${line.name} Ã—${line.quantity}` : line.name,
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
  return (
    (hint.bookingId != null && String(hint.bookingId) === String(bookingId)) ||
    (hint.bookingCode != null && String(hint.bookingCode) === String(bookingCode)) ||
    (hint.bookingId != null && String(hint.bookingId) === String(bookingCode))
  );
}

/** Paid / open LCF (or no-show) finance row for a booking — heal Sales when notes lack the stamp. */
export function findProtectiveFeeFinanceHint(
  hints: readonly SalesFinanceHint[],
  bookingId: string,
  bookingCode: string,
): SalesFinanceHint | undefined {
  const matches = hints.filter((hint) => {
    if (!financeHintMatchesBooking(hint, bookingId, bookingCode)) return false;
    if (!isProtectiveFeeEntryLabel(hint.entryLabel)) return false;
    const status = String(hint.status ?? "").toLowerCase();
    if (status === "voided" || status === "void" || status === "refunded") return false;
    return true;
  });
  return matches[0];
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
  lineSubtotal: number;
  extrasAmount?: number;
  discount?: { type: "fixed" | "percentage"; amount: number } | null;
  cancellationFeeAt?: string | null;
  exceededCancellationWindow?: boolean;
  /** When notes lack the stamp but finance already has a paid/open fee invoice. */
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
  const hasHintAmount =
    hint &&
    Number.isFinite(hintAmount) &&
    hintAmount > 0 &&
    isProtectiveFeeEntryLabel(hint.entryLabel);

  if (
    (status === "cancelled" || status === "canceled") &&
    input.showLateCancellation
  ) {
    // Prefer computed % fee; fall back to finance LCF amount when line base is gone
    // (e.g. total_price replaced with fee-only after checkout).
    const feeAmount =
      price.lateCancellationFeeAmount > 0
        ? price.lateCancellationFeeAmount
        : hasHintAmount &&
            String(hint?.entryLabel ?? "").startsWith(LATE_CANCELLATION_BOOKING_FEE)
          ? roundMoney(hintAmount)
          : 0;
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

  if (
    (status === "no_show" || status === "no show") &&
    input.showNoShowFee
  ) {
    const feeAmount =
      price.noShowFeeAmount > 0
        ? price.noShowFeeAmount
        : hasHintAmount &&
            String(hint?.entryLabel).toLowerCase() === "no-show fee"
          ? roundMoney(hintAmount)
          : 0;
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

  // Residual: fee charged (finance LCF) but booking notes never got showLateCancellation.
  if (hasHintAmount) {
    const isLateCancelLabel = String(hint!.entryLabel ?? "").startsWith(
      LATE_CANCELLATION_BOOKING_FEE,
    );
    const isNoShowLabel = String(hint!.entryLabel).toLowerCase() === "no-show fee";
    if (
      isLateCancelLabel &&
      (status === "cancelled" || status === "canceled")
    ) {
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
    if (isNoShowLabel && (status === "no_show" || status === "no show")) {
      return {
        title: "No-Show Fee Invoice",
        feeLabel: "No-show fee",
        feeAmount: roundMoney(hintAmount),
        entryLabel: "No-show fee",
        metaLines: buildCancellationFeeInvoiceMetaLines({
          cancellationFeeAt: input.cancellationFeeAt,
          exceededCancellationWindow: input.exceededCancellationWindow,
        }),
      };
    }
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
  const baseTotal = lines.length
    ? subtotal
    : roundMoney(Number.isFinite(totalFromBooking) ? totalFromBooking : 0);
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
  const prepaidAmount =
    showPrepayment && prepaymentPercent > 0
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

  const financeFeeHint = findProtectiveFeeFinanceHint(
    ctx.financeHints,
    String(bookingId),
    String(bookingCode),
  );

  // Percent: booking stamp → notes → business policy (old cancels never stamped).
  const stampedLateCancelPercent =
    event.details?.lateCancellationFeePercent ?? notesFee.lateCancellationFeePercent;
  const lateCancellationFeePercent =
    Number(stampedLateCancelPercent) > 0
      ? stampedLateCancelPercent
      : ctx.lateCancellationFeePercentDefault;
  const policyLateCancelPercent = Number(lateCancellationFeePercent) || 0;
  // Heal Fee Summary when cancel kept prepaid / breached window / LCF exists but stamp missing.
  const showLateCancellation =
    Boolean(event.details?.showLateCancellation) ||
    notesFee.showLateCancellation ||
    (isCancelled &&
      policyLateCancelPercent > 0 &&
      (isPrepayPaid ||
        exceededCancellationWindow === true ||
        Boolean(cancellationFeeAt) ||
        Boolean(financeFeeHint)));

  const feeSpec = resolveProtectiveFeeSalesCardSpec({
    status,
    showLateCancellation,
    lateCancellationFeePercent,
    showNoShowFee,
    noShowFeePercent,
    lineSubtotal: lineSubtotalBeforeDiscount,
    extrasAmount: kilometerExtrasAmount(event),
    discount: event.details?.totalDiscount ?? null,
    cancellationFeeAt,
    exceededCancellationWindow,
    financeFeeHint,
  });

  // Cancelled / protective-fee: fee invoice + prepaid receipt when prepaid was collected.
  if (feeSpec || isCancelled) {
    const cancelledCards: SalesOverviewCardData[] = [];
    if (isPrepayPaid && prepaidAmount > 0) {
      const prepayId = resolveLiveCardId(bookingId, `${bookingId}-prepayment`);
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
            lines: lines.filter((line) => line.amount >= 0),
            total: baseTotal,
            totalLabel: "Total Amount",
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
    if (feeSpec) {
      const feeId = resolveLiveCardId(bookingId, `${bookingId}-protective-fee`);
      const feeLineId =
        feeSpec.entryLabel === LATE_CANCELLATION_BOOKING_FEE
          ? `late-cancellation-${bookingId}`
          : `no-show-${bookingId}`;
      // Image 2 Fee Summary: Total → Prepaid credit → Payment (net).
      const prepaidCredit =
        isPrepayPaid && prepaidAmount > 0
          ? roundMoney(Math.min(prepaidAmount, feeSpec.feeAmount))
          : 0;
      const paymentAmount = roundMoney(
        Math.max(0, feeSpec.feeAmount - prepaidCredit),
      );
      const feeHintStatus = String(financeFeeHint?.status ?? "").toLowerCase();
      const feePaidHint =
        feeHintStatus === "paid" ||
        feeHintStatus === "prepaid" ||
        feeHintStatus === "confirmed" ||
        paymentAmount <= 0;
      cancelledCards.push(
        applyMeta(
          {
            id: feeId,
            bookingId,
            bookingCode,
            kind: "after_treatment",
            title: feeSpec.title,
            clientName: name,
            payerRole: "main_client",
            payerKey: "main-client",
            clientEmail: email,
            clientPhone: phone,
            clientKind,
            lines: [
              {
                id: feeLineId,
                label: feeSpec.feeLabel,
                amount: feeSpec.feeAmount,
              },
            ],
            total: feeSpec.feeAmount,
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
            highlightAmount: paymentAmount,
            metaLines: feeSpec.metaLines,
            methodDateLine: method,
            dueDate:
              invoiceDueFromNotes || deriveDueDate(occurredAt, ctx.paymentTerms),
            showAddOns: false,
            paymentMethod: eventPaymentMethod,
            paymentMethodLabel: method,
            documentAmount: paymentAmount > 0 ? paymentAmount : feeSpec.feeAmount,
            occurredAt,
            bookingEndAt: endAt,
          },
          ctx,
          {
            isOnlineBooking: onlineBooking,
            isAfterTreatment: true,
            isPrepayPaid: false,
            isFailed: false,
            paidHint: feePaidHint,
          },
        ),
      );
    }
    if (cancelledCards.length || isCancelled) return cancelledCards;
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
          totalLabel: "Total Amount",
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

  if (isPendingRequest) {
    if (!mainShareBase) return [];
    // Requested + prepay: same Prepayment Summary as accepted (never Add-ons here).
    if (showPrepayment && prepaidAmount > 0) {
      pushPrepaymentCard();
      return cards;
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
    return cards;
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

      // Split bill: one After Treatment card per payer (main + each guest/model).
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
            payerKey: mainShare.key,
            clientEmail: email,
            clientPhone: phone,
            clientKind,
            lines: mainLines,
            highlightedLineIds: mainLines.map((line) => line.id),
            total: hasGuestSubs ? total : mainListedTotal,
            totalLabel: "Total Amount",
            secondaryRows,
            highlightLabel: "Payment",
            highlightAmount: mainPayable,
            dueDate: invoiceDueFromNotes,
            showAddOns: true,
            paymentMethod: eventPaymentMethod,
            paymentMethodLabel: method,
            documentAmount: mainPayable,
            occurredAt,
            bookingEndAt: endAt,
          },
          ctx,
          {
            ...applyExtras,
            isAfterTreatment: true,
            paidHint: mainPaid,
          },
        ),
      );

      for (const share of guestModelShares) {
        const subPaid = isSplitPayerPaid(splitState, share.key);
        const payer = splitState?.payers.find((row) => row.key === share.key);
        cards.push(
          applyMeta(
            {
              id: `${afterId}-sub-${share.key}`,
              bookingId,
              bookingCode,
              kind: "after_treatment",
              title: "After treatment Summary",
              clientName: share.displayName,
              payerLabel: share.label,
              payerRole: share.role,
              payerKey: share.key,
              lines: share.lines,
              highlightedLineIds: share.lines.map((line) => line.id),
              total: share.subtotal,
              totalLabel: "Total Amount",
              highlightLabel: "Total Amount",
              highlightAmount: share.paymentAmount,
              paidAt: payer?.paidAt ?? null,
              dueDate: invoiceDueFromNotes,
              methodDateLine: method,
              showAddOns: true,
              paymentMethod: eventPaymentMethod,
              paymentMethodLabel: method,
              documentAmount: share.paymentAmount,
              occurredAt,
              bookingEndAt: endAt,
            },
            ctx,
            {
              ...applyExtras,
              isAfterTreatment: true,
              paidHint: subPaid,
            },
          ),
        );
      }
    }
  }

  return cards;
}
