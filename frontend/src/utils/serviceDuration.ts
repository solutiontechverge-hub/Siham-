function parseClockToMinutes(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/.exec(trimmed);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function looksLikeTimeRange(label: string): boolean {
  return /\d{1,2}:\d{2}/.test(label) && /[-–]/.test(label);
}

export function formatDurationFromMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return "—";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes} min`;
}

export function normalizeServiceDurationLabel(raw: string, fallbackMins?: number): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallbackMins != null ? formatDurationFromMinutes(fallbackMins) : "—";
  }

  if (looksLikeTimeRange(trimmed)) {
    const [startRaw, endRaw] = trimmed.split(/[-–]/).map((part) => part.trim());
    const start = parseClockToMinutes(startRaw);
    const end = parseClockToMinutes(endRaw);
    if (start != null && end != null && end > start) {
      return formatDurationFromMinutes(end - start);
    }
  }

  if (/\d+\s*(min|mins|m|h|hour|hours)\b/i.test(trimmed)) {
    return trimmed;
  }

  if (fallbackMins != null && fallbackMins > 0) {
    return formatDurationFromMinutes(fallbackMins);
  }

  return trimmed;
}
