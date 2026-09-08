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

export function resolveResponseWindowMinutes(
  setupHours,
  setupMinutes,
  metaWindowMinutes,
) {
  const fromMeta = Number(metaWindowMinutes);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;

  const hours = Number(setupHours);
  const minutes = Number(setupMinutes);
  const total =
    (Number.isFinite(hours) && hours > 0 ? hours * 60 : 0) +
    (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
  return total > 0 ? total : DEFAULT_RESPONSE_WINDOW_MINUTES;
}
