/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingCheckout.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  afterTreatmentSubCardId,
  canEnablePersistentBookingCheckout,
  resolveCheckoutLateRescheduleFee,
  resolveOfflineBookingPrepayAction,
  resolvePostBookingPendingPayment,
  resolveSalesCheckoutPaymentOptions,
  shouldAutoOpenBookingCheckout,
  isPreBookingPrepaymentWait,
} from "./bookingCheckout";
import { upsertSalesCardMeta } from "./salesOverview.storage";

const onlineSave = resolveOfflineBookingPrepayAction({
  isNewBooking: true,
  isOfflineBooking: true,
  showPrepayment: true,
  prepaymentAmount: 40,
  paymentMethod: "online",
});
assert.equal(onlineSave?.label, "Save");
assert.equal(onlineSave?.status, "Requested");
assert.equal(onlineSave?.reopen, true);
assert.equal(onlineSave?.confirmPrepayment, false);

const offlineSave = resolveOfflineBookingPrepayAction({
  isNewBooking: true,
  isOfflineBooking: true,
  showPrepayment: true,
  prepaymentAmount: 40,
  paymentMethod: "offline",
});
assert.equal(offlineSave?.label, "Save");
assert.equal(offlineSave?.status, "Confirmed");
assert.equal(offlineSave?.confirmPrepayment, true);

assert.equal(
  resolveOfflineBookingPrepayAction({
    isNewBooking: true,
    isOfflineBooking: true,
    showPrepayment: false,
    prepaymentAmount: 0,
    paymentMethod: "offline",
  }),
  null,
);

const requestedEvent = {
  id: "booking-1",
  resourceId: "r1",
  date: "2026-09-04",
  start: "10:00",
  end: "11:00",
  title: "Cut",
  status: "Requested",
  location: "FL",
  details: { showPrepayment: true, prepaymentStatus: "pending" },
} as unknown as CalendarEvent;

assert.equal(isPreBookingPrepaymentWait(requestedEvent), true);
assert.equal(resolvePostBookingPendingPayment(requestedEvent), null);

const inProgress = {
  ...requestedEvent,
  status: "In Progress",
  details: {
    showPrepayment: true,
    prepaymentStatus: "confirmed",
    prepaymentPercent: 0,
    services: [{ id: "s1", name: "Cut", price: 80, durationMins: 30 }],
    waitingForPayment: false,
  },
} as unknown as CalendarEvent;

const pending = resolvePostBookingPendingPayment(inProgress);
assert.equal(pending?.count, 1);
assert.equal(pending?.label, "One payment pending");

const splitEvent = {
  ...inProgress,
  details: {
    ...inProgress.details,
    splitBill: {
      mode: "split",
      prepaidAmount: 0,
      payers: [
        {
          key: "main",
          role: "main_client",
          label: "Ada",
          displayName: "Ada",
          subtotal: 50,
          paymentAmount: 50,
          lineIds: ["s1"],
          paid: true,
        },
        {
          key: "g1",
          role: "guest",
          label: "Guest",
          displayName: "Bea",
          subtotal: 30,
          paymentAmount: 30,
          lineIds: ["s2"],
          paid: false,
        },
      ],
    },
  },
} as unknown as CalendarEvent;

const splitPending = resolvePostBookingPendingPayment(splitEvent);
assert.equal(splitPending?.count, 1);
assert.equal(splitPending?.focusCardId, "booking-1-after-treatment-sub-g1");

assert.equal(
  canEnablePersistentBookingCheckout(splitEvent),
  true,
  "Unpaid guest without sales meta → pro may still checkout",
);

upsertSalesCardMeta({
  bookingId: "booking-1",
  cardKind: "after_treatment",
  cardId: afterTreatmentSubCardId("booking-1", "g1"),
  paymentMethod: "onlineDirect",
  paid: false,
  totalPrice: 30,
});
assert.equal(
  canEnablePersistentBookingCheckout(splitEvent),
  false,
  "After checkout issued guest Pay Now → hide/disable drawer Checkout",
);
assert.equal(
  resolvePostBookingPendingPayment(splitEvent)?.count,
  1,
  "Pending payment indicator unchanged for Sales/client",
);

const settledSplit = {
  ...inProgress,
  status: "Completed",
  details: {
    ...inProgress.details,
    waitingForPayment: false,
    services: [{ id: "s1", name: "Cut", price: 80, durationMins: 30 }],
    splitBill: {
      mode: "single",
      prepaidAmount: 0,
      payers: [
        {
          key: "main",
          role: "main_client",
          label: "Ada",
          displayName: "Ada",
          subtotal: 80,
          paymentAmount: 80,
          lineIds: ["s1"],
          paid: true,
        },
      ],
    },
  },
} as unknown as CalendarEvent;
assert.equal(
  resolvePostBookingPendingPayment(settledSplit),
  null,
  "Settled splitBill must not fall through to service remaining",
);
assert.equal(
  shouldAutoOpenBookingCheckout(settledSplit, new Date(2026, 9, 28, 12, 0)),
  false,
  "Settled checkout → no auto-open",
);

const completedUnpaid = {
  ...inProgress,
  status: "Completed",
  date: "2026-10-28",
  start: "09:00",
  end: "11:00",
} as unknown as CalendarEvent;
assert.equal(
  shouldAutoOpenBookingCheckout(
    completedUnpaid,
    new Date(2026, 9, 28, 12, 0),
  ),
  true,
  "Completed unpaid → auto-open",
);

const confirmedPastEnd = {
  ...inProgress,
  status: "Confirmed",
  date: "2026-10-28",
  start: "09:00",
  end: "11:00",
} as unknown as CalendarEvent;
assert.equal(
  shouldAutoOpenBookingCheckout(
    confirmedPastEnd,
    new Date(2026, 9, 28, 12, 0),
  ),
  true,
  "Confirmed past end unpaid → auto-open",
);
assert.equal(
  shouldAutoOpenBookingCheckout(
    confirmedPastEnd,
    new Date(2026, 9, 28, 10, 0),
  ),
  false,
  "Confirmed mid window (In Progress) → no auto-open",
);

const paidCompleted = {
  ...completedUnpaid,
  details: {
    ...completedUnpaid.details,
    waitingForPayment: false,
    services: [{ id: "s1", name: "Cut", price: 0, durationMins: 30 }],
    showPrepayment: false,
    prepaymentPercent: 0,
  },
} as unknown as CalendarEvent;
assert.equal(
  shouldAutoOpenBookingCheckout(paidCompleted, new Date(2026, 9, 28, 12, 0)),
  false,
  "Completed with nothing due → no auto-open",
);

const invoiceIssuedCompleted = {
  ...completedUnpaid,
  details: {
    ...completedUnpaid.details,
    waitingForPayment: true,
    invoiceDueDate: "2026-11-05",
  },
} as unknown as CalendarEvent;
assert.equal(
  resolvePostBookingPendingPayment(invoiceIssuedCompleted),
  null,
  "Invoice issued → not checkout-pending",
);
assert.equal(
  shouldAutoOpenBookingCheckout(
    invoiceIssuedCompleted,
    new Date(2026, 9, 28, 12, 0),
  ),
  false,
  "Invoice issued Completed → no auto-open Checkout",
);

assert.deepEqual(
  resolveSalesCheckoutPaymentOptions("individual").map((o) => o.id),
  ["onlineDirect", "offlineDirect"],
);
assert.equal(resolveSalesCheckoutPaymentOptions("company").length, 4);

assert.equal(
  resolveCheckoutLateRescheduleFee({
    event: { details: { showLateRescheduling: false, lateRescheduleFeePercent: "10" } },
    baseAmount: 200,
  }),
  null,
  "flag off → no late fee",
);

const lateFee = resolveCheckoutLateRescheduleFee({
  event: {
    details: {
      showLateRescheduling: true,
      lateRescheduleFeePercent: "10",
    },
  },
  baseAmount: 200,
});
assert.equal(lateFee?.amount, 20);
assert.equal(lateFee?.percent, 10);
assert.match(String(lateFee?.label ?? ""), /Late Rescheduling Fee \(10% Of €200\)/i);

console.log("bookingCheckout.test.ts passed");
