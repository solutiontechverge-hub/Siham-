import type { CalendarBooking } from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  calculateManualEntryDiscountAmount,
  lineTotal,
  type ManualEntryDiscount,
} from "../../sections/finance/manualEntry.data";
import { mapCalendarBookingToEvent } from "./calendar-overview.mappers";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import { isBookingRequestRejected } from "./bookingStatus";
import { getSalesCardMeta, listSalesAddonsForBookings, resolveLiveCardId } from "./salesOverview.storage";
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
import { salesPaymentBadge } from "./salesOverview.types";
import { buildSplitPaymentAmounts, parseSplitBillState, resolveSalesPayerShares } from "./salesSplitBill";

type BuilderCtx = {
  financeHints: SalesFinanceHint[];
  paymentTerms?: SalesPaymentTermsInput;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatDateLabel(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatMethodDateTime(method: string, iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return method;
  const date = formatDateLabel(d.toISOString());
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s/g, "")
    .toLowerCase();
  return `${method}, ${date} ${time}`;
}

function formatDueDateLabel(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function paymentMethodLabel(
  method?: string | null,
): string {
  if (method === "offline" || method === "offlineDirect") return "Offline Direct";
  if (method === "onlineNonDirect") return "Online Non-Direct";
  if (method === "offlineNonDirect") return "Offline Non-Direct";
  return "Online Direct";
}

function isInvoicePaymentMethod(method?: string | null): boolean {
  return method === "onlineNonDirect" || method === "offlineNonDirect";
}

function isOnlineDirectPayment(method?: string | null): boolean {
  return !method || method === "online" || method === "onlineDirect";
}

function isOnlineBookingType(booking?: CalendarBooking, event?: CalendarEvent): boolean {
  const type = String(booking?.booking_type ?? event?.bookingType ?? "").toLowerCase();
  return type === "online" || type === "request";
}

function toIsoDateOnly(value?: string | null): string | null {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysToIsoDate(iso: string, days: number): string {
  const base = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(base.getTime())) return iso.slice(0, 10);
  base.setDate(base.getDate() + days);
  return toIsoDateOnly(base.toISOString()) ?? iso.slice(0, 10);
}

function durationToDays(value?: string, unit?: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 14;
  const u = String(unit ?? "").trim().toLowerCase();
  if (u.startsWith("day")) return Math.round(n);
  if (u.startsWith("week")) return Math.round(n * 7);
  if (u.startsWith("month")) return Math.round(n * 30);
  return Math.round(n);
}

function deriveDueDate(occurredAt: string, terms?: SalesPaymentTermsInput): string {
  const start = toIsoDateOnly(occurredAt) ?? new Date().toISOString().slice(0, 10);
  return addDaysToIsoDate(start, durationToDays(terms?.originalDueValue, terms?.originalDueUnit));
}

function isDueDatePast(dueDate?: string | null): boolean {
  const iso = toIsoDateOnly(dueDate);
  if (!iso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${iso}T00:00:00`);
  return !Number.isNaN(due.getTime()) && due < today;
}

function isAutomaticTrigger(trigger?: string | null): boolean {
  const t = String(trigger ?? "").trim().toLowerCase();
  return t === "automatic" || t === "auto";
}

function resolvePenaltyPrompt(
  state: SalesPaymentState | undefined,
  terms: SalesPaymentTermsInput | undefined,
  alreadyReissued: boolean,
): SalesPenaltyPrompt {
  if (state !== "overdue_invoice") return "none";
  const trigger = alreadyReissued ? terms?.secondReissueTrigger : terms?.firstReissueTrigger;
  return isAutomaticTrigger(trigger) ? "automatic" : "manual";
}

function matchFinanceHint(
  card: { id: string; bookingId: string; bookingCode: string; kind: SalesOverviewCardData["kind"]; payerKey?: string },
  hints: SalesFinanceHint[],
): SalesFinanceHint | undefined {
  const matches = hints.filter((hint) => {
    const bookingMatch =
      (hint.bookingId && String(hint.bookingId) === String(card.bookingId)) ||
      (hint.bookingCode && String(hint.bookingCode) === String(card.bookingCode)) ||
      (hint.bookingId && String(hint.bookingId) === String(card.bookingCode));
    if (!bookingMatch) return false;
    const phase = String(hint.phase ?? "").toLowerCase();
    const status = String(hint.status ?? "").toLowerCase();
    if (status === "voided" || status === "void" || status === "refunded") return false;
    if (card.kind === "prepayment") return phase === "prepay" || !phase;
    if (card.kind === "addon") {
      const addonId = card.id.replace(/^addon-/, "");
      return phase === "addon" && (!hint.addonId || card.id.includes(hint.addonId) || hint.addonId === addonId);
    }
    if (phase === "prepay" || phase === "addon") return false;
    if (hint.payerKey && card.payerKey && hint.payerKey !== card.payerKey) return false;
    return true;
  });
  const rank = (status: string) => {
    const s = status.toLowerCase();
    if (s === "refunded") return 0;
    if (s === "voided" || s === "void") return 1;
    if (s === "failed") return 2;
    if (s === "paid" || s === "prepaid") return 3;
    return 4;
  };
  return [...matches].sort((a, b) => rank(a.status) - rank(b.status))[0];
}

function applyVisualState<T extends {
  paymentState?: SalesPaymentState;
  statusBadge?: string;
  methodDateLine?: string;
  paymentMethodLabel?: string;
  dueDate?: string | null;
  paidAt?: string | null;
  overdueKind?: SalesOverviewCardData["overdueKind"];
  penaltyPrompt?: SalesPenaltyPrompt;
  limitedMenu?: boolean;
}>(
  next: T,
  state: SalesPaymentState,
  extras: { method?: string | null; dueDate?: string | null; paidAt?: string | null; occurredAt?: string },
): T {
  next.paymentState = state;
  next.statusBadge = salesPaymentBadge(state);
  const methodLabel = next.paymentMethodLabel || paymentMethodLabel(extras.method);
  if (state === "prepaid" || state === "paid") {
    next.methodDateLine = formatMethodDateTime(methodLabel, extras.paidAt || extras.occurredAt);
    next.dueDate = null;
    next.overdueKind = undefined;
    next.limitedMenu = false;
  } else if (
    state === "payment_due" ||
    state === "overdue" ||
    state === "overdue_invoice"
  ) {
    const due = extras.dueDate;
    next.dueDate = due ?? next.dueDate;
    next.methodDateLine = due
      ? `${methodLabel} (Due date ${formatDueDateLabel(due)})`
      : methodLabel;
    next.overdueKind = state === "overdue" ? "prepayment" : state === "overdue_invoice" ? "invoice" : undefined;
    next.limitedMenu = state === "overdue_invoice";
  } else {
    next.methodDateLine = methodLabel;
    if (state !== "unpaid") next.dueDate = extras.dueDate ?? next.dueDate;
  }
  return next;
}

function discountLine(discount: ManualEntryDiscount | null | undefined, subtotal: number): SalesLineItem | null {
  if (!discount || discount.amount <= 0) return null;
  const amount = calculateManualEntryDiscountAmount(subtotal, discount);
  if (amount <= 0) return null;
  const label =
    discount.type === "percentage" ? `Discount (${discount.amount}%)` : "Discount";
  return { id: "discount", label, amount: -roundMoney(amount) };
}

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
  next.methodDateLine = `${methodLabel} (Due date ${formatDueDateLabel(meta.dueDate)})`;
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

function buildAddonCard(record: SalesAddonRecord, ctx: BuilderCtx): SalesOverviewCardData {
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

function buildCardsForEvent(input: {
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

export type BuildSalesOverviewInput = {
  bookings: CalendarBooking[];
  currentEvent?: CalendarEvent | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientKind?: SalesClientKind;
  fallbackResourceId?: string;
  financeHints?: SalesFinanceHint[];
  paymentTerms?: SalesPaymentTermsInput;
};

export function buildSalesOverviewCards(input: BuildSalesOverviewInput): SalesOverviewCardData[] {
  const {
    bookings,
    currentEvent = null,
    clientName = "",
    clientEmail = "",
    clientPhone = "",
    clientKind,
    fallbackResourceId = "unassigned",
    financeHints = [],
    paymentTerms,
  } = input;
  const ctx: BuilderCtx = { financeHints, paymentTerms };

  const cards: SalesOverviewCardData[] = [];
  const seenBookingIds = new Set<string>();
  const currentBookingId = currentEvent ? parseApiCalendarEventId(currentEvent.id)?.id ?? null : null;

  if (currentEvent) {
    const matchingBooking =
      bookings.find((booking) => {
        if (currentBookingId && String(booking.id) === String(currentBookingId)) return true;
        if (currentEvent.bookingCode && booking.unique_code === currentEvent.bookingCode) return true;
        return false;
      }) ?? undefined;

    cards.push(
      ...buildCardsForEvent({
        event: currentEvent,
        booking: matchingBooking,
        clientName,
        clientEmail,
        clientPhone,
        clientKind,
        isCurrent: true,
        ctx,
      }),
    );
    if (currentBookingId) seenBookingIds.add(String(currentBookingId));
    if (matchingBooking) seenBookingIds.add(String(matchingBooking.id));
  }

  const sorted = [...bookings].sort((a, b) => {
    const at = new Date(a.created_at || a.start_time || 0).getTime();
    const bt = new Date(b.created_at || b.start_time || 0).getTime();
    return bt - at;
  });

  for (const booking of sorted) {
    const id = String(booking.id);
    if (seenBookingIds.has(id)) continue;
    seenBookingIds.add(id);

    const status = String(booking.status ?? "").toLowerCase();
    const prepay = String(booking.prepayment_status ?? "").toLowerCase();
    if (status === "invalid" || status === "cancelled" || status === "canceled") continue;
    if (
      status !== "completed" &&
      status !== "confirmed" &&
      status !== "in_progress" &&
      status !== "requested" &&
      prepay !== "paid" &&
      prepay !== "required" &&
      prepay !== "pending" &&
      prepay !== "failed"
    ) {
      continue;
    }

    const event = mapCalendarBookingToEvent(booking, fallbackResourceId);
    cards.push(
      ...buildCardsForEvent({
        event,
        booking,
        clientName: clientName || booking.customer_name || booking.client_name || "Client",
        clientEmail: clientEmail || booking.customer_email || "",
        clientPhone: clientPhone || booking.contact_number || "",
        clientKind,
        isCurrent: false,
        ctx,
      }),
    );
  }

  const addonRecords = listSalesAddonsForBookings([...seenBookingIds]);
  for (const record of addonRecords) {
    cards.push(buildAddonCard(record, ctx));
  }

  return cards
    .filter((card) => !card.canceled)
    .sort((a, b) => {
      const at = new Date(a.occurredAt).getTime();
      const bt = new Date(b.occurredAt).getTime();
      if (bt !== at) return bt - at;
      const kindRank = (card: SalesOverviewCardData) => {
        if (card.kind === "prepayment") return 0;
        if (card.kind === "after_treatment") return 1;
        if (card.kind === "reissued_invoice") return 2;
        return 3;
      };
      return kindRank(a) - kindRank(b);
    });
}
