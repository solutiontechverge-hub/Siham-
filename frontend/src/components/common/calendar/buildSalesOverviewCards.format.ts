import type { CalendarBooking } from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  calculateManualEntryDiscountAmount,
  type ManualEntryDiscount,
} from "../../sections/finance/manualEntry.data";
import type {
  SalesFinanceHint,
  SalesLineItem,
  SalesOverviewCardData,
  SalesPaymentState,
  SalesPaymentTermsInput,
  SalesPenaltyPrompt,
  SalesSubCardData,
} from "./salesOverview.types";
import { salesPaymentBadge } from "./salesOverview.types";
import { formatFinanceDueDate } from "../booking-finance/formatBookingFinance";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";
import { isProtectiveFeeEntryLabel } from "../finance-documents/protectiveFeeInvoice";
export function formatDateLabel(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function formatDateTimeLabel(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const date = formatDateLabel(d.toISOString());
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s/g, "")
    .toLowerCase();
  return `${date} ${time}`;
}

export function formatMethodDateTime(method: string, iso?: string | null): string {
  const stamped = formatDateTimeLabel(iso);
  if (!stamped) return method;
  return `${method}, ${stamped}`;
}

export function paymentMethodLabel(
  method?: string | null,
): string {
  if (method === "offline" || method === "offlineDirect") return "Offline Direct";
  if (method === "onlineNonDirect") return "Online Non-Direct";
  if (method === "offlineNonDirect") return "Offline Non-Direct";
  return "Online Direct";
}

export function isInvoicePaymentMethod(method?: string | null): boolean {
  return method === "onlineNonDirect" || method === "offlineNonDirect";
}

export function isOnlineDirectPayment(method?: string | null): boolean {
  return !method || method === "online" || method === "onlineDirect";
}

export function isOnlineBookingType(booking?: CalendarBooking, event?: CalendarEvent): boolean {
  const type = String(booking?.booking_type ?? event?.bookingType ?? "").toLowerCase();
  return type === "online" || type === "request";
}

export function toIsoDateOnly(value?: string | null): string | null {
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

export function addDaysToIsoDate(iso: string, days: number): string {
  const base = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(base.getTime())) return iso.slice(0, 10);
  base.setDate(base.getDate() + days);
  return toIsoDateOnly(base.toISOString()) ?? iso.slice(0, 10);
}

export function durationToDays(value?: string, unit?: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 14;
  const u = String(unit ?? "").trim().toLowerCase();
  if (u.startsWith("day")) return Math.round(n);
  if (u.startsWith("week")) return Math.round(n * 7);
  if (u.startsWith("month")) return Math.round(n * 30);
  return Math.round(n);
}

export function deriveDueDate(occurredAt: string, terms?: SalesPaymentTermsInput): string {
  const start = toIsoDateOnly(occurredAt) ?? new Date().toISOString().slice(0, 10);
  return addDaysToIsoDate(start, durationToDays(terms?.originalDueValue, terms?.originalDueUnit));
}

export function isDueDatePast(dueDate?: string | null): boolean {
  const iso = toIsoDateOnly(dueDate);
  if (!iso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${iso}T00:00:00`);
  return !Number.isNaN(due.getTime()) && due < today;
}

export function isAutomaticTrigger(trigger?: string | null): boolean {
  const t = String(trigger ?? "").trim().toLowerCase();
  return t === "automatic" || t === "auto";
}

export function resolvePenaltyPrompt(
  state: SalesPaymentState | undefined,
  terms: SalesPaymentTermsInput | undefined,
  reissueLevel: number | boolean = 0,
): SalesPenaltyPrompt {
  if (state !== "overdue_invoice") return "none";
  // boolean kept for older callers (alreadyReissued → level 0|1)
  const level =
    typeof reissueLevel === "boolean"
      ? reissueLevel
        ? 1
        : 0
      : Number(reissueLevel) || 0;
  // Final reissue already sent → no Manual/Automatic banner (backend may auto-close).
  if (level >= 2) return "none";
  const trigger = level >= 1 ? terms?.secondReissueTrigger : terms?.firstReissueTrigger;
  return isAutomaticTrigger(trigger) ? "automatic" : "manual";
}

export function matchFinanceHint(
  card: {
    id: string;
    bookingId: string;
    bookingCode: string;
    kind: SalesOverviewCardData["kind"];
    payerKey?: string;
    financeTransactionId?: string;
  },
  hints: SalesFinanceHint[],
): SalesFinanceHint | undefined {
  if (card.financeTransactionId) {
    const byFk = hints.find(
      (hint) =>
        hint.transactionId &&
        String(hint.transactionId) === String(card.financeTransactionId),
    );
    if (byFk) return byFk;
  }
  const isProtectiveFeeCard = /protective-fee|no-show|late-cancellation|late-reschedule/.test(
    card.id,
  );
  const matches = hints.filter((hint) => {
    const bookingMatch =
      (hint.bookingId && String(hint.bookingId) === String(card.bookingId)) ||
      (hint.bookingCode && String(hint.bookingCode) === String(card.bookingCode)) ||
      (hint.bookingId && String(hint.bookingId) === String(card.bookingCode)) ||
      (hint.bookingCode && String(hint.bookingCode) === String(card.bookingId));
    if (!bookingMatch) return false;
    const phase = String(hint.phase ?? "").toLowerCase();
    // Prepay cards must not bind LCF/LRF/NS rows (often phase-less) — those are Fee Summary.
    if (card.kind === "prepayment") {
      if (isProtectiveFeeEntryLabel(hint.entryLabel)) return false;
      return phase === "prepay" || !phase;
    }
    if (card.kind === "addon") {
      const addonId = card.id.replace(/^addon-/, "");
      return phase === "addon" && (!hint.addonId || card.id.includes(hint.addonId) || hint.addonId === addonId);
    }
    if (phase === "prepay" || phase === "addon") return false;
    // After-treatment / service cards must not bind LCF/LRF/NS (Fee Summary owns those).
    if (!isProtectiveFeeCard && isProtectiveFeeEntryLabel(hint.entryLabel)) {
      return false;
    }
    if (hint.payerKey && card.payerKey && hint.payerKey !== card.payerKey) return false;
    // Shell parents (no payerKey) must not bind payer-scoped finance rows.
    if (hint.payerKey && !card.payerKey) return false;
    return true;
  });
  // Prefer live rows; fall back to voided/refunded when that is the only match.
  const isTerminal = (hint: SalesFinanceHint) => {
    const s = String(hint.status ?? "").toLowerCase();
    return s === "voided" || s === "void" || s === "refunded";
  };
  const live = matches.filter((hint) => !isTerminal(hint));
  const pool = live.length ? live : matches;
  const feeLabel = (label?: string | null) => {
    const value = String(label ?? "").trim();
    return (
      value === "Late Cancellation Booking Fee" ||
      value === "Late Rescheduling Fee" ||
      value.toLowerCase() === "no-show fee"
    );
  };
  const rank = (hint: SalesFinanceHint) => {
    const s = String(hint.status ?? "").toLowerCase();
    // Fee Summary cards must bind to LCF/LRF/NS rows, not a sibling full service sale.
    const feeBoost =
      isProtectiveFeeCard && feeLabel(hint.entryLabel) ? 10 : 0;
    // Higher = preferred among live rows (paid before open).
    if (s === "paid" || s === "prepaid") return 4 + feeBoost;
    if (s === "failed") return 3 + feeBoost;
    if (s === "refunded") return 2 + feeBoost;
    if (s === "voided" || s === "void") return 1 + feeBoost;
    return 5 + feeBoost;
  };
  return [...pool].sort((a, b) => rank(b) - rank(a))[0];
}

export function applyVisualState<T extends {
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
  extras: {
    method?: string | null;
    dueDate?: string | null;
    paidAt?: string | null;
    occurredAt?: string;
    kind?: SalesOverviewCardData["kind"];
  },
): T {
  next.paymentState = state;
  next.statusBadge = salesPaymentBadge(state, extras.kind);
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
    // Prepayment Due card shows source only (no due-date suffix) — matches Sales mock.
    next.methodDateLine =
      extras.kind === "prepayment" && state === "payment_due"
        ? methodLabel
        : due
          ? `${methodLabel} (Due date ${formatFinanceDueDate(due)})`
          : methodLabel;
    next.overdueKind = state === "overdue" ? "prepayment" : state === "overdue_invoice" ? "invoice" : undefined;
    next.limitedMenu = state === "overdue_invoice";
  } else if (state === "voided" || state === "refunded") {
    next.methodDateLine = formatMethodDateTime(
      methodLabel,
      extras.paidAt || extras.occurredAt,
    );
    next.dueDate = null;
  } else {
    next.methodDateLine = methodLabel;
    if (state !== "unpaid") next.dueDate = extras.dueDate ?? next.dueDate;
  }
  return next;
}

export function discountLine(discount: ManualEntryDiscount | null | undefined, subtotal: number): SalesLineItem | null {
  if (!discount || discount.amount <= 0) return null;
  const amount = calculateManualEntryDiscountAmount(subtotal, discount);
  if (amount <= 0) return null;
  const label =
    discount.type === "percentage" ? `Discount (${discount.amount}%)` : "Discount";
  return { id: "discount", label, amount: -roundMoney(amount) };
}


