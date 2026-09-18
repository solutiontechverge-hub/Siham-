/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingStatus.brAcceptedDisplay.test.ts
 */
import assert from "node:assert/strict";
import { resolveBookingRequestBadgeState } from "./BookingRequestBadge";
import {
  calendarBookingStatusLabel,
  professionalCalendarDisplayStatus,
  professionalCalendarStatusLabel,
  resolveBookingScenario,
} from "./bookingStatus";
import { bookingStatusLabel } from "../../../app/clients/booking/clientBookingStatus";

const brAccepted = {
  bookingType: "Online" as const,
  status: "BR Accepted" as const,
  bookingScenario: undefined,
  details: {},
};

assert.equal(calendarBookingStatusLabel(brAccepted), "Confirmed");
assert.equal(professionalCalendarStatusLabel(brAccepted), "Confirmed");
assert.equal(professionalCalendarDisplayStatus(brAccepted), "Confirmed");
assert.equal(resolveBookingScenario(brAccepted), "BR");
assert.equal(resolveBookingRequestBadgeState(brAccepted), "accepted");
assert.equal(bookingStatusLabel("br_accepted"), "Confirmed");

const waitingPrepay = {
  ...brAccepted,
  details: {
    showPrepayment: true,
    prepaymentStatus: "pending" as const,
  },
};
assert.equal(professionalCalendarStatusLabel(waitingPrepay), "Requested");
assert.equal(professionalCalendarDisplayStatus(waitingPrepay), "Requested");

console.log("bookingStatus.brAcceptedDisplay.test.ts: ok");
