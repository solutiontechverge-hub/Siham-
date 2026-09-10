/** Flat default when business template response time is unset. */
export const DEFAULT_RESPONSE_WINDOW_MINUTES = Number(
  process.env.BOOKING_RESPONSE_WINDOW_MINUTES || 30,
);

/** True when the business actually configured a response window (not blank/zero). */
export function isResponseTimeConfigured(setupHours, setupMinutes) {
  const hours = Number(setupHours);
  const minutes = Number(setupMinutes);
  return (
    (Number.isFinite(hours) && hours > 0) ||
    (Number.isFinite(minutes) && minutes > 0)
  );
}

/**
 * Live business-template window. Setup always wins; blank/zero → flat 30-minute
 * default. Meta snapshot is ignored so template edits apply to open requests.
 */
export function resolveResponseWindowMinutes(
  setupHours,
  setupMinutes,
  _metaWindowMinutes,
) {
  const hours = Number(setupHours);
  const minutes = Number(setupMinutes);
  const total =
    (Number.isFinite(hours) && hours > 0 ? hours * 60 : 0) +
    (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
  return total > 0 ? total : DEFAULT_RESPONSE_WINDOW_MINUTES;
}

/** Due ms from responseStartedAt + live window (falls back to shifted respondBy). */
export function resolveEffectiveRespondByMs(meta, windowMinutes) {
  if (meta?.responseStartedAt) {
    const start = Date.parse(meta.responseStartedAt);
    if (Number.isFinite(start)) return start + windowMinutes * 60_000;
  }

  if (meta?.respondBy) {
    const due = Date.parse(meta.respondBy);
    if (!Number.isFinite(due)) return null;
    const stamped = Number(meta.responseWindowMinutes);
    if (Number.isFinite(stamped) && stamped > 0 && stamped !== windowMinutes) {
      return due - stamped * 60_000 + windowMinutes * 60_000;
    }
    return due;
  }

  return null;
}
