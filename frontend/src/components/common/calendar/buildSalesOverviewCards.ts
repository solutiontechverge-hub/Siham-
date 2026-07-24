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
import { getSalesCardMeta, listSalesAddonsForBookings } from "./salesOverview.storage";
import type {
  SalesAddonRecord,
  SalesClientKind,
  SalesLineItem,
  SalesOverviewCardData,
  SalesPaymentState,
  SalesSubCardData,
} from "./salesOverview.types";
import { buildSplitPaymentAmounts, resolveSalesPayerShares } from "./salesSplitBill";

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
}>(
  next: T,
  meta: {
    dueDate?: string | null;
    paymentMethod?: SalesOverviewCardData["paymentMethod"];
    canceled?: boolean;
    penaltyAmount?: number;
  },
): T {
  if (!meta.dueDate) return next;
  if (meta.paymentMethod !== "onlineNonDirect" && meta.paymentMethod !== "offlineNonDirect") {
    return next;
  }

  const methodLabel = next.paymentMethodLabel || paymentMethodLabel(meta.paymentMethod);
  next.methodDateLine = `${methodLabel} (Due date ${formatDueDateLabel(meta.dueDate)})`;
  next.dueDate = meta.dueDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${meta.dueDate}T00:00:00`);
  const isOverdue = !Number.isNaN(due.getTime()) && due < today && !meta.canceled;
  next.paymentState = isOverdue ? "overdue" : "payment_due";
  next.statusBadge = "Payment Due";
  next.highlightLabel = "Payment";

  if (typeof next.title === "string") {
    next.title = "Reissued Invoice Summary";
  }
  if (next.kind) {
    next.kind = "reissued_invoice";
  }
  next.limitedMenu = true;

  if (meta.penaltyAmount && meta.penaltyAmount > 0) {
    next.highlightAmount = roundMoney(next.highlightAmount + meta.penaltyAmount);
    if (typeof next.documentAmount === "number") {
      next.documentAmount = next.highlightAmount;
    }
    next.total = roundMoney(next.total + meta.penaltyAmount);
    next.penaltyAmount = meta.penaltyAmount;
  }

  return next;
}

function applySubMeta(sub: SalesSubCardData): SalesSubCardData {
  const meta = getSalesCardMeta(sub.id);
  if (!meta) return sub;

  const next: SalesSubCardData = {
    ...sub,
    dueDate: meta.dueDate ?? sub.dueDate,
  };

  if (meta.editedLines?.length) {
    next.lines = meta.editedLines.map((line) => ({
      id: line.id,
      label: line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
      amount: roundMoney(lineTotal(line)),
    }));
    if (meta.discountAmount && meta.discountAmount > 0) {
      next.lines.push({
        id: `${sub.id}-discount`,
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
    }
  }

  if (meta.paymentMethod) {
    next.methodDateLine =
      meta.dueDate && (meta.paymentMethod === "onlineNonDirect" || meta.paymentMethod === "offlineNonDirect")
        ? `${paymentMethodLabel(meta.paymentMethod)} (Due date ${formatDueDateLabel(meta.dueDate)})`
        : paymentMethodLabel(meta.paymentMethod);
  }

  applyDueDateMeta(next, meta);

  if (meta.canceled) {
    next.statusBadge = "Canceled";
  }

  return next;
}

function applyMeta(card: SalesOverviewCardData): SalesOverviewCardData {
  const meta = getSalesCardMeta(card.id);
  let next: SalesOverviewCardData = meta
    ? {
        ...card,
        note: meta.note ?? card.note,
        voided: Boolean(meta.voided),
        refunded: Boolean(meta.refunded),
        canceled: Boolean(meta.canceled),
        dueDate: meta.dueDate ?? card.dueDate,
        penaltyAmount: meta.penaltyAmount ?? card.penaltyAmount,
        paymentMethod: meta.paymentMethod ?? card.paymentMethod,
      }
    : { ...card };

  if (meta) {
    if (meta.editedLines?.length) {
      next.lines = meta.editedLines.map((line) => ({
        id: line.id,
        label: line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
        amount: roundMoney(lineTotal(line)),
      }));
      if (meta.discountAmount && meta.discountAmount > 0) {
        next.lines.push({
          id: `${card.id}-discount`,
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
        next.documentAmount = roundMoney(meta.totalPrice);
      }
    }

    if (meta.paymentMethod) {
      next.paymentMethodLabel = paymentMethodLabel(meta.paymentMethod);
    }

    applyDueDateMeta(next, meta);

    if (meta.canceled) {
      next.statusBadge = "Canceled";
      next.canceled = true;
    }
  }

  if (next.subCards?.length) {
    next = { ...next, subCards: next.subCards.map(applySubMeta) };
  }

  return next;
}

function buildAddonCard(record: SalesAddonRecord): SalesOverviewCardData {
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

  return applyMeta({
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
    paymentMethodLabel: paymentMethodLabel(record.paymentMethod),
    documentAmount: roundMoney(record.totalPrice),
    occurredAt: record.createdAt,
  });
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

function buildCardsForEvent(input: {
  event: CalendarEvent;
  booking?: CalendarBooking;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientKind?: SalesClientKind;
  isCurrent?: boolean;
}): SalesOverviewCardData[] {
  const { event, booking, clientName, clientEmail, clientPhone, clientKind } = input;
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
  const status = String(booking?.status ?? event.status ?? "").toLowerCase();
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled" || status === "canceled";
  const isInvalid = status === "invalid" || isBookingRequestRejected(event);
  const isPendingRequest = status === "requested";
  const isAccepted =
    status === "confirmed" || status === "completed" || status === "in_progress" || status === "in progress";

  // Rejected / cancelled requests are never kept in Sales.
  if (isInvalid || isCancelled) return [];

  const method = paymentMethodLabel(event.details?.paymentMethod);
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

  // Incoming / pending request → title "Summary" only (not saved after reject).
  if (isPendingRequest) {
    if (!mainShareBase) return [];
    // Unpaid prepayment → Prepayment Due; paid → Prepaid (never Pending here).
    const requestBadge = isPrepayPaid ? "Prepaid" : "Prepayment Due";
    const requestState: SalesPaymentState = isPrepayPaid ? "prepaid" : "prepayment_due";

    const subCards: SalesSubCardData[] = guestModelSharesBase.map((share) => ({
      id: `${bookingId}-sub-${share.key}`,
      bookingId,
      bookingCode,
      payerRole: share.role,
      payerLabel: share.label,
      payerName: share.displayName,
      lines: share.lines,
      total: share.subtotal,
      highlightLabel: "Total Amount",
      highlightAmount: share.subtotal,
      // Guest/model keep their own status inside their dashed card.
      statusBadge: "Pending",
      paymentState: "pending",
      methodDateLine: method,
      showAddOns: true,
      parentClientName: name,
    }));

    cards.push(
      applyMeta({
        id: `${bookingId}-summary`,
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
        // Main-card badge reflects the main client's prepayment only.
        statusBadge: requestBadge,
        paymentState: requestState,
        // All main-client services
        lines: mainShareBase.lines,
        highlightedLineIds: mainShareBase.lines.map((line) => line.id),
        subCards: subCards.length ? subCards : undefined,
        total,
        totalLabel: "Total",
        highlightLabel: "Payment",
        highlightAmount: mainShareBase.subtotal,
        methodDateLine: method,
        showAddOns: true,
        paymentMethodLabel: method,
        documentAmount: mainShareBase.subtotal,
        occurredAt,
        bookingEndAt: endAt,
      }),
    );
    return cards;
  }

  // Accepted booking: Prepayment Summary while prepay is configured.
  if (isAccepted && showPrepayment && prepaidAmount > 0) {
    const percentLabel = prepaymentPercent > 0 ? `(${prepaymentPercent}%)` : "";
    const paymentState: SalesPaymentState = isPrepayPaid ? "prepaid" : "prepayment_due";
    cards.push(
      applyMeta({
        id: `${bookingId}-prepayment`,
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
        statusBadge: isPrepayPaid ? "Prepaid" : "Prepayment Due",
        paymentState,
        lines: effectiveLines.filter((line) => line.amount >= 0),
        total,
        totalLabel: "Total Amount",
        highlightLabel: `Prepayment${percentLabel ? ` ${percentLabel}` : ""}`,
        highlightAmount: prepaidAmount,
        methodDateLine: isPrepayPaid ? formatMethodDateTime(method, occurredAt) : method,
        paymentMethodLabel: method,
        documentAmount: prepaidAmount,
        occurredAt,
        bookingEndAt: endAt,
      }),
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

    const resolveAfterState = (paidHint: boolean): { badge: string; state: SalesPaymentState } => {
      // Pending only after service time has passed / booking completed (final payment waiting).
      if (paidHint) return { badge: "Paid", state: "paid" };
      return { badge: "Pending", state: "pending" };
    };

    if (mainShare) {
      const mainState = resolveAfterState(false);
      const secondaryRows: SalesLineItem[] =
        isPrepayPaid && prepaidAmount > 0
          ? [{ id: "prepaid-deduction", label: "Prepaid", amount: -prepaidAmount }]
          : [];

      const subCards: SalesSubCardData[] = guestModelShares.map((share) => {
        const subState = resolveAfterState(false);
        return {
          id: `${bookingId}-sub-${share.key}`,
          bookingId,
          bookingCode,
          payerRole: share.role,
          payerLabel: share.label,
          payerName: share.displayName,
          lines: share.lines,
          total: share.subtotal,
          highlightLabel: "Total Amount",
          highlightAmount: share.paymentAmount,
          statusBadge: subState.badge,
          paymentState: subState.state,
          methodDateLine:
            subState.state === "paid" ? formatMethodDateTime(method, occurredAt) : method,
          showAddOns: true,
          parentClientName: name,
        };
      });

      cards.push(
        applyMeta({
          id: `${bookingId}-after-treatment`,
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
          statusBadge: mainState.badge,
          paymentState: mainState.state,
          lines: mainShare.lines,
          highlightedLineIds: mainShare.lines.map((line) => line.id),
          subCards: subCards.length ? subCards : undefined,
          total,
          totalLabel: "Total",
          secondaryRows,
          highlightLabel: "Payment",
          highlightAmount: mainShare.paymentAmount,
          methodDateLine:
            mainState.state === "paid" || mainState.state === "prepaid"
              ? formatMethodDateTime(method, occurredAt)
              : method,
          showAddOns: true,
          paymentMethodLabel: method,
          documentAmount: mainShare.paymentAmount,
          occurredAt,
          bookingEndAt: endAt,
        }),
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
  } = input;

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
      prepay !== "pending"
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
      }),
    );
  }

  const addonRecords = listSalesAddonsForBookings([...seenBookingIds]);
  for (const record of addonRecords) {
    cards.push(buildAddonCard(record));
  }

  return cards
    .filter((card) => !card.canceled && !card.voided)
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
