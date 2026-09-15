"use client";

import { Box } from "@mui/material";

import { BodyText } from "../../../ui/typography";

import {
  getLocationAvailabilityBands,
} from "../calendar-schedule.utils";

import {
  dedupeCalendarBlocks,
  calendarBlockOverlapsBooking,
  minutesSinceMidnight,
} from "../calendar.utils";

import {
  useProfessionalFixedLocationCalendar,
} from "./useProfessionalFixedLocationCalendar";

import {
  locationAvailabilityPatternSx,
} from "./professionalFixedLocationCalendar.data";

import type { CalendarBlock } from "../../../../app/professionals/fixed-location/calendar/calendar.data";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBandsBag = Pick<
  Vm,
  "grid" | "m" | "rowPx" | "startMin"
>;

type Band = ReturnType<typeof getLocationAvailabilityBands>[number];
type LaneEvent = Vm["eventsInRange"][number];

export type ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBandsProps = {
  bag: ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBandsBag;
  resourceId: string;
  date: string;
  unavailableIntervals: readonly { startMin: number; endMin: number }[];
  locationBands: readonly Band[];
  offersBothLocations: boolean;
  laneBlocks: readonly CalendarBlock[];
  laneEvents: readonly LaneEvent[];
};

/** Unavailable / location / block-time bands under booking cards */
export default function ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBands({
  bag,
  resourceId,
  date,
  unavailableIntervals,
  locationBands,
  offersBothLocations,
  laneBlocks,
  laneEvents,
}: ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBandsProps) {
  const { grid, m, rowPx, startMin } = bag;

  return (
    <>
      {/* Unavailable = dark gray (outside this member's Schedule) */}
      {unavailableIntervals.map((interval, idx) => {
        const top =
          ((interval.startMin - startMin) / grid.stepMinutes) * rowPx;
        const height =
          ((interval.endMin - interval.startMin) / grid.stepMinutes) * rowPx;
        if (height <= 0) return null;
        return (
          <Box
            key={`unavail-${resourceId}-${date}-${idx}`}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              height,
              bgcolor: m.timelineGridHourSlotBg,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        );
      })}

      {locationBands.map((band, bandIdx) => {
        const top =
          ((band.interval.startMin - startMin) / grid.stepMinutes) * rowPx;
        const height =
          ((band.interval.endMin - band.interval.startMin) /
            grid.stepMinutes) *
          rowPx;
        if (height <= 0) return null;
        const patternSx =
          offersBothLocations && band.kind !== "fixed"
            ? locationAvailabilityPatternSx(band.kind)
            : {};
        return (
          <Box
            key={`avail-${band.kind}-${bandIdx}`}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              height,
              pointerEvents: "none",
              zIndex: 1,
              ...patternSx,
            }}
          />
        );
      })}

      {/* Block Time — gray band below bookings; labels omitted on booking overlap */}
      {dedupeCalendarBlocks(laneBlocks).map((b) => {
        const top =
          ((minutesSinceMidnight(b.start) - startMin) / grid.stepMinutes) *
          rowPx;
        const height = Math.max(
          2,
          ((minutesSinceMidnight(b.end) - minutesSinceMidnight(b.start)) /
            grid.stepMinutes) *
            rowPx,
        );
        const overlapsBooking = laneEvents.some((event) =>
          calendarBlockOverlapsBooking(b, event),
        );

        return (
          <Box
            key={b.id}
            title={`${b.title}: ${b.start} – ${b.end}`}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              height,
              pointerEvents: "none",
              zIndex: 2,
              bgcolor: m.blockTimeBandBg,
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {overlapsBooking ? null : (
              <Box
                sx={{
                  position: "absolute",
                  left: 8,
                  top: 4,
                  right: 6,
                  pointerEvents: "none",
                }}
              >
                <BodyText
                  sx={{
                    fontWeight: 900,
                    fontSize: 10,
                    color: m.blockTimeBandFg,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.start} to {b.end}
                </BodyText>
                <BodyText
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: m.blockTimeBandFg,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.title}
                </BodyText>
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );
}
