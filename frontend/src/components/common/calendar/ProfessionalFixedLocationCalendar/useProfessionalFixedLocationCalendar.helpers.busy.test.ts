/**
 * Run with:
 * npx --yes tsx src/components/common/calendar/ProfessionalFixedLocationCalendar/useProfessionalFixedLocationCalendar.helpers.busy.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { buildBusyIntervalsForResource } from "./useProfessionalFixedLocationCalendar.helpers.busy";

function event(
  partial: Partial<CalendarEvent> & Pick<CalendarEvent, "id">,
): CalendarEvent {
  return {
    resourceId: "ali",
    date: "2026-09-15",
    start: "10:00",
    end: "11:00",
    title: "Cut",
    status: "Confirmed",
    location: "FL",
    ...partial,
  };
}

const sharedBooking = event({
  id: "b-shared",
  resourceId: "ali",
  start: "10:00",
  end: "11:00",
  details: {
    services: [
      {
        id: "svc-ali",
        name: "Cut",
        price: 20,
        durationMins: 30,
        teamMemberId: "ali",
        startTime: "10:00",
        endTime: "10:30",
      },
      {
        id: "svc-hama",
        name: "Color",
        price: 30,
        durationMins: 30,
        staffResourceId: "hama",
        startTime: "10:30",
        endTime: "11:00",
      },
    ],
  },
});

const known = new Set(["ali", "aliza", "hama"]);

const busyAli = buildBusyIntervalsForResource({
  resourceId: "ali",
  iso: "2026-09-15",
  events: [sharedBooking],
  blocks: [],
  fallbackTeamMemberId: "ali",
  knownTeamMemberIds: known,
});
const busyHama = buildBusyIntervalsForResource({
  resourceId: "hama",
  iso: "2026-09-15",
  events: [sharedBooking],
  blocks: [],
  fallbackTeamMemberId: "ali",
  knownTeamMemberIds: known,
});
const busyAliza = buildBusyIntervalsForResource({
  resourceId: "aliza",
  iso: "2026-09-15",
  events: [sharedBooking],
  blocks: [],
  fallbackTeamMemberId: "ali",
  knownTeamMemberIds: known,
});

assert.deepEqual(busyAli, [{ startMin: 600, endMin: 630 }]);
assert.deepEqual(busyHama, [{ startMin: 630, endMin: 660 }]);
assert.equal(busyAliza.length, 0);

const hostOnly = event({
  id: "b-host",
  resourceId: "ali",
  start: "12:00",
  end: "13:00",
  details: { services: [{ id: "s", name: "Cut", price: 10, durationMins: 60 }] },
});
const busyHostOnly = buildBusyIntervalsForResource({
  resourceId: "ali",
  iso: "2026-09-15",
  events: [hostOnly],
  blocks: [],
  fallbackTeamMemberId: "ali",
  knownTeamMemberIds: known,
});
assert.deepEqual(
  busyHostOnly,
  [{ startMin: 720, endMin: 780 }],
  "resourceId-only booking still counts for host",
);

console.log("buildBusyIntervalsForResource assignee attribution ok");
