/**
 * Run with: npx --yes tsx src/components/common/calendar/calendar-overview.mappers.test.ts
 */
import assert from "node:assert/strict";
import {
  mapCalendarBookingToEvent,
  mapOverviewBookingsSafe,
  mergeCalendarOverviewEvents,
} from "./calendar-overview.mappers";
import {
  normalizeNotesServiceLines,
  resolveKilometerAllowanceAmount,
} from "./bookingEventDetails";
import {
  dedupeCalendarDisplaySegments,
  resolveSameTimeStackChip,
} from "./calendar-overlap.utils";
import {
  addDaysIso,
  getCalendarQueryDateRange,
  startOfWeekIso,
  toMonthIso,
} from "./calendar.utils";
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

// Project media: fall back to booking.images when location_details.uploads has no live urls.
const mediaBooking: CalendarBooking = {
  id: "booking-media",
  booking_date: "2026-09-23",
  business_setup_id: "biz-1",
  customer_id: "cust-1",
  service_id: "svc-1",
  team_member_id: "tm-1",
  start_time: "2026-09-23T10:00:00",
  end_time: "2026-09-23T10:24:00",
  location_type: "desired",
  notes: `---mollure-meta---\n${JSON.stringify({
    clientSnapshot: {
      projectDetails: { description: "sadfas", uploads: [] },
    },
  })}`,
  status: "confirmed",
  total_price: 10,
  unique_code: "ol1790115795995KQMH9A",
  location_details: {
    projectDescription: "sadfas",
    uploads: [{ id: "u1", name: "dead.jpg", url: null }],
  },
  images: ["/uploads/bookings/x/a.jpg"],
};
const mediaEvent = mapCalendarBookingToEvent(mediaBooking, "tm-1");
assert.equal(mediaEvent.details?.clientSnapshot?.projectDetails?.description, "sadfas");
assert.equal(
  (mediaEvent.details?.clientSnapshot?.projectDetails?.uploads ?? []).length,
  1,
);
assert.equal(
  mediaEvent.details?.clientSnapshot?.projectDetails?.uploads?.[0]?.url,
  "/uploads/bookings/x/a.jpg",
);

// response_deadline_at column wins over notes respondBy (backend COALESCE).
const responseDeadlineBooking: CalendarBooking = {
  ...booking,
  id: "booking-deadline",
  unique_code: "ML-DEADLINE",
  response_deadline_at: "2026-10-13T15:00:00.000Z",
  notes: `---mollure-meta---\n${JSON.stringify({
    responseStartedAt: "2026-10-13T14:00:00.000Z",
    respondBy: "2026-10-13T14:30:00.000Z",
    responseWindowMinutes: 30,
    responseStatus: "overdue_response",
    services: [
      { id: "svc-1", name: "Cut", price: 40, durationMins: 30, guestId: null },
    ],
  })}`,
};
const deadlineEvent = mapCalendarBookingToEvent(responseDeadlineBooking, "tm-1");
assert.equal(deadlineEvent.details?.respondBy, "2026-10-13T15:00:00.000Z");
assert.equal(deadlineEvent.details?.responseStartedAt, "2026-10-13T14:00:00.000Z");
assert.equal(deadlineEvent.details?.responseWindowMinutes, 30);
assert.equal(deadlineEvent.details?.responseStatus, "overdue_response");

// Free-text / no-service historical rows must not abort the overview map loop.
const freeTextServices = normalizeNotesServiceLines("Cut and color");
assert.equal(freeTextServices?.length, 1);
assert.equal(freeTextServices?.[0]?.name, "Cut and color");

const freeTextBooking: CalendarBooking = {
  ...booking,
  id: "booking-free-text",
  unique_code: "ML-FREE",
  service_id: null,
  service_title: null,
  notes: `Client wants bangs\n---mollure-meta---\n${JSON.stringify({
    services: "Cut and color",
    guests: [{ id: "g1", name: "Guest", services: "Blow dry" }],
  })}`,
  images: '["/uploads/a.jpg"]' as unknown as string[],
  location_details: JSON.stringify({
    projectDescription: "legacy",
  }) as unknown as Record<string, unknown>,
};
const freeTextEvent = mapCalendarBookingToEvent(freeTextBooking, "tm-1");
assert.equal(freeTextEvent.details?.services?.[0]?.name, "Cut and color");
assert.ok(freeTextEvent.details?.services?.[0]?.id);

const noServiceRequest: CalendarBooking = {
  ...booking,
  id: "booking-no-svc",
  unique_code: "ML-NOSVC",
  service_id: null,
  service_title: null,
  notes: "please call me",
  status: "requested",
  booking_type: "request",
};
const noServiceEvent = mapCalendarBookingToEvent(noServiceRequest, "tm-1");
assert.equal(noServiceEvent.details?.services?.[0]?.id, "svc-b-booking-no-svc");
assert.ok(noServiceEvent.title);

// 174-row stress: one thrower + free-text + no-service must not zero the list.
const thrower = {
  get id() {
    return "booking-throw";
  },
  get status() {
    throw new Error("boom");
  },
} as unknown as CalendarBooking;

const bulk: CalendarBooking[] = [];
const bulkRangeStart = "2026-09-15";
for (let i = 0; i < 174; i += 1) {
  const date = addDaysIso(bulkRangeStart, i % 35);
  bulk.push({
    ...booking,
    id: `bulk-${i}`,
    unique_code: `ML-BULK-${i}`,
    booking_date: date,
    date,
    start_time: `${date}T10:00:00`,
    end_time: `${date}T11:00:00`,
    service_id: i % 13 === 0 ? null : `svc-${i % 5}`,
    notes:
      i % 7 === 0
        ? `---mollure-meta---\n${JSON.stringify({ services: `Free text ${i}` })}`
        : booking.notes,
  });
}
bulk[20] = thrower;
bulk[21] = freeTextBooking;
bulk[22] = noServiceRequest;

const safe = mapOverviewBookingsSafe(bulk, "tm-1");
assert.equal(safe.stats.fetched, 174);
assert.ok(safe.stats.mapped >= 172, `mapped=${safe.stats.mapped}`);
assert.ok(
  safe.stats.dropped.some((row) => row.reason.includes("boom")),
  "thrower should be dropped with reason",
);
const daysCovered = new Set(safe.events.map((event) => event.date));
assert.ok(daysCovered.size >= 30, `daysCovered=${daysCovered.size}`);

const monthRange = getCalendarQueryDateRange("2026-10-13", "day");
const gridStart = startOfWeekIso(toMonthIso("2026-10-13"));
assert.equal(monthRange.startDate, gridStart);
assert.equal(monthRange.endDate, addDaysIso(gridStart, 41));
// day/week/month share the same fetch window (no 1-day under-fetch).
assert.deepEqual(monthRange, getCalendarQueryDateRange("2026-10-13", "week"));
assert.deepEqual(monthRange, getCalendarQueryDateRange("2026-10-13", "month"));

const mergedBulk = mergeCalendarOverviewEvents([], bulk, "tm-1");
assert.ok(mergedBulk.length >= 172);

console.log(
  `calendar-overview.mappers.test.ts: fetched=${safe.stats.fetched} mapped=${safe.stats.mapped} dropped=${safe.stats.dropped.length} days=${daysCovered.size}`,
);
console.log("calendar-overview.mappers.test.ts: all assertions passed");
