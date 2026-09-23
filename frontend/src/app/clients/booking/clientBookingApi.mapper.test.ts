/**
 * Run with: npx --yes tsx src/app/clients/booking/clientBookingApi.mapper.test.ts
 */
import assert from "node:assert/strict";
import { mapApiBookingToClientRecord } from "./clientBookingApi.mapper";
import { buildBookingSummarySections } from "../../../components/common/client-booking/buildBookingSummarySections";
import type { CalendarBooking } from "../../../store/services/businessApi";

function bookingWithNotes(meta: Record<string, unknown>): CalendarBooking {
  return {
    id: "booking-1",
    booking_date: "2026-09-08",
    business_setup_id: "biz-1",
    customer_id: "cust-1",
    service_id: "svc-umar",
    team_member_id: "tm-1",
    start_time: "2026-09-08T11:15:00",
    end_time: "2026-09-08T14:48:00",
    location_type: "fixed",
    notes: `---mollure-meta---\n${JSON.stringify(meta)}`,
    status: "requested",
    total_price: 246,
    unique_code: "ML-1",
    team_member_name: "Umer",
    business_name: "Salon",
  };
}

const sharedService = (guestId: string | null) => [
  {
    id: "svc-umar",
    name: "Muhammad umer arshad",
    price: 11,
    durationMins: 60,
    guestId,
  },
  {
    id: "svc-lash",
    name: "eyelash",
    price: 111,
    durationMins: 11,
    guestId,
  },
];

const snapshotOnlyMeta = {
  clientSnapshot: {
    people: [
      { id: "p-requester", name: "alizaCompany", isRequester: true },
      { id: "model-1", name: "ali", isRequester: false, participantType: "model" },
      { id: "model-2", name: "umer", isRequester: false, participantType: "model" },
    ],
    services: [
      ...sharedService(null),
      ...sharedService("model-1"),
      ...sharedService("model-2"),
    ],
    projectDetails: { description: "helo", uploads: [] },
  },
};

const record = mapApiBookingToClientRecord(bookingWithNotes(snapshotOnlyMeta));
const services = record.draft?.services ?? [];
assert.equal(services.length, 6);
assert.equal(
  services.filter((row) => (row.guestId ?? null) === null).length,
  2,
);
assert.equal(services.filter((row) => row.guestId === "model-1").length, 2);
assert.equal(services.filter((row) => row.guestId === "model-2").length, 2);

const sections = buildBookingSummarySections(record.draft ?? null);
const requester = sections.find((section) => section.participantType === "requester");
const models = sections.filter((section) => section.participantType === "model");
assert.equal(requester?.items.length, 2);
assert.equal(
  requester?.items.some((item) => item.name === "Muhammad umer arshad"),
  true,
);
assert.equal(requester?.items.some((item) => item.name === "eyelash"), true);
assert.equal(models.length, 2);
assert.equal(models[0]?.items.length, 2);
assert.equal(models[1]?.items.length, 2);

const omittedGuestIdOnMain = {
  clientSnapshot: snapshotOnlyMeta.clientSnapshot,
  services: sharedService(null).map(({ guestId: _guestId, ...row }) => row),
};
const omittedRecord = mapApiBookingToClientRecord(
  bookingWithNotes(omittedGuestIdOnMain),
);
assert.equal(
  (omittedRecord.draft?.services ?? []).filter((row) => (row.guestId ?? null) === null)
    .length,
  2,
);
assert.equal(
  (omittedRecord.draft?.services ?? []).filter((row) => row.guestId === "model-1")
    .length,
  2,
);

const requesterTaggedMeta = {
  clientSnapshot: snapshotOnlyMeta.clientSnapshot,
  services: sharedService("p-requester"),
};
const requesterTagged = mapApiBookingToClientRecord(
  bookingWithNotes(requesterTaggedMeta),
);
assert.equal(requesterTagged.draft?.services?.length, 6);
assert.equal(
  (requesterTagged.draft?.services ?? []).filter((row) => (row.guestId ?? null) === null)
    .length,
  2,
);

const nestedContactDuplicate = mapApiBookingToClientRecord(
  bookingWithNotes({
    ...snapshotOnlyMeta,
    services: sharedService(null),
    guests: [
      {
        id: "p-requester",
        name: "alizaCompany",
        services: sharedService(null).map((row) => ({
          ...row,
          guestId: "p-requester",
        })),
      },
      {
        id: "contact-umer",
        name: "umer",
        services: sharedService(null),
      },
    ],
  }),
);
assert.equal(nestedContactDuplicate.draft?.services?.length, 6);
assert.equal(
  (nestedContactDuplicate.draft?.services ?? []).filter(
    (row) => (row.guestId ?? null) === null,
  ).length,
  2,
);
const nestedSections = buildBookingSummarySections(
  nestedContactDuplicate.draft ?? null,
);
assert.equal(
  nestedSections.find((section) => section.participantType === "requester")
    ?.items.length,
  2,
);

const fourCopyMeta = {
  clientSnapshot: {
    people: [{ id: "p-requester", name: "alizaCompany", isRequester: true }],
    services: [
      ...sharedService(null),
      ...sharedService("p-requester").map((row, index) => ({
        ...row,
        id: `${row.id}-copy`,
        startTime: index === 0 ? "1:00 AM" : "2:00 AM",
      })),
    ],
  },
};
const fourCopyRecord = mapApiBookingToClientRecord(bookingWithNotes(fourCopyMeta));
assert.equal(
  (fourCopyRecord.draft?.services ?? []).filter((row) => (row.guestId ?? null) === null)
    .length,
  2,
);
assert.equal(
  buildBookingSummarySections(fourCopyRecord.draft ?? null).find(
    (section) => section.participantType === "requester",
  )?.items.length,
  2,
);

const nestedModelKeepsOwnLines = mapApiBookingToClientRecord(
  bookingWithNotes({
    clientSnapshot: {
      people: snapshotOnlyMeta.clientSnapshot.people,
      services: sharedService(null),
    },
    guests: [
      {
        id: "model-1",
        name: "ali",
        participantType: "model",
        services: sharedService("model-1"),
      },
    ],
  }),
);
assert.equal(nestedModelKeepsOwnLines.draft?.services?.length, 4);
assert.equal(
  (nestedModelKeepsOwnLines.draft?.services ?? []).filter(
    (row) => row.guestId === "model-1",
  ).length,
  2,
);

const eurPerKm = "12";
const totalKilometer = "11";
const kmBooking = {
  ...bookingWithNotes({
    ...snapshotOnlyMeta,
    showKilometerAllowance: true,
    kilometerAllowance: { eurPerKm, totalKilometer },
  }),
  location_type: "desired" as const,
};
const kmRecord = mapApiBookingToClientRecord(kmBooking);
const withoutKm = mapApiBookingToClientRecord(
  bookingWithNotes(snapshotOnlyMeta),
).draft?.total ?? 0;
const kmAmount = Number(eurPerKm) * Number(totalKilometer);
assert.equal(kmRecord.draft?.total, withoutKm + kmAmount);

// Notes prepaymentStatus confirmed ⇒ prepaid even when column still unpaid.
const notesPaidOnly = mapApiBookingToClientRecord(
  bookingWithNotes({
    ...snapshotOnlyMeta,
    showPrepayment: true,
    prepaymentStatus: "confirmed",
  }),
);
assert.equal(notesPaidOnly.prepaid, true);
assert.equal(
  mapApiBookingToClientRecord(
    bookingWithNotes({ ...snapshotOnlyMeta, showPrepayment: true }),
  ).prepaid,
  false,
);

// Desired Location: people/services survive via location_details when notes meta is lost.
const locationOnlyPeople = mapApiBookingToClientRecord({
  id: "booking-dl-1",
  booking_date: "2026-09-23",
  business_setup_id: "biz-1",
  customer_id: "cust-1",
  service_id: "svc-lash",
  team_member_id: "tm-1",
  start_time: "2026-09-23T09:00:00",
  end_time: "2026-09-23T09:15:00",
  location_type: "desired",
  notes: "Project detailsdfsdsd",
  status: "confirmed",
  total_price: 133,
  unique_code: "ol17901146314317FCZQH",
  team_member_name: "ali",
  business_name: "Salon",
  location_details: {
    projectDescription: "Project detailsdfsdsd",
    uploads: [{ id: "u1", name: "WhatsApp.jpg", url: "https://cdn.example/wa.jpg" }],
    desiredLocation: {
      street: "sfdsfds",
      number: "ff",
      postalCode: "dsfsdf",
      province: "",
      municipality: "Rotterdam",
    },
    clientSnapshot: {
      people: [
        { id: "p-requester", name: "alizaCompany", isRequester: true },
        { id: "model-1", name: "Model", participantType: "model" },
        {
          id: "p-planning",
          name: "Planning",
          participantType: "planning",
          planningActivity: "Photoshoot",
          planningDuration: "30 mins",
          planningStartTime: "9:15 AM",
          planningEndTime: "9:45 AM",
        },
      ],
      services: [
        {
          id: "svc-lash",
          name: "eyelash",
          price: 133,
          durationMins: 15,
          guestId: "p-requester",
          teamMemberId: "tm-1",
        },
        {
          id: "svc-model",
          name: "brow",
          price: 40,
          durationMins: 20,
          guestId: "model-1",
          teamMemberId: "tm-1",
        },
      ],
    },
  },
});
const locationOnlySections = buildBookingSummarySections(
  locationOnlyPeople.draft ?? null,
);
assert.equal(
  locationOnlySections.some((section) => section.participantType === "model"),
  true,
);
assert.equal(
  locationOnlySections.some((section) => section.participantType === "planning"),
  true,
);
assert.equal(
  (locationOnlyPeople.draft?.services ?? []).some(
    (row) => row.guestId === "model-1",
  ),
  true,
);
assert.equal(locationOnlyPeople.draft?.projectDetails?.uploads?.length, 1);

// Images/documents fallback when location_details.uploads is empty / url-less.
const imagesOnlyMedia = mapApiBookingToClientRecord({
  id: "booking-img-1",
  booking_date: "2026-09-23",
  business_setup_id: "biz-1",
  customer_id: "cust-1",
  service_id: "svc-lash",
  team_member_id: "tm-1",
  start_time: "2026-09-23T10:00:00",
  end_time: "2026-09-23T10:15:00",
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
  documents: ["/uploads/bookings/x/b.pdf"],
});
assert.equal(imagesOnlyMedia.draft?.projectDetails?.description, "sadfas");
assert.equal(imagesOnlyMedia.draft?.projectDetails?.uploads?.length, 2);

// Cancelled ids must not seed the live draft (Date & Time / Service Summary).
const withCancelled = mapApiBookingToClientRecord(
  bookingWithNotes({
    services: [
      ...sharedService(null),
      ...sharedService("guest-1"),
    ],
    guests: [{ id: "guest-1", name: "Guest umer", services: sharedService("guest-1") }],
    originalServices: [
      ...sharedService(null),
      ...sharedService("guest-1"),
    ],
    cancelledServiceIds: ["svc-lash"],
    clientSnapshot: {
      people: [
        { id: "p-requester", name: "alizaCompany", isRequester: true },
        { id: "guest-1", name: "Guest umer", participantType: "guest" },
      ],
      services: [
        ...sharedService(null),
        ...sharedService("guest-1"),
      ],
    },
  }),
);
assert.equal(
  (withCancelled.draft?.services ?? []).some((row) => row.id === "svc-lash"),
  false,
);
assert.equal(
  (withCancelled.draft?.services ?? []).filter((row) => row.id === "svc-umar")
    .length,
  2,
);

console.log("clientBookingApi.mapper.test.ts: all assertions passed");
