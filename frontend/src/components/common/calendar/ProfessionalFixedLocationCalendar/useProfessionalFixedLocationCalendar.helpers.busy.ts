import {
  eventHasKnownTeamAssignment,
} from "../teamMemberBookings";
import type { Interval } from "../calendar.utils";
import { minutesSinceMidnight } from "../calendar.utils";
import type {
  CalendarBlock,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { expandCalendarEventToChronologicalSegments } from "../../../../data/bookingChronologicalBlocks";

export function buildBusyIntervalsForResource(input: {
  resourceId: string;
  iso: string;
  events: readonly CalendarEvent[];
  blocks: readonly CalendarBlock[];
  fallbackTeamMemberId: string;
  knownTeamMemberIds: ReadonlySet<string>;
}): Interval[] {
  const {
    resourceId,
    iso,
    events,
    blocks,
    fallbackTeamMemberId,
    knownTeamMemberIds,
  } = input;
  const busy: Interval[] = [];
  for (const e of events) {
    if (e.date !== iso) continue;
    // Cancelled slots stay visually shown but are free to rebook.
    if (e.status === "Cancelled") continue;
    const segments = expandCalendarEventToChronologicalSegments(e);
    for (const segment of segments) {
      const assignedId = String(segment.resourceId || e.resourceId);
      const belongs =
        assignedId === String(resourceId) ||
        (resourceId === fallbackTeamMemberId &&
          !eventHasKnownTeamAssignment(e, knownTeamMemberIds) &&
          assignedId === String(e.resourceId));
      if (!belongs) continue;
      busy.push({
        startMin: minutesSinceMidnight(segment.start),
        endMin: minutesSinceMidnight(segment.end),
      });
    }
  }
  for (const b of blocks) {
    if (b.resourceId !== resourceId || b.date !== iso) continue;
    busy.push({
      startMin: minutesSinceMidnight(b.start),
      endMin: minutesSinceMidnight(b.end),
    });
  }
  return busy;
}
