import type { CalendarBooking } from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { mapCalendarBookingToEvent } from "./calendar-overview.mappers";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import { listSalesAddonsForBookings } from "./salesOverview.storage";
import type {
  SalesClientKind,
  SalesFinanceHint,
  SalesOverviewCardData,
  SalesPaymentTermsInput,
} from "./salesOverview.types";
import {
  type BuilderCtx,
  buildAddonCard,
  buildCardsForEvent,
} from "./buildSalesOverviewCards.helpers";

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
    if (status === "invalid") continue;

    const event = mapCalendarBookingToEvent(booking, fallbackResourceId);
    const isCancelledStatus = status === "cancelled" || status === "canceled";
    const isNoShowStatus = status === "no_show" || status === "no show";
    const protectiveFeeActive =
      (isCancelledStatus && Boolean(event.details?.showLateCancellation)) ||
      (isNoShowStatus && Boolean(event.details?.showNoShowFee));

    if (isCancelledStatus && !protectiveFeeActive) continue;

    const prepay = String(booking.prepayment_status ?? "").toLowerCase();
    if (
      !protectiveFeeActive &&
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
