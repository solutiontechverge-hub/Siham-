/**
 * Run with: npx --yes tsx src/components/common/calendar/calendarBookingCardServices.weekSpans.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { getWeekOverviewMainServiceSpans } from "./calendarBookingCardServices";

const event: CalendarEvent = {
  id: "booking-1",
  resourceId: "tm-1",
  date: "2026-09-04",
  start: "09:00",
  end: "12:00",
  title: "Multi",
  status: "Confirmed",
  location: "FL",
  details: {
    services: [
      {
        id: "svc-late",
        name: "Color",
        price: 40,
        durationMins: 60,
        startTime: "11:00",
        endTime: "12:00",
        teamMemberId: "tm-1",
        guestId: null,
      },
      {
        id: "svc-early",
        name: "Cut",
        price: 20,
        durationMins: 60,
        startTime: "09:00",
        endTime: "10:00",
        teamMemberId: "tm-1",
        guestId: null,
      },
    ],
  },
};

const spans = getWeekOverviewMainServiceSpans(event);
assert.equal(spans.length, 2);
assert.equal(spans[0]?.name, "Cut", "chronological first span is chain anchor");
assert.equal(spans[0]?.start, "09:00");
assert.equal(spans[1]?.name, "Color");

console.log("calendarBookingCardServices.weekSpans.test.ts: ok");
