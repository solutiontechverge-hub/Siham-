import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { parseApiCalendarEventId } from "../bookingEventDetails";
import type { CalendarBooking } from "../../../../store/services/businessApi";

export function resolveClientActivityIdentity(input: {
  selectedClientEmail?: string | null;
  selectedClientName?: string | null;
  contextEmail?: string | null;
  contextName?: string | null;
  guestFirstName: string;
  guestLastName: string;
  nonMollureFirstName: string;
  nonMollureLastName: string;
}): { email: string; name: string } {
  const email =
    input.selectedClientEmail?.trim() || input.contextEmail?.trim() || "";
  const name =
    input.selectedClientName?.trim() ||
    input.contextName?.trim() ||
    `${input.guestFirstName} ${input.guestLastName}`.trim() ||
    `${input.nonMollureFirstName} ${input.nonMollureLastName}`.trim() ||
    "";
  return { email, name };
}

export function synthesizeCalendarBookingFromEvent(
  ev: CalendarEvent,
  currentId: string | null,
  currentCode: string | null,
): CalendarBooking {
  let totalPrice: number | null = null;
  const details = ev.details;
  if (details) {
    let total = 0;
    for (const service of details.services ?? []) {
      total += Number(service.price) || 0;
    }
    for (const product of details.products ?? []) {
      total += Number(product.price) || 0;
    }
    for (const guest of details.guests ?? []) {
      for (const service of guest.services ?? []) {
        total += Number(service.price) || 0;
      }
      for (const product of guest.products ?? []) {
        total += Number(product.price) || 0;
      }
    }
    if (total > 0) totalPrice = total;
  }
  const bookingType = ev.bookingType?.toLowerCase();
  return {
    id: String(currentId || currentCode || ev.id),
    unique_code: currentCode,
    status: String(ev.status || "confirmed")
      .toLowerCase()
      .replace(/\s+/g, "_"),
    prepayment_status:
      ev.details?.prepaymentStatus === "confirmed"
        ? "paid"
        : ev.details?.prepaymentStatus || null,
    total_price: totalPrice,
    booking_type:
      bookingType === "online" ||
      bookingType === "offline" ||
      bookingType === "project" ||
      bookingType === "request"
        ? bookingType
        : null,
    customer_name: ev.showClientName || null,
    customer_email: ev.details?.clientEmail || null,
    client_name: ev.showClientName || null,
    service_title: ev.title || null,
    notes: ev.notes || null,
    created_at: ev.start || null,
    updated_at: ev.start || null,
    booking_date: ev.date || ev.start?.slice(0, 10) || "",
    start_time: ev.start || null,
    end_time: ev.end || null,
    business_setup_id: "",
    customer_id: ev.details?.customerId || "",
    service_id: null,
    team_member_id: ev.resourceId || null,
    location_type: ev.location === "DL" ? "desired" : "fixed",
  };
}

export function matchClientBookingsForActivity(
  all: CalendarBooking[],
  drawerSalesActivityContext: CalendarEvent | null,
): CalendarBooking[] {
  const currentId = drawerSalesActivityContext
    ? (parseApiCalendarEventId(drawerSalesActivityContext.id)?.id ?? null)
    : null;
  const currentCode = drawerSalesActivityContext?.bookingCode ?? null;
  const matched = all.filter((booking) => {
    if (currentId && String(booking.id) === String(currentId)) return true;
    if (
      currentCode &&
      booking.unique_code &&
      booking.unique_code === currentCode
    )
      return true;
    return false;
  });

  // Offline calendar entries often have no bookings row — synthesize one for fallback.
  if (
    matched.length === 0 &&
    drawerSalesActivityContext &&
    (currentId || currentCode)
  ) {
    return [
      synthesizeCalendarBookingFromEvent(
        drawerSalesActivityContext,
        currentId,
        currentCode,
      ),
    ];
  }

  return matched;
}
