/**
 * Run with: npx --yes tsx src/app/clients/booking/clientBookingCreateUiDraft.test.ts
 */
import assert from "node:assert/strict";
import {
  shouldRestoreClientBookingCreateUiDraft,
  type ClientBookingCreateUiDraft,
} from "./clientBookingCreateUiDraft";

const base = (): ClientBookingCreateUiDraft => ({
  shopId: "shop-1",
  hydrationToken: "tok-a",
  selectedDateISO: "2026-09-16",
  selectedTime: "8:00 AM",
  combineServices: true,
  people: [{ id: "p-requester", name: "Client", isRequester: true }],
  services: [
    {
      id: "svc-1",
      name: "eyelash",
      durationMins: 11,
      price: 111,
      guestId: null,
      teamMemberId: null,
    },
  ],
  shopTeamMembers: [],
  selectedPersonId: "p-requester",
  selectedTeamMemberId: "",
  serviceTab: "unassigned",
  selectedServiceIds: {},
  bookingProjectEnabled: false,
  projectDescription: "",
  projectUploads: [],
  clientNote: "",
  desiredVisitAddress: {
    street: "",
    number: "",
    postalCode: "",
    province: "",
    municipality: "",
  },
  total: 111,
  savedAt: "2026-09-15T00:00:00.000Z",
});

assert.equal(
  shouldRestoreClientBookingCreateUiDraft({
    draft: base(),
    shopId: "shop-1",
    fromProfile: true,
    hydrationToken: "tok-a",
  }),
  true,
);

assert.equal(
  shouldRestoreClientBookingCreateUiDraft({
    draft: base(),
    shopId: "shop-1",
    fromProfile: true,
    hydrationToken: "tok-b",
  }),
  false,
  "new Book Now token must supersede",
);

assert.equal(
  shouldRestoreClientBookingCreateUiDraft({
    draft: base(),
    shopId: "other-shop",
    fromProfile: false,
    hydrationToken: "",
  }),
  false,
);

console.log("clientBookingCreateUiDraft.test.ts: all assertions passed");
