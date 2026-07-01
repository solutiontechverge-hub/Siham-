import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { minutesSinceMidnight } from "./calendar.utils";

export function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  const aStart = minutesSinceMidnight(a.start);
  const aEnd = minutesSinceMidnight(a.end);
  const bStart = minutesSinceMidnight(b.start);
  const bEnd = minutesSinceMidnight(b.end);
  return aStart < bEnd && aEnd > bStart;
}

export function clusterSameStartTimeEvents(events: readonly CalendarEvent[]): CalendarEvent[][] {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const key = event.start;
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
