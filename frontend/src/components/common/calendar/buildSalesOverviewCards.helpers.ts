import type { CalendarBooking } from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  calculateManualEntryDiscountAmount,
  lineTotal,
  type ManualEntryDiscount,
} from "../../sections/finance/manualEntry.data";
import { parseApiCalendarEventId } from "./bookingEventDetails";
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
import { buildSplitPaymentAmounts, parseSplitBillState, resolveSalesPayerShares } from "./salesSplitBill";
import { formatFinanceDueDate } from "../booking-finance/formatBookingFinance";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";
import {
  applyVisualState,
  discountLine,
  formatDateLabel,
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
};
function buildLinesFromEvent(event: CalendarEvent): { lines: SalesLineItem[]; subtotal: number } {
  const details = event.details;
  const lines: SalesLineItem[] = [];
  let subtotal = 0;

  const snapshotServices = details?.clientSnapshot?.services;
  if (snapshotServices?.length) {
    for (const service of snapshotServices) {
      lines.push({ id: service.id, label: service.name, amount: roundMoney(service.price) });
      subtotal += service.price;
    }
  } else {
    for (const service of details?.services ?? []) {
      lines.push({ id: service.id, label: service.name, amount: roundMoney(service.price) });
      subtotal += service.price;
    }
    for (const guest of details?.guests ?? []) {
      for (const service of guest.services ?? []) {
        if (lines.some((line) => line.id === service.id)) continue;
        lines.push({ id: service.id, label: service.name, amount: roundMoney(service.price) });
        subtotal += service.price;
      }
      for (const product of guest.products ?? []) {
        if (lines.some((line) => line.id === product.id)) continue;
        const amount = roundMoney(product.price);
        lines.push({
          id: product.id,
          label: product.quantity > 1 ? `${product.name} Ã—${product.quantity}` : product.name,
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
      label: product.quantity > 1 ? `${product.name} Ã—${product.quantity}` : product.name,
      amount,
    });
    subtotal += product.price;
  }

  const discount = discountLine(details?.totalDiscount ?? null, subtotal);
  if (discount) {
    lines.push(discount);
    subtotal += discount.amount;
  }

  return { lines, subtotal: roundMoney(Math.max(0, subtotal)) };
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
    applyVisualState(next, "overdue", { method: meta.paymentMethod, dueDate: meta.dueDate });
  } else if (past) {
    applyVisualState(next, "overdue_invoice", { method: meta.paymentMethod, dueDate: meta.dueDate });
  } else {
    applyVisualState(next, "payment_due", { method: meta.paymentMethod, dueDate: meta.dueDate });
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
) {
  const finance = matchFinanceHint(
    {
      id: next.id,
      bookingId: next.bookingId,
      bookingCode: next.bookingCode,
      kind,
      payerKey: "payerKey" in next ? next.payerKey : undefined,
    },
    ctx.financeHints,
  );
  const financeStatus = String(finance?.status ?? "").toLowerCase();
  const refunded = Boolean(meta?.refunded) || financeStatus === "refunded";
  const voided = Boolean(meta?.voided) || financeStatus === "voided" || financeStatus === "void";
  const failed = Boolean(extras.isFailed) || financeStatus === "failed";
  const paidHint =
    Boolean(extras.paidHint) ||
    Boolean(meta?.paidAt) ||
    Boolean(meta?.paid) ||
    financeStatus === "paid" ||
    financeStatus === "prepaid";
  const paidAt = meta?.paidAt || finance?.paidAt || extras.occurredAt;
  const dueDate = meta?.dueDate || finance?.dueDate || next.dueDate;
  const paymentMethod = meta?.paymentMethod || ("paymentMethod" in next ? next.paymentMethod : undefined) || finance?.paymentMethod;

  if (refunded) {
    if ("refunded" in next) next.refunded = true;
    applyVisualState(next, "refunded", { method: paymentMethod, occurredAt: extras.occurredAt });
    return;
  }
  if (voided) {
    if ("voided" in next) next.voided = true;
    applyVisualState(next, "voided", { method: paymentMethod, occurredAt: extras.occurredAt });
    return;
  }
  if (failed) {
    applyVisualState(next, "failed", { method: paymentMethod, occurredAt: extras.occurredAt });
    return;
  }

  const open = resolveOpenState({
    kind,
    isOnlineBooking: extras.isOnlineBooking,
    paymentMethod,
    dueDate,
    markedUnpaid: Boolean(meta?.markedUnpaid),
    paidHint,
    paidAt,
    isPrepayPaid: extras.isPrepayPaid || financeStatus === "prepaid",
    occurredAt: extras.occurredAt,
    paymentTerms: ctx.paymentTerms,
    isAfterTreatment: extras.isAfterTreatment,
  });

  applyVisualState(next, open.state, {
    method: paymentMethod,
    dueDate: open.dueDate,
    paidAt: open.paidAt,
    occurredAt: extras.occurredAt,
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
  if (meta?.canceled) {
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

  applyFinanceAndMetaState(next, meta, ctx, "after_treatment", {
    isOnlineBooking: extras.isOnlineBooking,
    paidHint: extras.paidHint,
    occurredAt: extras.occurredAt,
    isAfterTreatment: extras.isAfterTreatment ?? true,
  });

  if ((meta?.dueDate || next.dueDate) && next.paymentState !== "paid" && next.paymentState !== "refunded") {
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

  applyFinanceAndMetaState(next, meta, ctx, next.kind, {
    isOnlineBooking: extras.isOnlineBooking,
    isPrepayPaid: extras.isPrepayPaid,
    isFailed: extras.isFailed,
    paidHint: extras.paidHint,
    occurredAt: next.occurredAt,
    isAfterTreatment: extras.isAfterTreatment,
  });

  if (meta) {
    applyDueDateMeta(next, meta, next.kind);
    applyPenaltyAmount(next, meta.penaltyAmount);
    if (meta.canceled) {
      next.canceled = true;
      next.statusBadge = undefined;
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
        .filter((sub) => !getSalesCardMeta(sub.id)?.canceled),
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
  if (!lines.length && !booking) return [];

  const bookingId = parseApiCalendarEventId(event.id)?.id ?? event.id;
  const bookingCode = event.bookingCode || bookingId;
  const totalFromBooking = Number(booking?.total_price);
  const total = lines.length
    ? subtotal
    : roundMoney(Number.isFinite(totalFromBooking) ? totalFromBooking : 0);

  const effectiveLines =
    lines.length > 0
      ? lines
      : [
          {
            id: `svc-${bookingId}`,
            label: booking?.service_title || event.title || "Service",
            amount: total,
          },
        ];

  const prepayStatus = String(booking?.prepayment_status ?? event.details?.prepaymentStatus ?? "").toLowerCase();
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
      ? roundMoney((total * prepaymentPercent) / 100)
      : showPrepayment && (prepayStatus === "paid" || prepayStatus === "confirmed")
        ? roundMoney(total * 0.25)
        : showPrepayment
          ? roundMoney(prepaymentPercent > 0 ? (total * prepaymentPercent) / 100 : total * 0.5)
          : 0;

  const isPrepayPaid = prepayStatus === "paid" || prepayStatus === "confirmed";
  const isFailed = prepayStatus === "failed";
  const status = String(booking?.status ?? event.status ?? "").toLowerCase();
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled" || status === "canceled";
  const isInvalid = status === "invalid" || isBookingRequestRejected(event);
  const isPendingRequest = status === "requested";
  const isAccepted =
    status === "confirmed" || status === "completed" || status === "in_progress" || status === "in progress";
  const onlineBooking = isOnlineBookingType(booking, event);
  const invoiceDueFromNotes = event.details?.invoiceDueDate ?? null;
  const eventPaymentMethod = event.details?.paymentMethod as SalesCheckoutPaymentMethod | undefined;

  if (isInvalid || isCancelled) return [];

  const method = paymentMethodLabel(eventPaymentMethod);
  const occurredAt =
    booking?.created_at || booking?.start_time || `${event.date}T${event.start}:00`;
  const endAt = bookingEndIso(event, booking);
  const ended = hasBookingEnded(endAt);
  const name = clientName || event.showClientName || booking?.customer_name || booking?.client_name || "Client";
  const email = clientEmail || event.details?.clientEmail || booking?.customer_email || undefined;
  const phone =
    clientPhone ||
    [event.details?.phoneCode, event.details?.phoneNumber].filter(Boolean).join(" ").trim() ||
    booking?.contact_number ||
    undefined;

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

  if (isPendingRequest) {
    if (!mainShareBase) return [];
    const summaryId = resolveLiveCardId(bookingId, `${bookingId}-summary`);
    const requestDue = invoiceDueFromNotes || deriveDueDate(occurredAt, ctx.paymentTerms);

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
          kind: showPrepayment ? "prepayment" : "after_treatment",
          title: "Summary",
          clientName: name,
          payerRole: "main_client",
          payerKey: mainShareBase.key,
          clientEmail: email,
          clientPhone: phone,
          clientKind,
          lines: mainShareBase.lines,
          highlightedLineIds: mainShareBase.lines.map((line) => line.id),
          subCards: subCards.length ? subCards : undefined,
          total,
          totalLabel: "Total",
          highlightLabel: "Payment",
          highlightAmount: mainShareBase.subtotal,
          methodDateLine: method,
          dueDate: requestDue,
          showAddOns: true,
          paymentMethod: eventPaymentMethod,
          paymentMethodLabel: method,
          documentAmount: mainShareBase.subtotal,
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
    const percentLabel = prepaymentPercent > 0 ? `(${prepaymentPercent}%)` : "";
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
          highlightLabel: `Prepayment${percentLabel ? ` ${percentLabel}` : ""}`,
          highlightAmount: prepaidAmount,
          methodDateLine: isPrepayPaid ? formatMethodDateTime(method, occurredAt) : method,
          dueDate: isPrepayPaid ? null : invoiceDueFromNotes || deriveDueDate(occurredAt, ctx.paymentTerms),
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
  }

  // After treatment Summary only after the service end time (or completed).
  const showAfterTreatment = ended || isCompleted;
  if (showAfterTreatment && isAccepted) {
    const splitPayments = buildSplitPaymentAmounts({
      shares,
      prepaidAmount: isPrepayPaid ? prepaidAmount : 0,
    });
    const guestModelShares = splitPayments.filter((s) => s.role !== "main_client");
    const mainShare = splitPayments.find((s) => s.role === "main_client") ?? splitPayments[0];
    const splitState = parseSplitBillState(event.details?.splitBill);
    const afterId = resolveLiveCardId(bookingId, `${bookingId}-after-treatment`);

    if (mainShare) {
      const mainPaid = isSplitPayerPaid(splitState, mainShare.key);
      const secondaryRows: SalesLineItem[] =
        isPrepayPaid && prepaidAmount > 0
          ? [{ id: "prepaid-deduction", label: "Prepaid", amount: -prepaidAmount }]
          : [];

      const subCards: SalesSubCardData[] = guestModelShares.map((share) => {
        const subPaid = isSplitPayerPaid(splitState, share.key);
        const payer = splitState?.payers.find((row) => row.key === share.key);
        return {
          id: `${afterId}-sub-${share.key}`,
          bookingId,
          bookingCode,
          payerRole: share.role,
          payerLabel: share.label,
          payerName: share.displayName,
          lines: share.lines,
          total: share.subtotal,
          highlightLabel: "Total Amount",
          highlightAmount: share.paymentAmount,
          paidAt: payer?.paidAt ?? null,
          dueDate: invoiceDueFromNotes,
          methodDateLine: method,
          showAddOns: true,
          parentClientName: name,
          paymentState: subPaid ? "paid" : undefined,
        };
      });

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
            lines: mainShare.lines,
            highlightedLineIds: mainShare.lines.map((line) => line.id),
            subCards: subCards.length ? subCards : undefined,
            total,
            totalLabel: "Total",
            secondaryRows,
            highlightLabel: "Payment",
            highlightAmount: mainShare.paymentAmount,
            dueDate: invoiceDueFromNotes,
            showAddOns: true,
            paymentMethod: eventPaymentMethod,
            paymentMethodLabel: method,
            documentAmount: mainShare.paymentAmount,
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
    }
  }

  return cards;
}

