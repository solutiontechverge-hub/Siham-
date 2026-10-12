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
  buildCardsForEvent,
  findProtectiveFeeFinanceHint,
  mergeAddonRecordsIntoCards,
  protectiveFeeFlagsFromBooking,
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
  /** Business setup late-cancel % — heal Fee Summary for old cancels missing the stamp. */
  lateCancellationFeePercentDefault?: string | number | null;
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
    lateCancellationFeePercentDefault,
  } = input;
  const ctx: BuilderCtx = {
    financeHints,
    paymentTerms,
    lateCancellationFeePercentDefault,
  };

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
    const prepay = String(booking.prepayment_status ?? "").toLowerCase();
    const prepaidCollected = prepay === "paid" || prepay === "confirmed";
    const notesFee = protectiveFeeFlagsFromBooking(booking);
    const bookingKey = String(booking.id);
    const bookingCode = String(booking.unique_code ?? booking.id);
    const hasFinanceFee = Boolean(
      findProtectiveFeeFinanceHint(financeHints, bookingKey, bookingCode),
    );
    const policyLateCancelPercent =
      Number(
        event.details?.lateCancellationFeePercent ??
          notesFee.lateCancellationFeePercent ??
          lateCancellationFeePercentDefault,
      ) || 0;
    // Match buildCardsForEvent heal: cancelled + policy % + prepaid kept → Fee Summary.
    const healedLateCancel =
      isCancelledStatus &&
      policyLateCancelPercent > 0 &&
      (prepaidCollected ||
        notesFee.exceededCancellationWindow === true ||
        Boolean(notesFee.cancellationFeeAt) ||
        hasFinanceFee);
    const protectiveFeeActive =
      (isCancelledStatus &&
        (Boolean(event.details?.showLateCancellation) ||
          notesFee.showLateCancellation ||
          hasFinanceFee ||
          healedLateCancel)) ||
      (isNoShowStatus &&
        (Boolean(event.details?.showNoShowFee) ||
          notesFee.showNoShowFee ||
          hasFinanceFee));

    // Cancelled with neither fee nor prepaid → blank Sales (plain free cancel).
    if (isCancelledStatus && !protectiveFeeActive && !prepaidCollected) continue;

    if (
      !protectiveFeeActive &&
      !prepaidCollected &&
      status !== "completed" &&
      status !== "confirmed" &&
      status !== "in_progress" &&
      status !== "requested" &&
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
  const withAddons = mergeAddonRecordsIntoCards(cards, addonRecords, ctx);

  return withAddons
    // Cancel Sales keeps voided cards visible (grey Voided badge); supersede-only canceled hide.
    .filter((card) => !card.canceled || card.voided)
    .sort((a, b) => {
      const kindRank = (card: SalesOverviewCardData) => {
        // Fee Summary above prepaid so late-cancel charge is not below the fold.
        if (
          card.title === "Fee Summary" ||
          card.title === "No-Show Fee Invoice"
        ) {
          return -1;
        }
        if (card.kind === "prepayment") return 0;
        if (card.kind === "after_treatment") return 1;
        if (card.kind === "addon") return 2;
        if (card.kind === "reissued_invoice") return 3;
        return 4;
      };
      const rankDiff = kindRank(a) - kindRank(b);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    });
}
