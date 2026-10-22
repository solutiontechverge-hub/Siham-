import { parseClockToMinutes } from "../../../components/common/calendar/calendar.utils";

/** Same-day bookings must start at least this many minutes from now. */
export const CLIENT_BOOKING_MIN_LEAD_MINUTES = 15;

export const CLIENT_BOOKING_MIN_LEAD_ERROR =
  "Please select a time at least 15 minutes from now.";

/** Minutes from midnight for client AM/PM labels or professional/API `HH:mm`. */
export function parseTimeLabelToMinutes(label: string) {
  // Shared clock parser: AM/PM-only used to return 0 for "09:30" → "12:00 AM" on client.
  return parseClockToMinutes(label) ?? 0;
}

export function getNowMinutesFromMidnight(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

/** True when booking today and the slot starts within the minimum lead window. */
export function isSameDayBookingTooSoon(
  timeLabel: string,
  now = new Date(),
  minLeadMinutes = CLIENT_BOOKING_MIN_LEAD_MINUTES,
) {
  return parseTimeLabelToMinutes(timeLabel) <= getNowMinutesFromMidnight(now) + minLeadMinutes;
}

export function fmtMinutesToIsoTime(mins: number) {
  const normalized = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh24 = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function fmtMinutesToTimeLabel(mins: number) {
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh24 = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = hh24 >= 12 ? "PM" : "AM";
  const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
  return `${hh12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

export function serviceTimeRangeLabel(startMinutes: number, durationMins: number) {
  return `${fmtMinutesToTimeLabel(startMinutes)}–${fmtMinutesToTimeLabel(startMinutes + durationMins)}`;
}

/** ISO-like timestamp that preserves the selected wall-clock time (no UTC shift). */
export function buildWallClockDateTimeIso(dateIso: string, minutesFromMidnight: number) {
  const normalized = ((minutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh24 = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${dateIso}T${String(hh24).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}
