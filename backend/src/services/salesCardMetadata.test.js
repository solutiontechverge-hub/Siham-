/**
 * Run with: node src/services/salesCardMetadata.test.js
 */
import assert from "node:assert/strict";
import {
  resolveSalesCardId,
  salesCardKindForPaymentPhase,
} from "./finance-sync.service.js";

assert.equal(salesCardKindForPaymentPhase("prepay"), "prepayment");
assert.equal(salesCardKindForPaymentPhase("full"), "after_treatment");
assert.equal(salesCardKindForPaymentPhase("addon"), "addon");
assert.equal(salesCardKindForPaymentPhase(null), null);

const bookingId = "11111111-1111-1111-1111-111111111111";

assert.equal(
  resolveSalesCardId({ bookingId, paymentPhase: "prepay" }),
  `${bookingId}-prepayment`,
);
assert.equal(
  resolveSalesCardId({
    bookingId,
    paymentPhase: "full",
    payerKey: "main-client",
    payerRole: "main_client",
  }),
  `${bookingId}-after-treatment`,
);
assert.equal(
  resolveSalesCardId({
    bookingId,
    paymentPhase: "full",
    payerKey: "g1",
    payerRole: "guest",
  }),
  `${bookingId}-after-treatment-sub-g1`,
);
assert.equal(
  resolveSalesCardId({
    bookingId,
    paymentPhase: "full",
    entryLabel: "Late Cancellation Booking Fee",
  }),
  `late-cancellation-${bookingId}`,
);
assert.equal(
  resolveSalesCardId({
    bookingId,
    paymentPhase: "full",
    entryLabel: "No-show fee",
  }),
  `no-show-${bookingId}`,
);
assert.equal(
  resolveSalesCardId({
    bookingId,
    paymentPhase: "full",
    entryLabel: "Late Rescheduling Fee",
  }),
  `late-reschedule-${bookingId}`,
);
assert.equal(resolveSalesCardId({ bookingId: "", paymentPhase: "full" }), null);
assert.equal(resolveSalesCardId({ bookingId, paymentPhase: "addon" }), null);

console.log("salesCardMetadata.test.js: ok");
