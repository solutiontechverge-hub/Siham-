/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingDrawerParticipantKinds.test.ts
 */
import assert from "node:assert/strict";
import { resolveBookingDrawerParticipantKinds } from "./bookingDrawerParticipantKinds";

assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "FL",
    projectEnabled: false,
    extraGuestCount: 0,
  }),
  ["guest"],
);

assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "FL",
    projectEnabled: true,
    extraGuestCount: 0,
  }),
  ["guest"],
);

assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "FL",
    projectEnabled: false,
    extraGuestCount: 1,
  }),
  [],
);

// DL + BC, Project off → Add Guest (+ Buffer), never Model.
assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "DL",
    projectEnabled: false,
    isCompanyClient: true,
    extraGuestCount: 0,
  }),
  ["guest", "buffer"],
);

// DL + IC: always Guest (+ Buffer); Project checkbox does not appear.
assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "DL",
    projectEnabled: true,
    isCompanyClient: false,
    extraGuestCount: 0,
  }),
  ["guest", "buffer"],
);

// DL + BC, Project on → Add Model + Add Planning (+ Buffer).
assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "DL",
    projectEnabled: true,
    isCompanyClient: true,
    extraGuestCount: 2,
  }),
  ["model", "planning", "buffer"],
);

assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "FL",
    projectEnabled: false,
    extraGuestCount: 0,
    primaryClientIsGuest: true,
  }),
  [],
);

assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "DL",
    projectEnabled: false,
    isCompanyClient: true,
    extraGuestCount: 0,
    primaryClientIsGuest: true,
  }),
  ["buffer"],
);

console.log("bookingDrawerParticipantKinds.test.ts passed");
