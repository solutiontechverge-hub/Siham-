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

assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "DL",
    projectEnabled: false,
    extraGuestCount: 0,
  }),
  ["model", "buffer"],
);

assert.deepEqual(
  resolveBookingDrawerParticipantKinds({
    location: "DL",
    projectEnabled: true,
    extraGuestCount: 2,
  }),
  ["model", "planning", "buffer"],
);

console.log("bookingDrawerParticipantKinds.test.ts passed");
