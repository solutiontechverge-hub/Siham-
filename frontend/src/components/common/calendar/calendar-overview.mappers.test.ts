/**
 * Run with: npx --yes tsx src/components/common/calendar/calendar-overview.mappers.test.ts
 */
import assert from "node:assert/strict";
import {
  mapCalendarBookingToEvent,
  mergeCalendarOverviewEvents,
} from "./calendar-overview.mappers";
import { resolveKilometerAllowanceAmount } from "./bookingEventDetails";
import {
  dedupeCalendarDisplaySegments,
  resolveSameTimeStackChip,
} from "./calendar-overlap.utils";
import type {
  CalendarBooking,
  CalendarEntry,
} from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";

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

const ALI = "tm-ali";
const ALIZA = "tm-aliza";
const multiStaffNotes = `---mollure-meta---\n${JSON.stringify({
  clientSnapshot: {
    people: [{ id: "p-requester", name: "Client Co", isRequester: true }],
    services: [
      {
        id: "svc-a",
        name: "eyelash",
        price: 111,
        durationMins: 15,
        startTime: "09:00",
        endTime: "09:15",
        guestId: null,
        teamMemberId: ALI,
      },
      {
        id: "svc-b",
        name: "Muhammad",
        price: 11,
        durationMins: 15,
        startTime: "09:00",
        endTime: "09:15",
        guestId: null,
        teamMemberId: ALIZA,
      },
    ],
    teamMembers: [
      { id: ALI, name: "ali" },
      { id: ALIZA, name: "aliza" },
    ],
  },
})}`;

const multiStaffBooking: CalendarBooking = {
  id: "booking-multi",
  booking_date: "2026-09-10",
  business_setup_id: "biz-1",
  customer_id: "cust-1",
  service_id: "svc-1",
  team_member_id: ALI,
  start_time: "2026-09-10T09:00:00",
  end_time: "2026-09-10T09:30:00",
  location_type: "fixed",
  notes: multiStaffNotes,
  status: "confirmed",
  total_price: 0,
  unique_code: "ol-multi-1",
  date: "2026-09-10",
  start: "09:00",
  end: "09:30",
  customer_name: "Client Co",
  service_title: "eyelash",
};

const mirroredEntry: CalendarEntry = {
  id: "entry-multi",
  professional_profile_id: "pp-1",
  title: "eyelash · Muhammad",
  status: "confirmed",
  unique_code: "ol-multi-1",
  team_member_id: ALI,
  location_type: "fixed",
  notes: multiStaffNotes,
  client_name: "Client Co",
  date: "2026-09-10",
  start: "09:00",
  end: "09:30",
  start_time: "2026-09-10T09:00:00",
  end_time: "2026-09-10T09:30:00",
  start_date: null,
  end_date: null,
  blocked_time_start: null,
  blocked_time_end: null,
  booking_type: "online",
  service_ids: ["svc-1"],
  created_at: "2026-09-10T08:00:00",
  updated_at: "2026-09-10T08:00:00",
};

const mergedOnce = mergeCalendarOverviewEvents(
  [mirroredEntry],
  [multiStaffBooking],
  ALI,
);
assert.equal(mergedOnce.length, 1, "mirrored entry should not duplicate booking");

const mergedJoinDup = mergeCalendarOverviewEvents(
  [],
  [multiStaffBooking, multiStaffBooking],
  ALI,
);
assert.equal(mergedJoinDup.length, 1, "join fan-out must collapse to one booking");

const mappedMulti = mapCalendarBookingToEvent(multiStaffBooking, ALI);
assert.ok(
  mappedMulti.details?.services?.some((s) => s.teamMemberId === ALI),
  "main services keep teamMemberId for lane matching",
);
assert.ok(
  mappedMulti.details?.services?.some((s) => s.teamMemberId === ALIZA),
  "second assigned member stays on services",
);

function fakeSegments(source: CalendarEvent): CalendarEvent[] {
  return [ALI, ALIZA].map((resourceId, index) => ({
    ...source,
    id: `${source.id}::segment-${index}`,
    resourceId,
    teamShared: true,
  }));
}

const segmentsDupRaw = [
  ...fakeSegments(mergedOnce[0]),
  ...fakeSegments({
    ...mergedOnce[0],
    id: "b-booking-multi-copy",
    bookingCode: "OL-MULTI-1",
  }),
];
assert.equal(segmentsDupRaw.length, 4);
const segmentsDeduped = dedupeCalendarDisplaySegments(segmentsDupRaw);
assert.equal(segmentsDeduped.length, 2, "display dedupe keeps one card per staff");
const aliLane = segmentsDeduped.filter((row) => row.resourceId === ALI);
assert.equal(resolveSameTimeStackChip(aliLane), null);

console.log("calendar-overview.mappers.test.ts: all assertions passed");
