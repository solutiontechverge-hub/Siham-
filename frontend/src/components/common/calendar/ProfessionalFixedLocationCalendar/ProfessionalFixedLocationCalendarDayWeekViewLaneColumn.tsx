"use client";

import {
  Box,
  Tooltip,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  eventBelongsToTeamMember,
  eventHasKnownTeamAssignment,
} from "../teamMemberBookings";

import {
  getLocationAvailabilityBands,
  locationAvailabilityKindAtMinute,
  locationAvailabilityTooltip,
} from "../calendar-schedule.utils";

import {
  timelineGridSlotBg,
  subtractIntervals,
} from "../calendar.utils";

import {
  useProfessionalFixedLocationCalendar,
} from "./useProfessionalFixedLocationCalendar";

import {
  WEEK_DAY_CROWDED_BOOKING_COUNT,
} from "./professionalFixedLocationCalendar.data";

import ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBands from "./ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBands";

import ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookings from "./ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookings";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBag = Pick<
  Vm,
  | "activeDateIso"
  | "appliedFilters"
  | "availabilityHoverTitle"
  | "blocksInRange"
  | "businessResponseWindowInput"
  | "clearTimelineHover"
  | "data"
  | "dateOverrides"
  | "endMin"
  | "eventsInRange"
  | "getBusyFor"
  | "getFilteredAvailabilityFor"
  | "grid"
  | "handleClientNameClick"
  | "handleTimelineHoverMove"
  | "knownResourceIds"
  | "m"
  | "onEmptyClick"
  | "openBookingMessages"
  | "openExistingBooking"
  | "openSplitScreenFromBooking"
  | "resolveEventColors"
  | "resourceNameById"
  | "responseTimeConfigured"
  | "rowPx"
  | "rows"
  | "scheduleRows"
  | "setAvailabilityHoverTitle"
  | "showSnackbar"
  | "slotLines"
  | "startMin"
  | "timelineGridSlotColors"
  | "todayIso"
  | "unavailableBookingTooltip"
  | "viewMode"
>;

type Resource = Vm["displayedResources"][number];

export type ProfessionalFixedLocationCalendarDayWeekViewLaneColumnProps = {
  bag: ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBag;
  columnKey: string;
  resource: Resource;
  date: string;
  colIdx: number;
  fallbackTeamId: string;
  laneColumnCount: number;
};

/** One day/member column: click layer, bands, blocks, booking cards */
export default function ProfessionalFixedLocationCalendarDayWeekViewLaneColumn({
  bag,
  columnKey: key,
  resource,
  date,
  colIdx,
  fallbackTeamId,
  laneColumnCount: laneColumnsLength,
}: ProfessionalFixedLocationCalendarDayWeekViewLaneColumnProps) {
  const {
    activeDateIso,
    appliedFilters,
    availabilityHoverTitle,
    blocksInRange,
    clearTimelineHover,
    data,
    dateOverrides,
    endMin,
    eventsInRange,
    getBusyFor,
    getFilteredAvailabilityFor,
    grid,
    handleTimelineHoverMove,
    knownResourceIds,
    m,
    onEmptyClick,
    rowPx,
    rows,
    scheduleRows,
    setAvailabilityHoverTitle,
    slotLines,
    startMin,
    timelineGridSlotColors,
    todayIso,
    unavailableBookingTooltip,
    viewMode,
  } = bag;

  const laneEvents = eventsInRange.filter((event) => {
    if (event.date !== date) return false;
    if (event.id.includes("::segment-")) {
      if (String(event.resourceId) === String(resource.id)) {
        return true;
      }
      const hasKnownTeam = knownResourceIds.has(String(event.resourceId));
      return !hasKnownTeam && resource.id === fallbackTeamId;
    }
    if (viewMode === "day") {
      if (eventBelongsToTeamMember(event, resource.id)) {
        return true;
      }
      const hasKnownTeam =
        Boolean(
          event.resourceId && knownResourceIds.has(String(event.resourceId)),
        ) ||
        Boolean(
          event.details?.services?.some(
            (service) =>
              service.teamMemberId &&
              knownResourceIds.has(String(service.teamMemberId)),
          ),
        );
      return !hasKnownTeam && resource.id === fallbackTeamId;
    }
    if (viewMode === "week") {
      if (eventBelongsToTeamMember(event, resource.id)) {
        return true;
      }
      const hasKnownTeam = eventHasKnownTeamAssignment(
        event,
        knownResourceIds,
      );
      return !hasKnownTeam && resource.id === fallbackTeamId;
    }
    if (!event.resourceId || !knownResourceIds.has(event.resourceId))
      return true;
    return event.resourceId === resource.id;
  });
  const laneBlocks = blocksInRange.filter((block) => {
    if (block.date !== date) return false;
    if (viewMode === "day") {
      if (!block.resourceId || !knownResourceIds.has(block.resourceId)) {
        return resource.id === fallbackTeamId;
      }
      return block.resourceId === resource.id;
    }
    if (viewMode === "week") {
      if (!block.resourceId || !knownResourceIds.has(block.resourceId))
        return true;
      return block.resourceId === resource.id;
    }
    if (!block.resourceId || !knownResourceIds.has(block.resourceId))
      return true;
    return block.resourceId === resource.id;
  });

  // Availability comes from the team member's Schedule.
  const availability = getFilteredAvailabilityFor(resource.id, date);
  const locationBands = getLocationAvailabilityBands(
    resource.id,
    date,
    data.supportedLocations,
    scheduleRows,
    dateOverrides ?? [],
    availability,
  ).filter((band) => {
    if (appliedFilters.locationAll) return true;
    if (band.kind === "fixed") {
      return Boolean(appliedFilters.locations.FL);
    }
    if (band.kind === "desired") {
      return Boolean(appliedFilters.locations.DL);
    }
    return (
      Boolean(appliedFilters.locations.FL) ||
      Boolean(appliedFilters.locations.DL)
    );
  });
  const unavailableIntervals = subtractIntervals(
    [{ startMin, endMin }],
    availability,
  );
  const offersBothLocations =
    data.supportedLocations.includes("FL") &&
    data.supportedLocations.includes("DL");
  const busyIntervals = getBusyFor(resource.id, date);
  const isPastDay = date < todayIso;
  const bookingAddDisabled = isPastDay || availability.length === 0;
  const weekDayCrowded =
    viewMode === "week" &&
    laneEvents.length >= WEEK_DAY_CROWDED_BOOKING_COUNT;
  const isActiveWeekDay = viewMode === "week" && date === activeDateIso;

  return (
    <Box
      key={key}
      onMouseMoveCapture={handleTimelineHoverMove}
      onMouseLeave={clearTimelineHover}
      sx={{
        position: "relative",
        borderLeft:
          colIdx > 0 ? `1px solid ${alpha(m.navy, 0.07)}` : undefined,
        height: rows * rowPx,
        bgcolor: isActiveWeekDay ? alpha(m.teal, 0.02) : "transparent",
        overflow: "visible",
        scrollSnapAlign:
          viewMode === "week" || viewMode === "day" ? "start" : undefined,
        ...(isPastDay ? { opacity: 0.72 } : null),
      }}
    >
      {/* Click layer — below booking cards */}
      <Tooltip
        title={availabilityHoverTitle}
        followCursor
        disableHoverListener={!availabilityHoverTitle}
        arrow
        placement="top"
      >
        <Box
          onClick={(e) => {
            if (bookingAddDisabled) return;
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minutes =
              startMin + Math.floor(y / rowPx) * grid.stepMinutes;
            onEmptyClick(resource.id, date, minutes, {
              top: e.clientY,
              left: e.clientX,
            });
          }}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minutes = startMin + (y / rowPx) * grid.stepMinutes;
            const kind = locationAvailabilityKindAtMinute(
              locationBands,
              minutes,
            );
            const isBusy = busyIntervals.some(
              (interval) =>
                minutes >= interval.startMin && minutes < interval.endMin,
            );
            setAvailabilityHoverTitle(
              !kind || isBusy
                ? unavailableBookingTooltip
                : locationAvailabilityTooltip(kind),
            );
          }}
          sx={{
            position: "absolute",
            inset: 0,
            cursor: bookingAddDisabled ? "default" : "pointer",
            zIndex: 2,
          }}
        />
      </Tooltip>

      {/* Per-slot row backgrounds (:00 dark, :30 light, :15/:45 normal) */}
      {slotLines.map((t) => (
        <Box
          key={`slot-bg-${resource.id}-${date}-${t}`}
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: ((t - startMin) / grid.stepMinutes) * rowPx,
            height: rowPx,
            bgcolor: timelineGridSlotBg(t, timelineGridSlotColors),
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      <ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBands
        bag={bag}
        resourceId={resource.id}
        date={date}
        unavailableIntervals={unavailableIntervals}
        locationBands={locationBands}
        offersBothLocations={offersBothLocations}
        laneBlocks={laneBlocks}
        laneEvents={laneEvents}
      />

      <ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookings
        bag={bag}
        laneEvents={laneEvents}
        weekDayCrowded={weekDayCrowded}
        colIdx={colIdx}
        laneColumnCount={laneColumnsLength}
      />
    </Box>
  );
}
