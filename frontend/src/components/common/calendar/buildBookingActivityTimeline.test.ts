/**
 * Run with: npx --yes tsx src/components/common/calendar/buildBookingActivityTimeline.test.ts
 */
import assert from "node:assert/strict";
import { buildBookingActivityTimeline } from "./buildBookingActivityTimeline";
import { serializeCalendarEntryNotes } from "./bookingEventDetails";
import { buildAcceptAckDetails } from "./bookingAcknowledgment";
import { parseCalendarEntryNotes } from "./bookingEventDetails";

const erNotes = serializeCalendarEntryNotes(
  "",
  {
    originalGuests: [
      { id: "g1", name: "Ali", participantType: "guest", services: [], products: [] },
      { id: "p1", name: "Planning", participantType: "planning", services: [], products: [] },
    ],
    guests: [
      { id: "g1", name: "umerarshad", participantType: "guest", services: [], products: [] },
      { id: "p1", name: "Planning", participantType: "planning", services: [], products: [] },
    ],
  },
  null,
  {
    status: "pending",
    initiatedBy: "professional",
    note: "Please update guest name",
  },
);

const items = buildBookingActivityTimeline({
  bookings: [
    {
      id: "1",
      unique_code: "BK1",
      status: "confirmed",
      notes: erNotes,
    },
  ],
  clientName: "Client",
  currentBookingId: "1",
  currentBookingCode: "BK1",
  currentScenario: "ER",
  currentStatus: "confirmed",
  currentDetails: {
    originalGuests: [
      { id: "g1", name: "Ali", participantType: "guest", services: [] },
      { id: "p1", name: "Planning", participantType: "planning", services: [] },
    ],
    guests: [
      { id: "g1", name: "umerarshad", participantType: "guest", services: [] },
      { id: "p1", name: "Planning", participantType: "planning", services: [] },
    ],
  },
  mode: "activity",
});

const comparisonItem = items.find((item) => item.comparison?.rows.length);
assert.ok(comparisonItem, "expected a comparison activity row");
const guestRow = comparisonItem!.comparison!.rows.find((row) => row.id === "guests");
assert.ok(guestRow, "expected a Guest names comparison row");
assert.equal(guestRow!.label, "Guest names");
assert.equal(guestRow!.originalValue, "Ali");
assert.equal(guestRow!.newValue, "umerarshad");
assert.equal(guestRow!.changeKind, "changed");

const snapshotFallback = buildBookingActivityTimeline({
  bookings: [
    {
      id: "2",
      unique_code: "BK2",
      status: "confirmed",
      notes: serializeCalendarEntryNotes(
        "",
        {
          guests: [
            { id: "g1", name: "umerarshad", participantType: "guest", services: [], products: [] },
          ],
          silentUpdated: true,
          silentUpdateSnapshot: {
            guests: [{ id: "g1", name: "Ali", participantType: "guest", services: [], products: [] }],
          },
        },
      ),
    },
  ],
  clientName: "Client",
  currentBookingId: "2",
  currentBookingCode: "BK2",
  currentScenario: "ER",
  currentStatus: "confirmed",
  currentDetails: {
    guests: [
      { id: "g1", name: "umerarshad", participantType: "guest", services: [] },
    ],
    silentUpdated: true,
    silentUpdateSnapshot: {
      guests: [{ id: "g1", name: "Ali", participantType: "guest", services: [] }],
    },
  },
  mode: "activity",
});
const snapshotGuest = snapshotFallback
  .find((item) => item.comparison?.rows.length)
  ?.comparison?.rows.find((row) => row.id === "guests");
assert.equal(snapshotGuest?.originalValue, "Ali");
assert.equal(snapshotGuest?.newValue, "umerarshad");

// Fresh create: services present, no ER/EBR markers → no invent edit activity.
const freshCreate = buildBookingActivityTimeline({
  bookings: [
    {
      id: "3",
      unique_code: "BK3",
      status: "confirmed",
      notes: null,
      created_at: "2026-09-21T14:04:00.000Z",
      updated_at: "2026-09-21T14:04:00.000Z",
    },
  ],
  clientName: "aliza",
  currentBookingId: "3",
  currentBookingCode: "BK3",
  currentScenario: null,
  currentStatus: "confirmed",
  currentDetails: {
    services: [
      {
        id: "buzz",
        name: "buzz cutt",
        price: 44,
        durationMins: 15,
        startTime: "09:00",
        endTime: "09:15",
      },
      {
        id: "buzz",
        name: "buzz cutt",
        price: 44,
        durationMins: 15,
        startTime: "00:00",
        endTime: "00:15",
        guestId: "g1",
      },
    ],
  },
  apiEvents: [
    {
      id: "a1",
      bookingId: "3",
      kind: "booking_confirmed",
      actor: "professional",
      actorLabel: "Professional",
      title: "Confirmed",
      occurredAt: "2026-09-21T14:04:00.000Z",
    },
    {
      id: "a2",
      bookingId: "3",
      kind: "booking_created",
      actor: "client",
      actorLabel: "Client",
      title: "Booking created",
      occurredAt: "2026-09-21T14:04:00.000Z",
    },
    {
      id: "a3",
      bookingId: "3",
      kind: "edit_request_sent",
      actor: "professional",
      actorLabel: "Professional",
      title: "Edited Booking Request sent",
      occurredAt: "2026-09-21T14:04:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(
  freshCreate.some((item) => item.kind === "edit_request_sent"),
  false,
  "fresh create must not show Edited Booking Request sent",
);
assert.ok(
  freshCreate.some((item) => item.kind === "booking_created"),
  "fresh create still shows Booking created",
);

// Scenario EBR alone (misclassified) must not invent Edited without a real EBR payload.
const ebrScenarioOnly = buildBookingActivityTimeline({
  bookings: [
    {
      id: "4",
      unique_code: "BK4",
      status: "requested",
      notes: null,
      created_at: "2026-09-21T13:34:00.000Z",
      updated_at: "2026-09-21T13:34:00.000Z",
      booking_date: "2026-09-21",
      start_time: "18:34:00",
    },
  ],
  clientName: "Client",
  currentBookingId: "4",
  currentBookingCode: "BK4",
  currentScenario: "EBR",
  currentStatus: "Requested",
  currentDetails: {
    services: [{ id: "s1", name: "cut", price: 10, durationMins: 15 }],
  },
  currentDateISO: "2026-09-21",
  currentStart: "18:34",
  apiEvents: [
    {
      id: "b1",
      bookingId: "4",
      kind: "booking_request_sent",
      actor: "professional",
      actorLabel: "Professional",
      title: "Booking Request sent",
      occurredAt: "2026-09-21T13:34:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(
  ebrScenarioOnly.some((item) => item.kind === "edit_request_sent"),
  false,
  "EBR scenario alone must not invent Edited Booking Request sent",
);

// BR send → accept → confirm/prepaid must not invent Edited.
const priorDetails = {
  requestDirection: "outgoing" as const,
  originalServices: [
    {
      id: "hair",
      name: "test - hair dye",
      price: 64,
      durationMins: 135,
      startTime: "09:00",
      endTime: "11:15",
    },
  ],
  services: [
    {
      id: "hair",
      name: "test - hair dye",
      price: 64,
      durationMins: 135,
      startTime: "09:00",
      endTime: "11:15",
    },
  ],
  showPrepayment: true,
  prepaymentPercent: "100",
};
const priorNotes = serializeCalendarEntryNotes("", priorDetails);
const ackDetails = buildAcceptAckDetails({
  prepayRequired: true,
  prepayPaid: true,
  requestDirection: "outgoing",
  ackScenario: "BR",
  base: parseCalendarEntryNotes(priorNotes),
});
const afterAcceptNotes = serializeCalendarEntryNotes(
  ackDetails.internalNote ?? "",
  ackDetails,
);
const brAcceptPath = buildBookingActivityTimeline({
  bookings: [
    {
      id: "5",
      unique_code: "BK5",
      status: "confirmed",
      notes: afterAcceptNotes,
      created_at: "2026-09-21T13:34:00.000Z",
      updated_at: "2026-09-21T15:07:00.000Z",
      booking_date: "2026-09-21",
      start_time: "09:00:00",
      prepayment_status: "paid",
      total_price: 64,
    },
  ],
  clientName: "Client",
  currentBookingId: "5",
  currentBookingCode: "BK5",
  currentScenario: "BR",
  currentStatus: "Confirmed",
  currentDetails: {
    ...ackDetails,
    // lastEditedBy alone (no ER/EBR / line ids) must not invent Edited.
    lastEditedBy: "professional",
  },
  currentDateISO: "2026-09-21",
  currentStart: "09:00",
  apiEvents: [
    {
      id: "c1",
      bookingId: "5",
      kind: "booking_prepaid",
      actor: "client",
      actorLabel: "Client",
      title: "Booking prepaid",
      subtitle: "Online Direct (64.00 EUR)",
      occurredAt: "2026-09-21T15:07:00.000Z",
    },
    {
      id: "c2",
      bookingId: "5",
      kind: "booking_confirmed",
      actor: "professional",
      actorLabel: "Professional",
      title: "Confirmed",
      occurredAt: "2026-09-21T15:07:00.000Z",
    },
    {
      id: "c3",
      bookingId: "5",
      kind: "booking_accepted",
      actor: "professional",
      actorLabel: "Professional",
      title: "Booking Request Accepted",
      occurredAt: "2026-09-21T15:07:00.000Z",
    },
    {
      id: "c4",
      bookingId: "5",
      kind: "booking_request_sent",
      actor: "professional",
      actorLabel: "Professional",
      title: "Booking Request sent",
      occurredAt: "2026-09-21T13:34:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(
  brAcceptPath.some((item) => item.kind === "edit_request_sent"),
  false,
  "BR accept/prepaid must not show Edited Booking Request sent",
);
assert.ok(
  brAcceptPath.some((item) => item.kind === "booking_request_sent"),
  "BR accept path still shows Booking Request sent",
);
assert.ok(
  brAcceptPath.some((item) => item.kind === "booking_accepted"),
  "BR accept path still shows Booking Request Accepted",
);

// silentUpdated alone must not invent Edited BR (comparison inject hole).
const silentOnly = buildBookingActivityTimeline({
  bookings: [
    {
      id: "6",
      unique_code: "BK6",
      status: "requested",
      notes: serializeCalendarEntryNotes("", {
        requestDirection: "outgoing",
        originalServices: [
          {
            id: "hair",
            name: "hair dye",
            price: 44,
            durationMins: 60,
            startTime: "09:00",
            endTime: "10:00",
          },
        ],
        services: [
          {
            id: "hair",
            name: "hair dye",
            price: 44,
            durationMins: 60,
            startTime: "09:00",
            endTime: "10:00",
          },
          {
            id: "buzz",
            name: "buzz cutt",
            price: 44,
            durationMins: 15,
            startTime: "10:00",
            endTime: "10:15",
            guestId: "g1",
          },
        ],
        silentUpdated: true,
        silentUpdateSnapshot: {
          phoneCode: "+32",
          phoneNumber: "470000000",
        },
      }),
      created_at: "2026-09-21T15:52:00.000Z",
      updated_at: "2026-09-21T15:52:00.000Z",
      booking_date: "2026-09-21",
      start_time: "09:00:00",
    },
  ],
  clientName: "Client",
  currentBookingId: "6",
  currentBookingCode: "BK6",
  currentScenario: "BR",
  currentStatus: "Requested",
  currentDetails: {
    originalServices: [
      {
        id: "hair",
        name: "hair dye",
        price: 44,
        durationMins: 60,
        startTime: "09:00",
        endTime: "10:00",
      },
    ],
    services: [
      {
        id: "hair",
        name: "hair dye",
        price: 44,
        durationMins: 60,
        startTime: "09:00",
        endTime: "10:00",
      },
      {
        id: "buzz",
        name: "buzz cutt",
        price: 44,
        durationMins: 15,
        startTime: "10:00",
        endTime: "10:15",
        guestId: "g1",
      },
    ],
    silentUpdated: true,
  },
  currentDateISO: "2026-09-21",
  currentStart: "09:00",
  apiEvents: [
    {
      id: "d1",
      bookingId: "6",
      kind: "booking_request_sent",
      actor: "professional",
      actorLabel: "Professional",
      title: "Booking Request sent",
      occurredAt: "2026-09-21T15:52:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(
  silentOnly.some((item) => item.kind === "edit_request_sent"),
  false,
  "silentUpdated + guest-line noise must not invent Edited Booking Request sent",
);
assert.ok(
  silentOnly.some((item) => item.kind === "booking_request_sent"),
  "silent path still shows Booking Request sent",
);

// Brand-new Requested BR (client details case): only BR sent, never Edited.
const newRequestedBr = buildBookingActivityTimeline({
  bookings: [
    {
      id: "7",
      unique_code: "ol1790006208534ad88",
      status: "requested",
      notes: serializeCalendarEntryNotes("", {
        requestDirection: "incoming",
        clientSnapshot: {
          services: [
            { id: "hair", name: "hair dye", price: 44, durationMins: 60 },
            { id: "buzz", name: "buzz cutt", price: 44, durationMins: 15 },
          ],
        },
      }),
      created_at: "2026-09-21T15:52:00.000Z",
      updated_at: "2026-09-21T15:52:00.000Z",
      booking_date: "2026-09-21",
      start_time: "09:00:00",
    },
  ],
  clientName: "Client",
  currentBookingId: "7",
  currentBookingCode: "ol1790006208534ad88",
  currentScenario: "BR",
  currentStatus: "Requested",
  currentDetails: {
    services: [
      { id: "hair", name: "hair dye", price: 44, durationMins: 60 },
      { id: "buzz", name: "buzz cutt", price: 44, durationMins: 15 },
    ],
  },
  apiEvents: [
    {
      id: "e1",
      bookingId: "7",
      kind: "booking_request_sent",
      actor: "client",
      actorLabel: "Client",
      title: "Booking Request sent",
      occurredAt: "2026-09-21T15:52:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(
  newRequestedBr.some((item) => item.kind === "edit_request_sent"),
  false,
  "new Requested booking Activity must not show Edited Booking Request sent",
);
assert.equal(
  newRequestedBr.some((item) =>
    String(item.title).includes("Edited Booking Request"),
  ),
  false,
  "new Requested booking must not use Edited Booking Request title",
);
assert.ok(
  newRequestedBr.some((item) => item.title === "Booking Request sent"),
  "new Requested booking shows Booking Request sent",
);

// Offline confirmed: never invent Booking Request Accepted; unpaid never invents prepaid.
const offlineConfirmed = buildBookingActivityTimeline({
  bookings: [
    {
      id: "8",
      unique_code: "of123",
      status: "confirmed",
      booking_type: "offline",
      prepayment_status: "pending",
      created_at: "2026-09-21T10:00:00.000Z",
      updated_at: "2026-09-21T10:00:00.000Z",
    },
  ],
  clientName: "Walk-in",
  currentBookingId: "8",
  currentBookingCode: "of123",
  currentScenario: null,
  currentStatus: "Confirmed",
  currentBookingType: "Offline",
  mode: "activity",
});
assert.equal(
  offlineConfirmed.some((item) => item.kind === "booking_accepted"),
  false,
  "offline confirmed must not invent Booking Request Accepted",
);
assert.equal(
  offlineConfirmed.some((item) => item.kind === "booking_prepaid"),
  false,
  "pending prepayment must not invent Booking prepaid",
);
assert.ok(
  offlineConfirmed.some((item) => item.kind === "booking_confirmed"),
  "offline confirmed still shows Confirmed",
);

// Identical API rows collapse to one.
const dedupedApi = buildBookingActivityTimeline({
  bookings: [
    {
      id: "9",
      unique_code: "BK9",
      status: "confirmed",
      created_at: "2026-09-21T10:00:00.000Z",
    },
  ],
  clientName: "Client",
  currentBookingId: "9",
  currentBookingCode: "BK9",
  currentStatus: "confirmed",
  apiEvents: [
    {
      id: "dup1",
      bookingId: "9",
      kind: "booking_confirmed",
      actor: "professional",
      actorLabel: "Professional",
      title: "Confirmed",
      occurredAt: "2026-09-21T10:00:00.000Z",
    },
    {
      id: "dup2",
      bookingId: "9",
      kind: "booking_confirmed",
      actor: "professional",
      actorLabel: "Professional",
      title: "Confirmed",
      occurredAt: "2026-09-21T10:00:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(
  dedupedApi.filter((item) => item.kind === "booking_confirmed").length,
  1,
  "identical Confirmed API events must dedupe",
);

// Empty apiEvents array = server SSOT; must not synthesize browser timeline rows.
const emptyServerTimeline = buildBookingActivityTimeline({
  bookings: [
    {
      id: "srv-empty",
      unique_code: "BK-EMPTY",
      status: "confirmed",
      created_at: "2026-09-21T10:00:00.000Z",
      updated_at: "2026-09-21T11:00:00.000Z",
    },
  ],
  clientName: "Client",
  currentBookingId: "srv-empty",
  currentBookingCode: "BK-EMPTY",
  currentStatus: "confirmed",
  apiEvents: [],
  mode: "activity",
});
assert.equal(
  emptyServerTimeline.length,
  0,
  "empty server activity must not invent timeline rows",
);

const lifecycleEvents = [
  { id: "started", bookingId: "activity-booking", kind: "booking_in_progress", title: "In Progress", actor: "system", occurredAt: "2026-11-03T09:15:00Z" },
  { id: "portion", bookingId: "activity-booking", kind: "post_booking_paid", title: "Client paid remaining portion", actor: "client", actorLabel: "Client Ali", subtitle: "Online - Direct Card · 70.40 EUR", occurredAt: "2026-11-03T10:30:00Z" },
  { id: "finished", bookingId: "activity-booking", kind: "booking_completed", title: "Completed", actor: "system", occurredAt: "2026-11-03T10:15:00Z" },
];
const lifecycleInput = {
  bookings: [],
  currentBookingId: "activity-booking",
  apiEvents: lifecycleEvents,
};
const lifecycleItems = buildBookingActivityTimeline({ ...lifecycleInput, mode: "activity" });
assert.deepEqual(lifecycleItems.map((item) => item.id), ["portion", "finished", "started"], "service transitions and portion payments sort by actual occurrence, newest first");
assert.deepEqual(lifecycleItems.map((item) => item.kind), ["post_booking_paid", "booking_completed", "booking_in_progress"], "new server lifecycle kinds must not map to booking_created");
assert.equal(lifecycleItems[0].subtitle, "Online - Direct Card · 70.40 EUR");
assert.equal(lifecycleItems[0].actorLabel, "Client Ali");
assert.ok(lifecycleItems.every((item) => item.dateLabel && item.timeLabel));
assert.deepEqual(buildBookingActivityTimeline({ ...lifecycleInput, mode: "sales" }).map((item) => item.id), ["portion"], "portion payments also appear in sales activity without lifecycle rows");

const splitPayments = buildBookingActivityTimeline({
  bookings: [
    {
      id: "split-1",
      unique_code: "BK-SPLIT",
      status: "completed",
      customer_name: "Liza",
      created_at: "2026-09-21T09:00:00.000Z",
    },
  ],
  clientName: "Liza",
  currentBookingId: "split-1",
  currentBookingCode: "BK-SPLIT",
  apiEvents: [
    {
      id: "e-conf",
      bookingId: "split-1",
      kind: "booking_confirmed",
      actor: "professional",
      actorLabel: "Professional",
      title: "Confirmed",
      occurredAt: "2026-09-21T10:00:00.000Z",
    },
    {
      id: "e-main-pay",
      bookingId: "split-1",
      kind: "post_booking_paid",
      actor: "client",
      actorLabel: "Liza",
      title: "After-treatment payment completed",
      subtitle: "Online Direct (60.00 EUR)",
      occurredAt: "2026-09-21T12:05:00.000Z",
    },
    {
      id: "e-guest-pay",
      bookingId: "split-1",
      kind: "post_booking_paid",
      actor: "guest",
      actorLabel: "Bea",
      title: "Guest payment completed",
      subtitle: "Online Direct (40.00 EUR)",
      occurredAt: "2026-09-21T14:00:00.000Z",
    },
  ],
  mode: "activity",
});
assert.equal(splitPayments[0]?.kind, "post_booking_paid");
assert.equal(splitPayments[0]?.actorLabel, "Bea");
assert.equal(splitPayments[2]?.kind, "booking_confirmed");

console.log("buildBookingActivityTimeline.test.ts passed");
