/**
 * Response-time / late-response helpers for BR / EBR / ER negotiation windows.
 * Window length is always resolved from the live business template (flat 30-minute
 * default when unset). Stored respondBy / responseWindowMinutes are snapshots only.
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

/**
 * Effective wait length for a booking. Live template always wins when supplied
 * (blank → 30). Without a live input, fall back to the stamped snapshot.
 */
export function resolveEffectiveResponseWindowMinutes(
  fields?: ResponseDeadlineFields | null,
  liveWindow?: ResponseWindowInput | null,
): number {
  if (liveWindow !== undefined) {
    return resolveResponseWindowMinutes(liveWindow);
  }
  const stamped = Number(fields?.responseWindowMinutes);
  if (Number.isFinite(stamped) && stamped > 0) return stamped;
  return DEFAULT_RESPONSE_WINDOW_MINUTES;
}

/** Due instant from responseStartedAt + live/effective window (dynamic). */
export function resolveEffectiveRespondByMs(
  fields?: ResponseDeadlineFields | null,
  liveWindow?: ResponseWindowInput | null,
): number | null {
  if (!fields) return null;

  const windowMinutes = resolveEffectiveResponseWindowMinutes(fields, liveWindow);

  if (fields.responseStartedAt) {
    const start = Date.parse(fields.responseStartedAt);
    if (Number.isFinite(start)) return start + windowMinutes * 60_000;
  }

  if (fields.respondBy) {
    const due = Date.parse(fields.respondBy);
    if (!Number.isFinite(due)) return null;
    // No startedAt: shift frozen due when live window differs from stamped.
    if (liveWindow !== undefined) {
      const stamped = Number(fields.responseWindowMinutes);
      if (Number.isFinite(stamped) && stamped > 0 && stamped !== windowMinutes) {
        return due - stamped * 60_000 + windowMinutes * 60_000;
      }
    }
    return due;
  }

  return null;
}

/** Notes already carry a response window — do not invent one for older bookings. */
export function hasStoredResponseDeadline(
  fields?: ResponseDeadlineFields | null,
): boolean {
  if (!fields) return false;
  if (fields.respondBy) return true;
  if (fields.responseStartedAt) return true;
  if (Number(fields.responseWindowMinutes) > 0) return true;
  return fields.responseStatus === "overdue_response";
}

export function buildResponseDeadline(
  windowInput?: ResponseWindowInput | null,
  startedAt: Date = new Date(),
): ResponseDeadline {
  const windowMinutes = resolveResponseWindowMinutes(windowInput);
  const startMs = startedAt.getTime();
  return {
    responseStartedAt: startedAt.toISOString(),
    respondBy: new Date(startMs + windowMinutes * 60_000).toISOString(),
    responseWindowMinutes: windowMinutes,
  };
}

export function restartResponseDeadline(
  _fields?: ResponseDeadlineFields | null,
  windowInput?: ResponseWindowInput | null,
  startedAt: Date = new Date(),
): ResponseDeadline {
  // Always restart from the live template (or flat 30-minute default).
  return buildResponseDeadline(windowInput, startedAt);
}

/** Original BR, EBR, or Confirmed ER still waiting on a response. */
export function isPendingResponseNegotiation(
  event: PendingNegotiationEvent,
): boolean {
  if (!event) return false;
  if (event.status === "Requested") return true;
  return event.status === "Confirmed" && event.bookingScenario === "ER";
}

/** Expiry banner: pending BR/EBR/ER whose live window has elapsed. */
export function shouldShowExpiredResponseBanner(
  event: PendingNegotiationEvent,
  responseTimeInput?: ResponseWindowInput | null,
  now: Date = new Date(),
): boolean {
  if (!isPendingResponseNegotiation(event)) return false;
  if (!hasStoredResponseDeadline(event?.details)) return false;
  return isResponseWindowOverdue(event?.details, now, responseTimeInput);
}

export function isResponseWindowOverdue(
  fields?: ResponseDeadlineFields | null,
  now: Date = new Date(),
  liveWindow?: ResponseWindowInput | null,
): boolean {
  if (!fields) return false;

  const dueMs = resolveEffectiveRespondByMs(fields, liveWindow);
  if (dueMs != null) {
    return now.getTime() > dueMs;
  }

  // Legacy stamp with no reconstructable start/due.
  return fields.responseStatus === "overdue_response";
}
