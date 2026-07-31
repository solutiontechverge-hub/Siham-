import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import {
  canDiscardEbr,
  canRespondToIncomingRequest,
  isOutgoingBookingRequest,
} from "./bookingRequestNegotiation";
import { canDiscardBookingRequest } from "./bookingStatus";

export type ProfessionalBookingAction =
  | "edit"
  | "discard"
  | "accept"
  | "suggest_change"
  | "reject"
  | "cancel"
  | "in_progress"
  | "no_show"
  | "checkout"
  | "delete"
  | "rebook"
  | "refund"
  | "ok";

export type ClientBookingAction =
  | "edit"
  | "discard"
  | "accept"
  | "suggest_change"
  | "reject"
  | "cancel"
  | "delete";

export type ProfessionalActionFlags = Record<ProfessionalBookingAction, boolean>;
export type ClientActionFlags = Record<ClientBookingAction, boolean>;

const falseProfessionalFlags = (): ProfessionalActionFlags => ({
  edit: false,
  discard: false,
  accept: false,
  suggest_change: false,
  reject: false,
  cancel: false,
  in_progress: false,
  no_show: false,
  checkout: false,
  delete: false,
  rebook: false,
  refund: false,
  ok: false,
});

const falseClientFlags = (): ClientActionFlags => ({
  edit: false,
  discard: false,
  accept: false,
  suggest_change: false,
  reject: false,
  cancel: false,
  delete: false,
});

/** Refund shows only when prepaid money may need returning. */
export function isRefundApplicable(input: {
  status: CalendarEvent["status"] | ClientBookingStatus | string;
  prepaid?: boolean;
  prepaymentStatus?: string | null;
  refundAmount?: number | null;
}): boolean {
  const status = String(input.status ?? "").toLowerCase().replace(/\s+/g, "_");
  const terminal =
    status === "completed" ||
    status === "cancelled" ||
    status === "canceled" ||
    status === "no_show" ||
    status === "invalid";
  if (!terminal) return false;
  if (typeof input.refundAmount === "number") return input.refundAmount > 0;
  if (input.prepaid === true) return true;
  const prepay = String(input.prepaymentStatus ?? "").toLowerCase();
  return prepay === "confirmed" || prepay === "paid";
}

/**
 * Professional booking Action menu / footer visibility per Booking Status Guideline.
 */
export function resolveProfessionalBookingActions(
  event: Pick<
    CalendarEvent,
    "status" | "bookingScenario" | "bookingType" | "details"
  > | null | undefined,
  opts?: { refundApplicable?: boolean },
): ProfessionalActionFlags {
  const flags = falseProfessionalFlags();
  if (!event) return flags;

  const status = event.status;
  const refundOk = Boolean(opts?.refundApplicable);

  if (status === "Confirmed") {
    const erPending = event.bookingScenario === "ER";
    flags.edit = true;
    // While ER is pending, lock Cancel / In Progress / No Show.
    if (!erPending) {
      flags.cancel = true;
      flags.in_progress = true;
      flags.no_show = true;
    }
    // Incoming client ER → respond with Accept / Suggest / Reject.
    if (
      erPending &&
      event.details?.requestDirection !== "outgoing"
    ) {
      flags.accept = true;
      flags.suggest_change = true;
      flags.reject = true;
    }
    return flags;
  }

  if (status === "In Progress") {
    flags.checkout = true;
    flags.no_show = true;
    return flags;
  }

  if (status === "Completed") {
    flags.delete = true;
    flags.rebook = true;
    flags.refund = refundOk;
    return flags;
  }

  if (status === "Cancelled" || status === "Invalid" || status === "No Show") {
    flags.delete = true;
    flags.refund = refundOk;
    return flags;
  }

  if (status === "Requested") {
    if (canRespondToIncomingRequest(event)) {
      flags.accept = true;
      flags.suggest_change = true;
      flags.reject = true;
      flags.edit = true;
    }
    if (canDiscardBookingRequest(event)) {
      flags.edit = true;
      flags.discard = true;
    }
    if (canDiscardEbr(event)) {
      flags.edit = true;
      flags.discard = true;
    }
    return flags;
  }

  return flags;
}

/**
 * Client booking header / details action visibility per Booking Status Guideline.
 */
export function resolveClientBookingActions(input: {
  status: ClientBookingStatus;
  bookingRequestDirection?: "incoming" | "outgoing";
  locationMode?: "fixed" | "desired";
  isEbrIncoming?: boolean;
  bookingRequestSent?: boolean;
}): ClientActionFlags {
  const flags = falseClientFlags();
  const status = input.status;

  if (
    status === "completed" ||
    status === "cancelled" ||
    status === "invalid" ||
    status === "no_show"
  ) {
    flags.delete = true;
    return flags;
  }

  if (status === "in_progress") {
    return flags;
  }

  if (status === "confirmed") {
    flags.edit = true;
    flags.cancel = true;
    return flags;
  }

  if (status === "requested" || status === "waiting_for_prepayment") {
    const isIncomingBr =
      status === "requested" &&
      input.bookingRequestDirection === "incoming" &&
      !input.isEbrIncoming;
    if (input.isEbrIncoming || isIncomingBr) {
      flags.accept = true;
      flags.suggest_change = true;
      flags.reject = true;
    }
    const isOutgoingDesired =
      status === "requested" &&
      input.bookingRequestDirection === "outgoing" &&
      input.locationMode === "desired";
    if (isOutgoingDesired) {
      flags.discard = true;
    }
    // Waiting for prepayment after accept: no cancel/edit required by guideline for client BR→ flow.
    if (status === "waiting_for_prepayment") {
      flags.edit = true;
    }
    return flags;
  }

  if (status === "draft") {
    return flags;
  }

  return flags;
}

export function showProfessionalActionMenu(
  event: Pick<CalendarEvent, "status"> | null | undefined,
): boolean {
  if (!event) return false;
  return (
    event.status === "Confirmed" ||
    event.status === "In Progress" ||
    event.status === "Completed" ||
    event.status === "Cancelled" ||
    event.status === "Invalid" ||
    event.status === "No Show"
  );
}

export function isOutgoingBookingRequestEvent(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details" | "bookingType"> | null | undefined,
) {
  return isOutgoingBookingRequest(event);
}
