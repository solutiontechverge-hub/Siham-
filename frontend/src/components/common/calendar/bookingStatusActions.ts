import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import { clientShouldAck, professionalShouldAck } from "./bookingAcknowledgment";
import {
  canDiscardEbr,
  canRespondToIncomingRequest,
  isOutgoingBookingRequest,
} from "./bookingRequestNegotiation";
import { isResponseWindowOverdue } from "./bookingResponseDeadline";
import { canDiscardBookingRequest } from "./bookingStatus";

export type ProfessionalBookingAction =
  | "edit"
  | "discard"
  | "restart_response"
  | "accept"
  | "suggest_change"
  | "reject"
  | "cancel"
  | "in_progress"
  | "no_show"
  | "checkout"
  | "delete"
  | "rebook"
  | "ok";

export type ClientBookingAction =
  | "edit"
  | "discard"
  | "accept"
  | "suggest_change"
  | "reject"
  | "cancel"
  | "delete"
  | "ok";

export type ProfessionalActionFlags = Record<ProfessionalBookingAction, boolean>;
export type ClientActionFlags = Record<ClientBookingAction, boolean>;

const falseProfessionalFlags = (): ProfessionalActionFlags => ({
  edit: false,
  discard: false,
  restart_response: false,
  accept: false,
  suggest_change: false,
  reject: false,
  cancel: false,
  in_progress: false,
  no_show: false,
  checkout: false,
  delete: false,
  rebook: false,
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
  ok: false,
});

/**
 * Professional booking Action menu / footer visibility per Booking Status Guideline.
 */
export function resolveProfessionalBookingActions(
  event: Pick<
    CalendarEvent,
    "status" | "bookingScenario" | "bookingType" | "details"
  > | null | undefined,
  opts?: { protectiveFeeCheckoutApplicable?: boolean },
): ProfessionalActionFlags {
  const flags = falseProfessionalFlags();
  if (!event) return flags;

  const status = event.status;
  const feeCheckoutOk = Boolean(opts?.protectiveFeeCheckoutApplicable);

  if (status === "BR Accepted") {
    if (professionalShouldAck(event.details)) {
      flags.ok = true;
    }
    return flags;
  }

  if (status === "Confirmed") {
    const erPending = event.bookingScenario === "ER";
    flags.edit = true;
    if (professionalShouldAck(event.details)) {
      flags.ok = true;
    }
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
    if (
      erPending &&
      isResponseWindowOverdue({
        responseStatus: event.details?.responseStatus,
        responseStartedAt: event.details?.responseStartedAt,
        respondBy: event.details?.respondBy,
        responseWindowMinutes: event.details?.responseWindowMinutes,
      })
    ) {
      flags.restart_response = true;
    }
    return flags;
  }

  if (status === "In Progress") {
    // Checkout lives as a persistent footer button, not in the Action menu.
    flags.no_show = true;
    return flags;
  }

  if (status === "Completed") {
    flags.delete = true;
    flags.rebook = true;
    if (professionalShouldAck(event.details)) flags.ok = true;
    return flags;
  }

  if (status === "Cancelled" || status === "Invalid" || status === "No Show") {
    flags.delete = true;
    if (
      feeCheckoutOk &&
      (status === "Cancelled" || status === "No Show")
    ) {
      flags.checkout = true;
    }
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
    const overdue = isResponseWindowOverdue({
      responseStatus: event.details?.responseStatus,
      responseStartedAt: event.details?.responseStartedAt,
      respondBy: event.details?.respondBy,
      responseWindowMinutes: event.details?.responseWindowMinutes,
    });
    if (
      overdue &&
      (canDiscardBookingRequest(event) ||
        canDiscardEbr(event) ||
        canRespondToIncomingRequest(event) ||
        isOutgoingBookingRequest(event))
    ) {
      flags.restart_response = true;
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
  needsOk?: boolean;
  ackRecipient?: "client" | "professional";
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

  if (status === "br_accepted") {
    if (
      clientShouldAck({
        needsOk: input.needsOk,
        ackRecipient: input.ackRecipient,
      })
    ) {
      flags.ok = true;
    }
    return flags;
  }

  if (status === "confirmed") {
    flags.edit = true;
    flags.cancel = true;
    return flags;
  }

  if (status === "requested") {
    const isIncomingBr =
      input.bookingRequestDirection === "incoming" &&
      !input.isEbrIncoming;
    if (input.isEbrIncoming || isIncomingBr) {
      flags.accept = true;
      flags.suggest_change = true;
      flags.reject = true;
    }
    const isOutgoingDesired =
      input.bookingRequestDirection === "outgoing" &&
      input.locationMode === "desired";
    if (isOutgoingDesired) {
      flags.discard = true;
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
    event.status === "BR Accepted" ||
    event.status === "In Progress" ||
    event.status === "Completed" ||
    event.status === "Cancelled" ||
    event.status === "Invalid" ||
    event.status === "No Show"
  );
}

/** In Progress checkout stays pinned at the panel footer across tabs. */
export function showPersistentCheckoutButton(
  event: Pick<CalendarEvent, "status"> | null | undefined,
): boolean {
  return event?.status === "In Progress";
}

export function isOutgoingBookingRequestEvent(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details" | "bookingType"> | null | undefined,
) {
  return isOutgoingBookingRequest(event);
}
