/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingResponseStatus.test.ts
 */
import assert from "node:assert/strict";
import { resolveBookingPaymentIconStatus, resolveBookingResponseIndicators } from "./bookingResponseStatus";

const base = {
  id: "b1",
  bookingScenario: "BR" as const,
  status: "Requested" as const,
  date: "2099-06-01",
  start: "10:00",
  details: {
    responseStartedAt: new Date().toISOString(),
    respondBy: new Date(Date.now() + 60 * 60_000).toISOString(),
    responseWindowMinutes: 60,
  },
};

const waiting = resolveBookingResponseIndicators(base);
assert.ok(
  waiting.includes("response_time_active"),
  "active window → response_time_active (alarm)",
);
assert.ok(
  !waiting.includes("overdue_response"),
  "active window must not use overdue triangle",
);

const overdue = resolveBookingResponseIndicators({
  ...base,
  details: {
    responseStartedAt: "2020-01-01T00:00:00.000Z",
    respondBy: "2020-01-01T01:00:00.000Z",
    responseWindowMinutes: 60,
  },
});
assert.ok(
  overdue.includes("overdue_response"),
  "expired window → overdue_response (triangle)",
);
assert.ok(
  !overdue.includes("response_time_active"),
  "expired window must not use waiting alarm",
);

// Same gate as expiry banner: past slot + no respondBy → overdue_response.
const pastSlotNoDeadline = resolveBookingResponseIndicators({
  ...base,
  date: "2020-01-01",
  start: "10:00",
  details: {},
});
assert.ok(
  pastSlotNoDeadline.includes("overdue_response"),
  "past slot without respondBy → overdue (banner parity)",
);
assert.ok(
  !pastSlotNoDeadline.includes("response_time_active"),
  "past slot without respondBy must not show waiting alarm",
);

const completedKeepsBrScenario = resolveBookingResponseIndicators({
  ...base,
  status: "Completed" as const,
  bookingScenario: "BR" as const,
});
assert.ok(
  !completedKeepsBrScenario.includes("response_time_active"),
  "Completed must not show waiting-for-response even if scenario is still BR",
);
assert.ok(
  !completedKeepsBrScenario.includes("overdue_response"),
  "Completed must not show overdue-response",
);

const confirmedBr = resolveBookingResponseIndicators({
  ...base,
  status: "Confirmed" as const,
  bookingScenario: "BR" as const,
});
assert.ok(
  !confirmedBr.includes("response_time_active"),
  "Confirmed (accepted) BR must not show waiting-for-response",
);

const pendingEr = resolveBookingResponseIndicators({
  ...base,
  status: "Confirmed" as const,
  bookingScenario: "ER" as const,
});
assert.ok(
  pendingEr.includes("response_time_active"),
  "Confirmed + ER still awaiting accept → waiting-for-response",
);

const completedPayment = {
  ...base,
  status: "Completed" as const,
  details: {
    showPrepayment: true,
    prepaymentStatus: "confirmed" as const,
    prepaymentPercent: "50",
    services: [{ id: "s1", name: "Cut", price: 140.8, durationMins: 30 }],
  },
};
const completedPaidInFull = {
  ...completedPayment,
  details: {
    ...completedPayment.details,
    prepaymentPercent: "100",
    services: [{ id: "s1", name: "Cut", price: 100, durationMins: 30 }],
  },
};
for (const payment_status of [undefined, "Pending", "Unpaid", "Prepaid"]) {
  const event = {
    ...completedPayment,
    notes: `---mollure-meta---\n${JSON.stringify({ financials: { payment_status, outstanding_balance: 70.4 } })}`,
  };
  assert.equal(resolveBookingPaymentIconStatus(event), "pending", "a deposit or completed appointment cannot confirm full payment");
  const indicators = resolveBookingResponseIndicators(event);
  assert.ok(indicators.includes("waiting_for_payment"));
  assert.ok(!indicators.includes("prepaid"), "no green currency tick while remaining payment is pending");
}
for (const payment_status of ["Paid", "Completed"]) {
  const event = {
    ...completedPaidInFull,
    notes: `---mollure-meta---\n${JSON.stringify({ financials: { payment_status, outstanding_balance: 0 } })}`,
  };
  assert.equal(resolveBookingPaymentIconStatus(event), "confirmed");
  assert.ok(resolveBookingResponseIndicators(event).includes("prepaid"));
  assert.ok(!resolveBookingResponseIndicators(event).includes("waiting_for_payment"));
}

const splitAfterTreatmentPending = resolveBookingResponseIndicators({
  id: "booking-1",
  bookingScenario: "E" as const,
  status: "Completed" as const,
  date: "2099-06-01",
  start: "10:00",
  details: {
    showPrepayment: true,
    prepaymentStatus: "confirmed",
    prepaymentPercent: "50",
    services: [{ id: "s1", name: "Cut", price: 100, durationMins: 30 }],
    splitBill: {
      mode: "split",
      prepaidAmount: 0,
      payers: [
        {
          key: "main",
          role: "main_client",
          label: "Ada",
          displayName: "Ada",
          subtotal: 60,
          paymentAmount: 60,
          lineIds: ["s1"],
          paid: true,
        },
        {
          key: "g1",
          role: "guest",
          label: "Guest",
          displayName: "Bea",
          subtotal: 40,
          paymentAmount: 40,
          lineIds: ["s2"],
          paid: false,
        },
      ],
    },
  },
});
assert.ok(
  splitAfterTreatmentPending.includes("waiting_for_payment"),
  "split guest unpaid → pending payment icon",
);
assert.ok(
  !splitAfterTreatmentPending.includes("prepaid"),
  "prepay confirmed must not show paid tick while after-treatment balance pending",
);

console.log("bookingResponseStatus.test.ts: ok");
