import type {
  CalendarBookingDetails,
  CalendarBookingScenario,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type AckRecipient = "client" | "professional";

/** Pro-centric: incoming = client sent BR; outgoing = professional sent BR. */
export function resolveBookingRequestSender(
  requestDirection?: "incoming" | "outgoing",
): AckRecipient {
  return requestDirection === "outgoing" ? "professional" : "client";
}

export function prepayBlocksConfirmation(input: {
  prepayRequired: boolean;
  prepayPaid: boolean;
}): boolean {
  return input.prepayRequired && !input.prepayPaid;
}

export function resolveAcceptTransition(input: {
  prepayRequired: boolean;
  prepayPaid: boolean;
  requestDirection?: "incoming" | "outgoing";
  ackScenario?: CalendarBookingScenario;
}): {
  status: "br_accepted";
  needsOk: boolean;
  ackRecipient?: AckRecipient;
  ackScenario: CalendarBookingScenario;
} {
  const blocked = prepayBlocksConfirmation(input);
  const sender = resolveBookingRequestSender(input.requestDirection);
  return {
    status: "br_accepted",
    needsOk: !blocked,
    ackRecipient: blocked ? undefined : sender,
    ackScenario: input.ackScenario ?? "BR",
  };
}

export function professionalShouldAck(
  details?: Pick<CalendarBookingDetails, "needsOk" | "ackRecipient"> | null,
): boolean {
  return Boolean(details?.needsOk && details.ackRecipient === "professional");
}

export function clientShouldAck(
  details?: Pick<CalendarBookingDetails, "needsOk" | "ackRecipient"> | null,
): boolean {
  return Boolean(details?.needsOk && details?.ackRecipient === "client");
}

export function buildAcceptAckDetails(input: {
  prepayRequired: boolean;
  prepayPaid: boolean;
  requestDirection?: "incoming" | "outgoing";
  ackScenario?: CalendarBookingScenario;
  base?: CalendarBookingDetails | null;
}): CalendarBookingDetails {
  const transition = resolveAcceptTransition(input);
  const next: CalendarBookingDetails = { ...(input.base ?? {}) };
  if (transition.needsOk && transition.ackRecipient) {
    next.needsOk = true;
    next.ackRecipient = transition.ackRecipient;
    next.ackScenario = transition.ackScenario;
  } else {
    delete next.needsOk;
    delete next.ackRecipient;
    delete next.ackScenario;
  }
  return next;
}
