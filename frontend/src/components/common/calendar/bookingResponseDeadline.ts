/**
 * Response-time / late-response helpers for BR / EBR / ER negotiation windows.
 */

export type ResponseWindowInput = {
  hours?: number | null;
  minutes?: number | null;
};

export type ResponseDeadlineFields = {
  responseStartedAt?: string;
  respondBy?: string;
  responseWindowMinutes?: number;
  responseStatus?: "suggestion_for_change" | "overdue_response";
};

/** Flat default when business template response time is unset. */
export const DEFAULT_RESPONSE_WINDOW_MINUTES = 30;

type ResponseDeadline = Required<
  Pick<
    ResponseDeadlineFields,
    "responseStartedAt" | "respondBy" | "responseWindowMinutes"
  >
>;

type PendingNegotiationEvent = {
  status?: string | null;
  bookingScenario?: string | null;
  details?: ResponseDeadlineFields | null;
} | null | undefined;

/** True when the business actually configured a response window (not blank/zero). */
export function isResponseTimeConfigured(
  input?: ResponseWindowInput | null,
): boolean {
  const hours = Number(input?.hours);
  const minutes = Number(input?.minutes);
  return (
    (Number.isFinite(hours) && hours > 0) ||
    (Number.isFinite(minutes) && minutes > 0)
  );
}

export function configuredResponseWindowMinutes(
  input?: ResponseWindowInput | null,
): number | null {
  if (!isResponseTimeConfigured(input)) return null;
  const hours = Number(input?.hours);
  const minutes = Number(input?.minutes);
  return (
    (Number.isFinite(hours) && hours > 0 ? hours * 60 : 0) +
    (Number.isFinite(minutes) && minutes > 0 ? minutes : 0)
  );
}

export function resolveResponseWindowMinutes(
  input?: ResponseWindowInput | null,
): number {
  return configuredResponseWindowMinutes(input) ?? DEFAULT_RESPONSE_WINDOW_MINUTES;
}

export function buildResponseDeadline(
  windowInput?: ResponseWindowInput | null,
  startedAt: Date = new Date(),
): ResponseDeadline | null {
  const windowMinutes = configuredResponseWindowMinutes(windowInput);
  if (!windowMinutes) return null;
  const startMs = startedAt.getTime();
  return {
    responseStartedAt: startedAt.toISOString(),
    respondBy: new Date(startMs + windowMinutes * 60_000).toISOString(),
    responseWindowMinutes: windowMinutes,
  };
}

export function restartResponseDeadline(
  fields?: ResponseDeadlineFields | null,
  windowInput?: ResponseWindowInput | null,
  startedAt: Date = new Date(),
): ResponseDeadline | null {
  const configured = configuredResponseWindowMinutes(windowInput);
  const fieldMinutes = Number(fields?.responseWindowMinutes);
  const fromFields = fieldMinutes > 0 ? fieldMinutes : null;
  const windowMinutes = configured ?? fromFields;
  if (!windowMinutes) return null;
  return buildResponseDeadline({ hours: 0, minutes: windowMinutes }, startedAt);
}

/** Original BR, EBR, or Confirmed ER still waiting on a response. */
export function isPendingResponseNegotiation(
  event: PendingNegotiationEvent,
): boolean {
  if (!event) return false;
  if (event.status === "Requested") return true;
  return event.status === "Confirmed" && event.bookingScenario === "ER";
}

/** Expiry banner: configured window + pending BR/EBR/ER + elapsed deadline. */
export function shouldShowExpiredResponseBanner(
  event: PendingNegotiationEvent,
  responseTimeInput?: ResponseWindowInput | null,
  now: Date = new Date(),
): boolean {
  if (!isResponseTimeConfigured(responseTimeInput)) return false;
  if (!isPendingResponseNegotiation(event)) return false;
  return isResponseWindowOverdue(event?.details, now);
}

export function isResponseWindowOverdue(
  fields?: ResponseDeadlineFields | null,
  now: Date = new Date(),
): boolean {
  if (!fields) return false;
  if (fields.responseStatus === "overdue_response") return true;
  if (fields.respondBy) {
    const due = Date.parse(fields.respondBy);
    if (Number.isFinite(due) && now.getTime() > due) return true;
  }
  if (fields.responseStartedAt && fields.responseWindowMinutes) {
    const start = Date.parse(fields.responseStartedAt);
    if (
      Number.isFinite(start) &&
      now.getTime() > start + fields.responseWindowMinutes * 60_000
    ) {
      return true;
    }
  }
  return false;
}
