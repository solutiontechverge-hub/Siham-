/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingCheckout.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  resolveOfflineBookingPrepayAction,
  resolvePostBookingPendingPayment,
  isPreBookingPrepaymentWait,
} from "./bookingCheckout";

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

console.log("bookingCheckout.test.ts passed");
