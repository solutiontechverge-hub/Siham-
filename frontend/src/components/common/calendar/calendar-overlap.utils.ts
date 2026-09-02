import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { minutesSinceMidnight } from "./calendar.utils";

export function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  const aStart = minutesSinceMidnight(a.start);
  const aEnd = minutesSinceMidnight(a.end);
  const bStart = minutesSinceMidnight(b.start);
  const bEnd = minutesSinceMidnight(b.end);
  return aStart < bEnd && aEnd > bStart;
}

export type StaffServiceInterval = {
  id: string;
  name: string;
  staffId: string;
  start: string;
  end: string;
};

function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Same team member + overlapping service times within one booking (soft flag). */
export function findInternalStaffServiceOverlaps(
  services: readonly StaffServiceInterval[],
): Array<{ a: StaffServiceInterval; b: StaffServiceInterval }> {
  const overlaps: Array<{ a: StaffServiceInterval; b: StaffServiceInterval }> =
    [];
  for (let i = 0; i < services.length; i++) {
    for (let j = i + 1; j < services.length; j++) {
      const a = services[i];
      const b = services[j];
      if (!a.staffId || a.staffId !== b.staffId) continue;
      if (
        intervalsOverlap(
          minutesSinceMidnight(a.start),
          minutesSinceMidnight(a.end),
          minutesSinceMidnight(b.start),
          minutesSinceMidnight(b.end),
        )
      ) {
        overlaps.push({ a, b });
      }
    }
  }
  return overlaps;
}

/** Booking services overlapping other calendar events on the same staff/resource. */
export function findExternalStaffBookingOverlaps(input: {
  bookingId?: string | null;
  date: string;
  services: readonly StaffServiceInterval[];
  events: readonly CalendarEvent[];
}): Array<{ service: StaffServiceInterval; event: CalendarEvent }> {
  const overlaps: Array<{
    service: StaffServiceInterval;
    event: CalendarEvent;
  }> = [];
  for (const service of input.services) {
    if (!service.staffId) continue;
    for (const event of input.events) {
      if (input.bookingId && event.id === input.bookingId) continue;
      if (event.date !== input.date) continue;
      if (event.resourceId !== service.staffId) continue;
      if (
        intervalsOverlap(
          minutesSinceMidnight(service.start),
          minutesSinceMidnight(service.end),
          minutesSinceMidnight(event.start),
          minutesSinceMidnight(event.end),
        )
      ) {
        overlaps.push({ service, event });
      }
    }
  }
  return overlaps;
}

/** Join all service names for calendar card title (main + guests). */
export function buildMultiServiceBookingTitle(
  serviceNames: readonly string[],
  fallback = "Booking",
): string {
  const names = serviceNames.map((name) => name.trim()).filter(Boolean);
  if (!names.length) return fallback;
  // Dedupe consecutive identical names while preserving order.
  const unique: string[] = [];
  for (const name of names) {
    if (unique[unique.length - 1] !== name) unique.push(name);
  }
  return unique.join(" · ");
}

function sameStartClusterKey(event: CalendarEvent) {
  return `${event.date}|${event.resourceId}|${minutesSinceMidnight(event.start)}`;
}

export function clusterSameStartTimeEvents(events: readonly CalendarEvent[]): CalendarEvent[][] {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const key = sameStartClusterKey(event);
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }

  return [...groups.values()]
    .map((group) => [...group].sort((a, b) => a.id.localeCompare(b.id)))
    .sort(
      (a, b) =>
        minutesSinceMidnight(a[0].start) - minutesSinceMidnight(b[0].start) ||
        a[0].id.localeCompare(b[0].id),
    );
}

export function clusterOverlappingEvents(events: readonly CalendarEvent[]): CalendarEvent[][] {
  const remaining = [...events];
  const clusters: CalendarEvent[][] = [];

  while (remaining.length) {
    const cluster = [remaining.shift()!];
    let expanded = true;

    while (expanded) {
      expanded = false;
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (cluster.some((member) => eventsOverlap(member, remaining[i]))) {
          cluster.push(remaining[i]);
          remaining.splice(i, 1);
          expanded = true;
        }
      }
    }

    cluster.sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
    clusters.push(cluster);
  }

  return clusters.sort(
    (a, b) => minutesSinceMidnight(a[0].start) - minutesSinceMidnight(b[0].start) || a[0].id.localeCompare(b[0].id),
  );
}

export function getClusterTimeBounds(cluster: readonly CalendarEvent[]) {
  const startMin = Math.min(...cluster.map((event) => minutesSinceMidnight(event.start)));
  const endMin = Math.max(...cluster.map((event) => minutesSinceMidnight(event.end)));
  return { startMin, endMin };
}
