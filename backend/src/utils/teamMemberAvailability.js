/**
 * Shared team-member busy / block checks for public availability + booking create.
 */

/** Wall-clock minutes from Date, ISO, or "HH:mm" — never UTC-shift date-only intent. */
export function wallClockTimeToMinutes(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getHours() * 60 + value.getMinutes();
  }
  const text = String(value);
  const matched =
    text.match(/T(\d{2}):(\d{2})/) ||
    text.match(/\s(\d{2}):(\d{2})/) ||
    text.match(/^(\d{2}):(\d{2})/);
  if (!matched) return null;
  const h = Number(matched[1]);
  const m = Number(matched[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function wallClockDateFromValue(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const mo = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function intervalsOverlap(a, b) {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export function pushBusyInterval(map, memberId, startMin, endMin) {
  if (!memberId || startMin == null || endMin == null || endMin <= startMin) return;
  const key = String(memberId);
  if (!map[key]) map[key] = [];
  map[key].push({ startMin, endMin });
}

/** SQL predicate: calendar entry covers $dateParam (single day or start_date…end_date). */
export function calendarEntryCoversDateSql(alias, dateParam) {
  return `(
    substring(COALESCE(${alias}.start_time::text, ${alias}.blocked_time_start::text, ${alias}.start_date::text) from 1 for 10)::date = ${dateParam}::date
    OR (
      ${alias}.start_date IS NOT NULL
      AND ${alias}.end_date IS NOT NULL
      AND ${alias}.start_date <= ${dateParam}::date
      AND ${alias}.end_date >= ${dateParam}::date
    )
  )`;
}

/**
 * @param {object} queryFn - db query
 * @param {{ professionalProfileId: string, businessSetupId: string, teamMemberId: string, date: string, startMin: number, endMin: number, excludeBookingId?: string|null }} args
 * @returns {Promise<boolean>}
 */
export async function isTeamMemberBusyInWindow(queryFn, args) {
  const {
    professionalProfileId,
    businessSetupId,
    teamMemberId,
    date,
    startMin,
    endMin,
    excludeBookingId = null,
  } = args;
  if (!teamMemberId || startMin == null || endMin == null || endMin <= startMin) {
    return false;
  }

  const bookingParams = [businessSetupId, date, teamMemberId];
  let bookingSql = `
    SELECT start_time, end_time
    FROM bookings
    WHERE business_setup_id = $1
      AND substring(COALESCE(booking_date::text, start_time::text) from 1 for 10)::date = $2::date
      AND team_member_id = $3::uuid
      AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'invalid')`;
  if (excludeBookingId) {
    bookingParams.push(excludeBookingId);
    bookingSql += ` AND id <> $${bookingParams.length}::uuid`;
  }

  const entriesSql = `
    SELECT start_time, end_time, blocked_time_start, blocked_time_end
    FROM calendar_entries
    WHERE professional_profile_id = $1
      AND team_member_id = $2::uuid
      AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'invalid')
      AND ${calendarEntryCoversDateSql("calendar_entries", "$3")}`;

  const [bookingsResult, entriesResult] = await Promise.all([
    queryFn(bookingSql, bookingParams),
    queryFn(entriesSql, [professionalProfileId, teamMemberId, date]),
  ]);

  const window = { startMin, endMin };

  for (const booking of bookingsResult.rows) {
    const bStart = wallClockTimeToMinutes(booking.start_time);
    const bEnd = wallClockTimeToMinutes(booking.end_time);
    if (bStart == null || bEnd == null) continue;
    if (intervalsOverlap(window, { startMin: bStart, endMin: bEnd })) return true;
  }

  for (const entry of entriesResult.rows) {
    const startValue = entry.blocked_time_start ?? entry.start_time;
    const endValue = entry.blocked_time_end ?? entry.end_time;
    const eStart = wallClockTimeToMinutes(startValue);
    const eEnd = wallClockTimeToMinutes(endValue);
    if (eStart == null || eEnd == null) continue;
    if (intervalsOverlap(window, { startMin: eStart, endMin: eEnd })) return true;
  }

  return false;
}
