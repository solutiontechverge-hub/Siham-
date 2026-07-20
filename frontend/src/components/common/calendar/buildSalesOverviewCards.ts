import type { CalendarBooking } from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  calculateManualEntryDiscountAmount,
  lineTotal,
  type ManualEntryDiscount,
} from "../../sections/finance/manualEntry.data";
import { mapCalendarBookingToEvent } from "./calendar-overview.mappers";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import { getSalesCardMeta, listSalesAddonsForBookings } from "./salesOverview.storage";
import type { SalesAddonRecord, SalesLineItem, SalesOverviewCardData } from "./salesOverview.types";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatDateLabel(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTimeLabel(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return formatDateLabel();
  const date = formatDateLabel(d.toISOString());
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s/g, "")
    .toUpperCase();
  return `${date} - ${time}`;
}

function paymentMethodLabel(method?: "online" | "offline" | "onlineDirect" | "offlineDirect" | null): string {
  if (method === "offline" || method === "offlineDirect") return "Offline Direct";
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

  for (const service of details?.services ?? []) {
    lines.push({ id: service.id, label: service.name, amount: roundMoney(service.price) });
    subtotal += service.price;
  }
  for (const product of details?.products ?? []) {
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

function applyMeta(card: SalesOverviewCardData): SalesOverviewCardData {
  const meta = getSalesCardMeta(card.id);
  if (!meta) return card;
  return {
    ...card,
    note: meta.note ?? card.note,
    voided: Boolean(meta.voided),
    refunded: Boolean(meta.refunded),
  };
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
    highlightLabel: `Paid · ${paymentMethodLabel(record.paymentMethod)}`,
    highlightAmount: roundMoney(record.totalPrice),
    metaLines: [`Paid: ${formatDateTimeLabel(record.createdAt)}`],
    showAddOns: false,
    voided: record.voided,
    refunded: record.refunded,
    note: record.note,
    paymentMethodLabel: paymentMethodLabel(record.paymentMethod),
    documentAmount: roundMoney(record.totalPrice),
    occurredAt: record.createdAt,
  });
}

function buildCardsForEvent(input: {
  event: CalendarEvent;
  booking?: CalendarBooking;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  isCurrent?: boolean;
}): SalesOverviewCardData[] {
  const { event, booking, clientName, clientEmail, clientPhone, isCurrent } = input;
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
    Boolean(event.details?.showPrepayment) || prepayStatus === "paid" || prepayStatus === "required";
  const prepaymentPercent = Number(event.details?.prepaymentPercent) || 0;
  const prepaidAmount =
    showPrepayment && prepaymentPercent > 0
      ? roundMoney((total * prepaymentPercent) / 100)
      : showPrepayment && prepayStatus === "paid"
        ? roundMoney(total * 0.25)
        : 0;

  const status = String(booking?.status ?? event.status ?? "").toLowerCase();
  const isCompleted = status === "completed";
  const isPaid = prepayStatus === "paid" || isCompleted;
  const method = paymentMethodLabel(event.details?.paymentMethod);
  const occurredAt =
    booking?.created_at || booking?.start_time || `${event.date}T${event.start}:00`;
  const name = clientName || event.showClientName || booking?.customer_name || booking?.client_name || "Client";
  const email = clientEmail || event.details?.clientEmail || booking?.customer_email || undefined;
  const phone =
    clientPhone ||
    [event.details?.phoneCode, event.details?.phoneNumber].filter(Boolean).join(" ").trim() ||
    booking?.contact_number ||
    undefined;

  const cards: SalesOverviewCardData[] = [];

  if (showPrepayment && prepaidAmount > 0) {
    const percentLabel = prepaymentPercent > 0 ? ` (${prepaymentPercent}%)` : "";
    cards.push(
      applyMeta({
        id: `${bookingId}-prepayment`,
        bookingId,
        bookingCode,
        kind: "prepayment",
        title: "Prepayment Summary",
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        statusBadge: isCurrent || isPaid ? "CONFIRM" : undefined,
        lines: effectiveLines,
        total,
        highlightLabel: `Prepaid${percentLabel} on ${formatDateLabel(occurredAt)}`,
        highlightAmount: prepaidAmount,
        metaLines: [`Status: ${isPaid ? "PAID" : "PENDING"}`, method],
        paymentMethodLabel: method,
        documentAmount: prepaidAmount,
        occurredAt,
      }),
    );
  }

  if (isCompleted || isPaid || isCurrent) {
    const remaining = roundMoney(Math.max(0, total - prepaidAmount));
    const secondaryRows: SalesLineItem[] =
      prepaidAmount > 0 ? [{ id: "prepaid-deduction", label: "Prepaid", amount: -prepaidAmount }] : [];

    cards.push(
      applyMeta({
        id: `${bookingId}-after-treatment`,
        bookingId,
        bookingCode,
        kind: "after_treatment",
        title: "After treatment Summary",
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        statusBadge: isCurrent || isCompleted ? "CONFIRM" : undefined,
        lines: effectiveLines,
        total,
        secondaryRows,
        highlightLabel: "Payment",
        highlightAmount: remaining > 0 ? remaining : total,
        metaLines: [
          `Paid: ${formatDateTimeLabel(occurredAt)}`,
          method === "Offline Direct" ? "FPP: I (Cash)" : `Method: ${method}`,
        ],
        showAddOns: true,
        paymentMethodLabel: method,
        documentAmount: remaining > 0 ? remaining : total,
        occurredAt,
      }),
    );
  }

  return cards;
}

export type BuildSalesOverviewInput = {
  bookings: CalendarBooking[];
  currentEvent?: CalendarEvent | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  fallbackResourceId?: string;
};

export function buildSalesOverviewCards(input: BuildSalesOverviewInput): SalesOverviewCardData[] {
  const {
    bookings,
    currentEvent = null,
    clientName = "",
    clientEmail = "",
    clientPhone = "",
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

    const currentCards = buildCardsForEvent({
      event: currentEvent,
      booking: matchingBooking,
      clientName,
      clientEmail,
      clientPhone,
      isCurrent: true,
    });
    cards.push(...currentCards);
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
    if (status !== "completed" && prepay !== "paid" && prepay !== "required") continue;

    const event = mapCalendarBookingToEvent(booking, fallbackResourceId);
    cards.push(
      ...buildCardsForEvent({
        event,
        booking,
        clientName: clientName || booking.customer_name || booking.client_name || "Client",
        clientEmail: clientEmail || booking.customer_email || "",
        clientPhone: clientPhone || booking.contact_number || "",
        isCurrent: false,
      }),
    );
  }

  const addonRecords = listSalesAddonsForBookings([...seenBookingIds]);
  for (const record of addonRecords) {
    cards.push(buildAddonCard(record));
  }

  return cards.sort((a, b) => {
    const at = new Date(a.occurredAt).getTime();
    const bt = new Date(b.occurredAt).getTime();
    return bt - at;
  });
}
