/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingAcknowledgment.erPersist.test.ts
 */
import assert from "node:assert/strict";
import {
  buildEditRequestAckDetails,
  clearBookingAckDetails,
} from "./bookingAcknowledgment";
import { resolveBookingScenario } from "./bookingStatus";

const afterAccept = buildEditRequestAckDetails({
  initiatedBy: "client",
  editRequestStatus: "approved",
  base: { internalNote: "note" },
});

assert.equal(afterAccept.needsOk, true);
assert.equal(afterAccept.ackRecipient, "client");
assert.equal(afterAccept.ackScenario, "ER");
assert.equal(afterAccept.editRequestStatus, "approved");

const eventAfterAccept = {
  bookingType: "Online" as const,
  status: "Confirmed" as const,
  bookingScenario: undefined,
  details: afterAccept,
};
assert.equal(resolveBookingScenario(eventAfterAccept), "ER");

const afterReject = buildEditRequestAckDetails({
  initiatedBy: "professional",
  editRequestStatus: "rejected",
});
assert.equal(afterReject.ackScenario, "ER");
assert.equal(
  resolveBookingScenario({
    bookingType: "Online",
    status: "Confirmed",
    bookingScenario: undefined,
    details: afterReject,
  }),
  "ER",
);

const cleared = clearBookingAckDetails(afterAccept);
assert.equal(cleared.needsOk, undefined);
assert.equal(cleared.ackScenario, undefined);
assert.equal(cleared.editRequestStatus, undefined);
assert.equal(
  resolveBookingScenario({
    bookingType: "Online",
    status: "Confirmed",
    bookingScenario: undefined,
    details: cleared,
  }),
  undefined,
);

// Confirmed Edited (E) still resolves when scenario is E.
assert.equal(
  resolveBookingScenario({
    bookingType: "Online",
    status: "Confirmed",
    bookingScenario: "E",
    details: {},
  }),
  "E",
);

console.log("bookingAcknowledgment.erPersist.test.ts: ok");
