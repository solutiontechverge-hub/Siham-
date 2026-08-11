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

const DEFAULT_RESPONSE_WINDOW_MINUTES = 24 * 60;

export function resolveResponseWindowMinutes(
  input?: ResponseWindowInput | null,
): number {
  const hours = Number(input?.hours);
  const minutes = Number(input?.minutes);
  const total =
    (Number.isFinite(hours) && hours > 0 ? hours * 60 : 0) +
    (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
  return total > 0 ? total : DEFAULT_RESPONSE_WINDOW_MINUTES;
}

export function buildResponseDeadline(
  windowInput?: ResponseWindowInput | null,
  startedAt: Date = new Date(),
): Required<
  Pick<
    ResponseDeadlineFields,
    "responseStartedAt" | "respondBy" | "responseWindowMinutes"
  >
> {
  const windowMinutes = resolveResponseWindowMinutes(windowInput);
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
): Required<
  Pick<
    ResponseDeadlineFields,
    "responseStartedAt" | "respondBy" | "responseWindowMinutes"
  >
> {
  const windowMinutes =
    Number(fields?.responseWindowMinutes) > 0
      ? Number(fields?.responseWindowMinutes)
      : resolveResponseWindowMinutes(windowInput);
  return buildResponseDeadline(
    { hours: 0, minutes: windowMinutes },
    startedAt,
  );
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
