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
 * Window minutes: stamped meta wins when provided; else setup; blank → flat 30.
 */
export function resolveResponseWindowMinutes(
  setupHours,
  setupMinutes,
  metaWindowMinutes,
) {
  const stamped = Number(metaWindowMinutes);
  if (Number.isFinite(stamped) && stamped > 0) return stamped;
  const hours = Number(setupHours);
  const minutes = Number(setupMinutes);
  const total =
    (Number.isFinite(hours) && hours > 0 ? hours * 60 : 0) +
    (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
  return total > 0 ? total : DEFAULT_RESPONSE_WINDOW_MINUTES;
}

/** Due ms: frozen respondBy wins; never shift it with a live window. */
export function resolveEffectiveRespondByMs(meta, windowMinutes) {
  if (meta?.respondBy) {
    const due = Date.parse(meta.respondBy);
    if (Number.isFinite(due)) return due;
  }

  if (meta?.responseStartedAt) {
    const start = Date.parse(meta.responseStartedAt);
    if (Number.isFinite(start)) return start + windowMinutes * 60_000;
  }

  return null;
}

/** ISO timestamptz from notes meta `respondBy`, or null when absent/invalid. */
export function responseDeadlineAtFromNotes(notes) {
  if (!notes || typeof notes !== "string") return null;
  const marker = "---mollure-meta---";
  const i = notes.indexOf(marker);
  const raw = (i === -1 ? notes : notes.slice(i + marker.length)).trim();
  if (!raw.startsWith("{")) return null;
  try {
    const due = Date.parse(JSON.parse(raw)?.respondBy);
    return Number.isFinite(due) ? new Date(due).toISOString() : null;
  } catch {
    return null;
  }
}
