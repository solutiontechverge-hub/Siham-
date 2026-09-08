/**
 * Run with: npx --yes tsx src/components/common/calendar/calendar-overview.mappers.test.ts
 */
import assert from "node:assert/strict";
import { mapCalendarBookingToEvent } from "./calendar-overview.mappers";
import { resolveKilometerAllowanceAmount } from "./bookingEventDetails";
import type { CalendarBooking } from "../../../store/services/businessApi";

const eurPerKm = "6.5";
const totalKilometer = "20";
const expected = resolveKilometerAllowanceAmount({ eurPerKm, totalKilometer });
assert.equal(expected, 6.5 * 20);

const booking: CalendarBooking = {
  id: "booking-km",
  booking_date: "2026-09-08",
  business_setup_id: "biz-1",
  customer_id: "cust-1",
  service_id: "svc-1",
  team_member_id: "tm-1",
  start_time: "2026-09-08T09:00:00",
  end_time: "2026-09-08T10:00:00",
  location_type: "desired",
  notes: `---mollure-meta---\n${JSON.stringify({
    showKilometerAllowance: true,
    kilometerAllowance: { eurPerKm, totalKilometer },
    services: [
      { id: "svc-1", name: "Cut", price: 40, durationMins: 30, guestId: null },
    ],
  })}`,
  status: "requested",
  total_price: 170,
  unique_code: "ML-KM",
};

const event = mapCalendarBookingToEvent(booking, "tm-1");
assert.equal(event.location, "DL");
assert.equal(event.details?.showKilometerAllowance, true);
assert.equal(event.details?.kilometerAllowance?.eurPerKm, eurPerKm);
assert.equal(event.details?.kilometerAllowance?.totalKilometer, totalKilometer);
assert.equal(
  resolveKilometerAllowanceAmount(event.details?.kilometerAllowance),
  expected,
);

const silentUpdatedBooking: CalendarBooking = {
  ...booking,
  id: "booking-silent",
  unique_code: "ML-SILENT",
  status: "confirmed",
  notes: `---mollure-meta---\n${JSON.stringify({
    silentUpdated: true,
    lastEditedBy: "professional",
    services: [
      { id: "svc-1", name: "Cut", price: 40, durationMins: 30, guestId: null },
    ],
  })}`,
};
const silentEvent = mapCalendarBookingToEvent(silentUpdatedBooking, "tm-1");
assert.equal(silentEvent.details?.silentUpdated, true);
assert.notEqual(silentEvent.bookingScenario, "E");
assert.equal(silentEvent.location, "DL");

console.log("calendar-overview.mappers.test.ts: all assertions passed");
