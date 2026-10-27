/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingResponseDeadline.test.ts
 */
import assert from "node:assert/strict";
import {
  DEFAULT_RESPONSE_WINDOW_MINUTES,
  buildResponseDeadline,
  isResponseTimeConfigured,
  isResponseWindowOverdue,
  resolveEffectiveRespondByMs,
  shouldShowExpiredResponseBanner,
} from "./bookingResponseDeadline";
import { resolveProfessionalBookingActions } from "./bookingStatusActions";

assert.equal(isResponseTimeConfigured(null), false);
assert.equal(isResponseTimeConfigured({ hours: null, minutes: null }), false);
assert.equal(isResponseTimeConfigured({ hours: 0, minutes: 0 }), false);
assert.equal(isResponseTimeConfigured({ hours: 1, minutes: 0 }), true);
assert.equal(isResponseTimeConfigured({ hours: 0, minutes: 30 }), true);

const blankDeadline = buildResponseDeadline({ hours: null, minutes: null });
assert.equal(blankDeadline.responseWindowMinutes, DEFAULT_RESPONSE_WINDOW_MINUTES);
assert.equal(
  buildResponseDeadline({ hours: 0, minutes: 0 }).responseWindowMinutes,
  DEFAULT_RESPONSE_WINDOW_MINUTES,
);
assert.equal(
  buildResponseDeadline({ hours: 0, minutes: 15 }).responseWindowMinutes,
  15,
);
assert.equal(
  buildResponseDeadline({ hours: 1, minutes: 0 }).responseWindowMinutes,
  60,
);

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

assert.equal(shouldShowExpiredResponseBanner(expiredBr, blank), true);
assert.equal(shouldShowExpiredResponseBanner(expiredEbr, blank), true);
assert.equal(shouldShowExpiredResponseBanner(expiredEr, blank), true);
assert.equal(shouldShowExpiredResponseBanner(expiredBr, configured), true);
assert.equal(shouldShowExpiredResponseBanner(expiredEbr, configured), true);
assert.equal(shouldShowExpiredResponseBanner(expiredEr, configured), true);
assert.equal(
  shouldShowExpiredResponseBanner(
    {
      status: "BR Accepted",
      details: { ...overdueDetails, showPrepayment: true, prepaymentStatus: "pending" },
    },
    configured,
  ),
  true,
);
assert.equal(
  shouldShowExpiredResponseBanner(
    { status: "Confirmed", bookingScenario: undefined, details: overdueDetails },
    configured,
  ),
  false,
);
assert.equal(
  shouldShowExpiredResponseBanner(
    {
      status: "Requested",
      bookingScenario: "BR",
      details: {},
    },
    blank,
  ),
  false,
);

// Past appointment + no stamped respondBy → overdue banner (screenshot path).
assert.equal(
  shouldShowExpiredResponseBanner(
    {
      status: "Requested",
      bookingScenario: "BR",
      details: {},
      date: "2026-10-26",
      start: "09:00",
      end: "09:30",
    },
    blank,
    new Date("2026-10-27T12:00:00"),
  ),
  true,
);
// Future appointment + no stamp → no banner.
assert.equal(
  shouldShowExpiredResponseBanner(
    {
      status: "Requested",
      bookingScenario: "BR",
      details: {},
      date: "2099-10-26",
      start: "09:00",
      end: "09:30",
    },
    blank,
    new Date("2026-10-27T12:00:00"),
  ),
  false,
);
// Past appointment but Restart stamped a future respondBy → banner cleared.
assert.equal(
  shouldShowExpiredResponseBanner(
    {
      status: "Requested",
      bookingScenario: "BR",
      details: {
        responseStartedAt: "2026-10-27T12:00:00.000Z",
        respondBy: "2026-10-27T12:30:00.000Z",
        responseWindowMinutes: 30,
      },
      date: "2026-10-26",
      start: "09:00",
      end: "09:30",
    },
    blank,
    new Date("2026-10-27T12:10:00.000Z"),
  ),
  false,
);
const pastStartFlags = resolveProfessionalBookingActions(
  {
    status: "Requested",
    bookingScenario: "BR",
    details: { requestDirection: "outgoing" },
    date: "2026-10-26",
    start: "09:00",
    end: "09:30",
  },
  { responseTime: blank },
);
assert.equal(pastStartFlags.restart_response, true);

// Active stamped window: Requested BR must not show expiry banner / restart.
const activeDue = "2099-06-01T12:30:00.000Z";
assert.equal(
  shouldShowExpiredResponseBanner(
    {
      status: "Requested",
      bookingScenario: "BR",
      details: {
        responseStartedAt: "2099-06-01T12:00:00.000Z",
        respondBy: activeDue,
        responseWindowMinutes: 30,
      },
    },
    configured,
    new Date("2099-06-01T12:15:00.000Z"),
  ),
  false,
);
// Expired stamped window: banner + restart.
assert.equal(
  shouldShowExpiredResponseBanner(
    {
      status: "Requested",
      bookingScenario: "BR",
      details: {
        responseStartedAt: "2099-06-01T12:00:00.000Z",
        respondBy: activeDue,
        responseWindowMinutes: 30,
      },
    },
    configured,
    new Date("2099-06-01T12:31:00.000Z"),
  ),
  true,
);

// Frozen respondBy wins — live template must not shift the clock on reload.
const started = Date.parse("2026-01-01T12:00:00.000Z");
const frozenDue = Date.parse("2026-01-01T12:30:00.000Z");
const dynamicFields = {
  responseStartedAt: "2026-01-01T12:00:00.000Z",
  respondBy: "2026-01-01T12:30:00.000Z",
  responseWindowMinutes: 30,
  responseStatus: "overdue_response" as const,
};
const nowAt40 = new Date(started + 40 * 60_000);
assert.equal(
  resolveEffectiveRespondByMs(dynamicFields, { hours: 1, minutes: 0 }),
  frozenDue,
);
assert.equal(
  isResponseWindowOverdue(dynamicFields, nowAt40, { hours: 1, minutes: 0 }),
  true,
);
assert.equal(
  shouldShowExpiredResponseBanner(
    { status: "Requested", bookingScenario: "BR", details: dynamicFields },
    { hours: 1, minutes: 0 },
    nowAt40,
  ),
  true,
);
assert.equal(
  shouldShowExpiredResponseBanner(
    { status: "Requested", bookingScenario: "BR", details: dynamicFields },
    { hours: 0, minutes: 15 },
    nowAt40,
  ),
  true,
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

const noShow = {
  status: "No Show" as const,
  bookingScenario: undefined,
  details: {},
};
const noShowFlags = resolveProfessionalBookingActions(noShow);
assert.equal(noShowFlags.in_progress, true);
assert.equal(noShowFlags.no_show, false);
assert.equal(noShowFlags.delete, true);

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
assert.equal(staleFlags.restart_response, true);

console.log("bookingResponseDeadline.test.ts passed");
