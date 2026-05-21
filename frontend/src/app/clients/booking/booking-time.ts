export function parseTimeLabelToMinutes(label: string) {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const ampm = m[3].toUpperCase();
  if (ampm === "AM") {
    if (hh === 12) hh = 0;
  } else if (hh !== 12) {
    hh += 12;
  }
  return hh * 60 + mm;
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
