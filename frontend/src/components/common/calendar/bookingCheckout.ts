import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { isOfflinePaymentMethod } from "../client-booking/checkoutPaymentOptions";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import {
  parseSplitBillState,
  unpaidSplitPayers,
} from "./salesSplitBill";

export type OfflineBookingPrepayAction = {
  label: "Save";
  status: "Requested" | "Confirmed";
  reopen: boolean;
  confirmPrepayment: boolean;
};

/** New offline (walk-in / non-Mollure) booking with prepayment — footer always "Save". */
export function resolveOfflineBookingPrepayAction(input: {
  isNewBooking: boolean;
  isOfflineBooking: boolean;
  showPrepayment: boolean;
  prepaymentAmount: number;
  paymentMethod: "online" | "offline" | string | null | undefined;
}): OfflineBookingPrepayAction | null {
  if (!input.isNewBooking || !input.isOfflineBooking) return null;
  if (!input.showPrepayment || !(Number(input.prepaymentAmount) > 0)) return null;

  if (isOfflinePaymentMethod(input.paymentMethod)) {
    return {
      label: "Save",
      status: "Confirmed",
      reopen: true,
      confirmPrepayment: true,
    };
  }

  return {
    label: "Save",
    status: "Requested",
    reopen: true,
    confirmPrepayment: false,
  };
}

export function isPreBookingPrepaymentWait(event: Pick<
  CalendarEvent,
  "status" | "details"
> | null | undefined): boolean {
  if (!event) return false;
  if (event.status !== "Requested" && event.status !== "Confirmed") return false;
  if (!event.details?.showPrepayment) return false;
  if (event.details.prepaymentStatus === "confirmed") return false;
  return true;
}

export function afterTreatmentCardId(bookingId: string) {
  return `${bookingId}-after-treatment`;
}

export function afterTreatmentSubCardId(bookingId: string, payerKey: string) {
  return `${bookingId}-after-treatment-sub-${payerKey}`;
}

export type PostBookingPendingPayment = {
  count: number;
  label: string;
  focusCardId: string;
};

function remainingFromEvent(event: Pick<CalendarEvent, "details">): number {
  const details = event.details;
  if (!details) return 0;
  const percent = Number(details.prepaymentPercent) || 0;
  const snapshotServices = details.clientSnapshot?.services ?? [];
  const serviceSource = snapshotServices.length
    ? snapshotServices
    : details.services ?? [];
  const serviceTotal = serviceSource.reduce(
    (sum, service) => sum + (Number(service.price) || 0),
    0,
  );
  const productTotal = (details.products ?? []).reduce(
    (sum, product) => sum + (Number(product.price) || 0) * (product.quantity || 1),
    0,
  );
  const guestTotal = snapshotServices.length
    ? 0
    : (details.guests ?? []).reduce((sum, guest) => {
        const services = (guest.services ?? []).reduce(
          (inner, service) => inner + (Number(service.price) || 0),
          0,
        );
        const products = (guest.products ?? []).reduce(
          (inner, product) =>
            inner + (Number(product.price) || 0) * (product.quantity || 1),
          0,
        );
        return sum + services + products;
      }, 0);
  const total = serviceTotal + productTotal + guestTotal;
  const prepaid =
    details.showPrepayment &&
    details.prepaymentStatus === "confirmed" &&
    percent > 0
      ? Math.round(((total * percent) / 100 + Number.EPSILON) * 100) / 100
      : 0;
  return Math.max(0, Math.round((total - prepaid + Number.EPSILON) * 100) / 100);
}

/**
 * Post-booking (In Progress / Completed) unpaid shares — banner + Sales focus.
 * Pre-booking prepayment wait is excluded on purpose (icon only).
 */
export function resolvePostBookingPendingPayment(
  event: CalendarEvent | null | undefined,
): PostBookingPendingPayment | null {
  if (!event) return null;
  if (event.status !== "In Progress" && event.status !== "Completed") return null;
  if (event.details?.refunded) return null;

  const bookingId = parseApiCalendarEventId(event.id)?.id ?? event.id;
  const split = parseSplitBillState(event.details?.splitBill);
  const unpaid = unpaidSplitPayers(split);

  if (unpaid.length) {
    const first = unpaid[0];
    const focusCardId =
      split?.mode === "single" || first.role === "main_client"
        ? afterTreatmentCardId(bookingId)
        : afterTreatmentSubCardId(bookingId, first.key);
    return {
      count: unpaid.length,
      label:
        unpaid.length === 1
          ? "One payment pending"
          : `${unpaid.length} payments pending`,
      focusCardId,
    };
  }

  if (event.details?.waitingForPayment) {
    return {
      count: 1,
      label: "One payment pending",
      focusCardId: afterTreatmentCardId(bookingId),
    };
  }

  if (event.status === "In Progress") {
    const remaining = remainingFromEvent(event);
    if (remaining > 0) {
      return {
        count: 1,
        label: "One payment pending",
        focusCardId: afterTreatmentCardId(bookingId),
      };
    }
  }

  return null;
}
