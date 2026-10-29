/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingEventDetails.guestScope.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  filterMainClientAssignedLines,
  hydrateBookingDrawerFromEvent,
  isMainClientAssignedLine,
  mainDrawerServicesFromClientSnapshot,
  resolveEventKilometerAllowance,
  resolveKilometerAllowanceAmount,
} from "./bookingEventDetails";

const requesterIds = new Set(["p-requester"]);

assert.equal(isMainClientAssignedLine(null, requesterIds), true);
assert.equal(isMainClientAssignedLine("", requesterIds), true);
assert.equal(isMainClientAssignedLine("p-requester", requesterIds), true);
assert.equal(isMainClientAssignedLine("guest-1", requesterIds), false);

const mixed = [
  { id: "svc-main", name: "Main cut", guestId: null },
  { id: "svc-lash", name: "eyelash", guestId: "guest-1" },
];
assert.deepEqual(
  filterMainClientAssignedLines(mixed, requesterIds).map((row) => row.id),
  ["svc-main"],
);

const event: CalendarEvent = {
  id: "b-1",
  resourceId: "r-1",
  date: "2026-09-04",
  start: "09:00",
  end: "09:30",
  title: "Booking",
  status: "Confirmed",
  location: "FL",
  bookingType: "Offline",
  showClientName: "aliza",
  details: {
    clientEmail: "alizaclient@yopmail.com",
    services: [
      {
        id: "svc-umer",
        name: "Muhammad umer arshad",
        price: 11,
        durationMins: 60,
        guestId: null,
      },
      {
        id: "svc-lash",
        name: "eyelash",
        price: 111,
        durationMins: 11,
        guestId: "guest-1",
      },
    ],
    products: [
      {
        id: "unique-fdg",
        name: "fdg",
        price: 42,
        quantity: 1,
        unitPrice: 42,
        guestId: null,
      },
      {
        id: "prod-guest",
        name: "Guest product",
        price: 5,
        quantity: 1,
        unitPrice: 5,
        guestId: "guest-1",
      },
    ],
    guests: [
      {
        id: "guest-1",
        name: "Muhammad umer arshad",
        services: [
          {
            id: "svc-lash",
            name: "eyelash",
            price: 111,
            durationMins: 11,
            guestId: "guest-1",
          },
        ],
        products: [
          {
            id: "prod-guest",
            name: "Guest product",
            price: 5,
            quantity: 1,
            unitPrice: 5,
            guestId: "guest-1",
          },
        ],
        participantType: "guest",
      },
    ],
    clientSnapshot: {
      people: [
        { id: "p-requester", name: "aliza", isRequester: true },
        { id: "guest-1", name: "Muhammad umer arshad", isRequester: false, participantType: "guest" },
      ],
    },
  },
};

const hydration = hydrateBookingDrawerFromEvent(event);
assert.deepEqual(
  hydration.services.map((service) => service.name),
  ["Muhammad umer arshad"],
);
assert.deepEqual(
  hydration.products.map((product) => product.name),
  ["fdg"],
);
assert.equal(hydration.guests.length, 1);
assert.deepEqual(
  hydration.guests[0]?.services.map((service) => service.name),
  ["eyelash"],
);
assert.deepEqual(
  (hydration.guests[0]?.products ?? []).map((product) => product.name),
  ["Guest product"],
);

const planningEvent: CalendarEvent = {
  ...event,
  details: {
    ...event.details,
    guests: event.details?.guests,
    clientSnapshot: {
      people: [
        ...(event.details?.clientSnapshot?.people ?? []),
        {
          id: "p-planning",
          name: "Planning",
          isRequester: false,
          participantType: "planning",
          planningActivity: "Prep",
          planningDuration: "30 mins",
          planningStartTime: "10:00 AM",
          planningEndTime: "10:30 AM",
        },
      ],
    },
  },
};

const planningHydration = hydrateBookingDrawerFromEvent(planningEvent);
assert.equal(planningHydration.guests.length, 2);
assert.equal(
  planningHydration.guests.some((guest) => guest.participantType === "planning"),
  true,
);

const companyEvent: CalendarEvent = {
  ...event,
  details: {
    ...event.details,
    services: [
      {
        id: "svc-company",
        name: "Company cut",
        price: 50,
        durationMins: 30,
        guestId: "contact-1",
        originalPrice: 70,
        discount: { type: "fixed", amount: 20 },
      },
      {
        id: "svc-model",
        name: "Model style",
        price: 11,
        durationMins: 60,
        guestId: "model-1",
      },
    ],
    products: [
      {
        id: "prod-company",
        name: "Kit",
        price: 2,
        quantity: 1,
        unitPrice: 22,
        originalPrice: 22,
        discount: { type: "fixed", amount: 20 },
        guestId: "contact-1",
      },
    ],
    guests: [
      {
        id: "model-1",
        name: "ali",
        services: [
          {
            id: "svc-model",
            name: "Model style",
            price: 11,
            durationMins: 60,
            guestId: "model-1",
          },
        ],
        products: [],
        participantType: "model",
      },
    ],
    clientSnapshot: {
      people: [
        { id: "p-requester", name: "Company Legal", isRequester: true },
        { id: "contact-1", name: "Contact Person" },
        { id: "model-1", name: "ali", isRequester: false, participantType: "model" },
      ],
    },
  },
};

const companyHydration = hydrateBookingDrawerFromEvent(companyEvent);
assert.deepEqual(
  companyHydration.services.map((service) => service.name),
  ["Company cut"],
);
assert.deepEqual(
  companyHydration.products.map((product) => product.name),
  ["Kit"],
);
assert.equal(companyHydration.guests.length, 1);
assert.equal(companyHydration.guests[0]?.name, "ali");
assert.equal(companyHydration.services[0]?.originalPrice, 70);

const sharedCatalogSnapshot = {
  people: [
    { id: "p-requester", name: "alizaCompany", isRequester: true as const },
    { id: "model-1", name: "ali", isRequester: false as const, participantType: "model" as const },
  ],
  services: [
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      guestId: null,
    },
    {
      id: "svc-umar",
      name: "Muhammad umer arshad",
      price: 11,
      durationMins: 60,
      guestId: "model-1",
    },
  ],
};
const snapshotMain = mainDrawerServicesFromClientSnapshot(sharedCatalogSnapshot);
assert.equal(snapshotMain?.length, 1);
assert.equal(snapshotMain?.[0]?.id, "svc-umar");
assert.equal(snapshotMain?.[0]?.guestId ?? null, null);

const eurPerKm = "12";
const totalKilometer = "11";
const expectedKmAmount = resolveKilometerAllowanceAmount({
  eurPerKm,
  totalKilometer,
});
assert.equal(expectedKmAmount, 12 * 11);

const kmNotes = `---mollure-meta---\n${JSON.stringify({
  showKilometerAllowance: true,
  kilometerAllowance: { eurPerKm, totalKilometer },
})}`;
const kmFromNotes = resolveEventKilometerAllowance(
  { showKilometerAllowance: true, kilometerAllowance: { eurPerKm: "", totalKilometer: "" } },
  kmNotes,
);
assert.equal(kmFromNotes.kilometerAllowance.eurPerKm, eurPerKm);
assert.equal(kmFromNotes.kilometerAllowance.totalKilometer, totalKilometer);
assert.equal(
  resolveKilometerAllowanceAmount(kmFromNotes.kilometerAllowance),
  expectedKmAmount,
);

const kmEvent: CalendarEvent = {
  id: "b-km",
  resourceId: "r-1",
  date: "2026-09-08",
  start: "09:00",
  end: "10:00",
  title: "Booking",
  status: "Requested",
  location: "DL",
  bookingType: "Online",
  notes: kmNotes,
  details: {
    clientEmail: "alizacc@yopmail.com",
    services: [],
    showKilometerAllowance: true,
  },
};
const kmHydration = hydrateBookingDrawerFromEvent(kmEvent);
assert.equal(kmHydration.kilometerAllowance.eurPerKm, eurPerKm);
assert.equal(kmHydration.kilometerAllowance.totalKilometer, totalKilometer);
assert.equal(kmHydration.showKilometerAllowance, true);
assert.equal(
  resolveKilometerAllowanceAmount(kmHydration.kilometerAllowance),
  expectedKmAmount,
);

console.log("bookingEventDetails.guestScope.test.ts: all assertions passed");
