/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingResponseDeadline.test.ts
 */
import assert from "node:assert/strict";
import {
  buildResponseDeadline,
  isResponseTimeConfigured,
  shouldShowExpiredResponseBanner,
} from "./bookingResponseDeadline";
import { resolveProfessionalBookingActions } from "./bookingStatusActions";

assert.equal(isResponseTimeConfigured(null), false);
assert.equal(isResponseTimeConfigured({ hours: null, minutes: null }), false);
assert.equal(isResponseTimeConfigured({ hours: 0, minutes: 0 }), false);
assert.equal(isResponseTimeConfigured({ hours: 1, minutes: 0 }), true);
assert.equal(isResponseTimeConfigured({ hours: 0, minutes: 30 }), true);

assert.equal(buildResponseDeadline({ hours: null, minutes: null }), null);
assert.equal(buildResponseDeadline({ hours: 0, minutes: 0 }), null);
assert.ok(buildResponseDeadline({ hours: 0, minutes: 30 }));

const overdueDetails = {
  responseStatus: "overdue_response" as const,
  respondBy: "2020-01-01T00:00:00.000Z",
  responseWindowMinutes: 30,
};

const expiredBr = {
  status: "Requested",
  bookingScenario: "BR",
  details: overdueDetails,
};
const expiredEbr = {
  status: "Requested",
  bookingScenario: "EBR",
  details: overdueDetails,
};
const expiredEr = {
  status: "Confirmed",
  bookingScenario: "ER",
  details: overdueDetails,
};

const configured = { hours: 0, minutes: 30 };
const blank = { hours: null, minutes: null };

assert.equal(shouldShowExpiredResponseBanner(expiredBr, blank), false);
assert.equal(shouldShowExpiredResponseBanner(expiredEbr, blank), false);
assert.equal(shouldShowExpiredResponseBanner(expiredEr, blank), false);
assert.equal(shouldShowExpiredResponseBanner(expiredBr, configured), true);
assert.equal(shouldShowExpiredResponseBanner(expiredEbr, configured), true);
assert.equal(shouldShowExpiredResponseBanner(expiredEr, configured), true);
assert.equal(
  shouldShowExpiredResponseBanner(
    { status: "Confirmed", bookingScenario: undefined, details: overdueDetails },
    configured,
  ),
  false,
);

const outgoingBr = {
  status: "Requested" as const,
  bookingScenario: "BR" as const,
  details: { requestDirection: "outgoing" as const },
};
const outgoingFlags = resolveProfessionalBookingActions(outgoingBr);
assert.equal(outgoingFlags.edit, true);
assert.equal(outgoingFlags.discard, true);
assert.equal(outgoingFlags.cancel, false);

const confirmed = {
  status: "Confirmed" as const,
  bookingScenario: undefined,
  details: {},
};
const confirmedFlags = resolveProfessionalBookingActions(confirmed);
assert.equal(confirmedFlags.edit, true);
assert.equal(confirmedFlags.cancel, true);
assert.equal(confirmedFlags.discard, false);

const confirmedEr = {
  status: "Confirmed" as const,
  bookingScenario: "ER" as const,
  details: { requestDirection: "outgoing" as const },
};
const erFlags = resolveProfessionalBookingActions(confirmedEr);
assert.equal(erFlags.edit, true);
assert.equal(erFlags.cancel, false);
assert.equal(erFlags.discard, true);
assert.equal(erFlags.in_progress, false);

const staleOverdueIncoming = {
  status: "Requested" as const,
  bookingScenario: "BR" as const,
  details: {
    requestDirection: "incoming" as const,
    responseStatus: "overdue_response" as const,
  },
};
const staleFlags = resolveProfessionalBookingActions(staleOverdueIncoming, {
  responseTime: blank,
});
assert.equal(staleFlags.restart_response, false);

console.log("bookingResponseDeadline.test.ts passed");
