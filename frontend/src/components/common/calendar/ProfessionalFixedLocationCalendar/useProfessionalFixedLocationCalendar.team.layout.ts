import * as React from "react";
import { alpha } from "@mui/material/styles";
import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  getCombinedAvailabilityIntervals,
  hasScheduleWindowsOnDate,
} from "../calendar-schedule.utils";
import {
  dailyBookingOccupancyRatio,
  getDefaultCalendarResourceId,
  mergeIntervals,
  minutesSinceMidnight,
  parseIsoDate,
} from "../calendar.utils";
import { rankResourcesForCalendarDay } from "../teamMemberBookings";
import {
  TEAM_NAV_SCROLLBAR_PX,
  TEAM_NAV_VISIBLE_SLOTS,
} from "./professionalFixedLocationCalendar.data";
import {
  buildBusyIntervalsForResource,
  filterResourcesForVisibleDates,
} from "./useProfessionalFixedLocationCalendar.helpers";
import {
  buildDayViewTeamLayoutSource,
  resolveDayViewColumnHeaderResources,
} from "./useProfessionalFixedLocationCalendar.helpers.dayView";
import type { UseProfessionalFixedLocationCalendarTeamArgs } from "./useProfessionalFixedLocationCalendar.team";

function locationScopeForLeave(
  locationAll: boolean | undefined,
  locations: Readonly<Record<"FL" | "DL", boolean>> | undefined,
): CalendarBookingLocation[] | null {
  if (locationAll !== false || !locations) return null;
  const selected = (["FL", "DL"] as const).filter((loc) => locations[loc]);
  return selected.length ? [...selected] : null;
}

/** Resource filter/rank + column layout (ponytail: subdomain of team). */
export function useProfessionalFixedLocationCalendarTeamLayout({
  resources,
  events,
  blocks,
  scheduleRows,
  dateOverrides,
  dataAvailability,
  filterDrawerResources,
  eventsMatchingDrawerFilters,
  teamAll,
  visibleDates,
  viewMode,
  activeDateIso,
  locationAll,
  locations,
  navy,
  laneHeaderPx = 48,
}: UseProfessionalFixedLocationCalendarTeamArgs) {
  const [selectedResourceId, setSelectedResourceId] = React.useState("");
  const userPickedTeamMemberRef = React.useRef(false);
  const [splitScreen, setSplitScreen] = React.useState<{
    primaryId: string;
    partnerId: string;
  } | null>(null);

  const knownTeamMemberIds = React.useMemo(
    () => new Set(resources.map((resource) => String(resource.id))),
    [resources],
  );
  const fallbackTeamMemberId = String(resources[0]?.id ?? "");

  const filteredResources = React.useMemo(
    () =>
      filterResourcesForVisibleDates({
        teamAll,
        filterDrawerResources,
        visibleDates,
        scheduleRows,
        blocks,
        eventsMatchingDrawerFilters,
      }),
    [
      blocks,
      eventsMatchingDrawerFilters,
      filterDrawerResources,
      scheduleRows,
      teamAll,
      visibleDates,
    ],
  );

  const alphabeticalResources = React.useMemo(
    () =>
      [...filteredResources].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [filteredResources],
  );
  const dayRankedResources = React.useMemo(() => {
    // Solo / empty team: unassigned lane only — do not apply leave hide/sort.
    if (resources.length === 0) return filteredResources;

    const leaveLocations = locationScopeForLeave(locationAll, locations);
    const overrides = dateOverrides ?? [];
    const isOnLeave = (resourceId: string) =>
      !hasScheduleWindowsOnDate(
        resourceId,
        activeDateIso,
        scheduleRows,
        overrides,
        leaveLocations,
      );

    // Same occupancy source as header % bars (busy ÷ availability).
    const getOccupancyRatio = (resourceId: string) => {
      const busy = buildBusyIntervalsForResource({
        resourceId,
        iso: activeDateIso,
        events,
        blocks,
        fallbackTeamMemberId,
        knownTeamMemberIds,
      });
      const fromSchedule = getCombinedAvailabilityIntervals(
        resourceId,
        activeDateIso,
        scheduleRows,
        overrides,
      );
      if (fromSchedule.length) {
        return dailyBookingOccupancyRatio(busy, mergeIntervals(fromSchedule));
      }
      const av = dataAvailability?.find(
        (row) => row.resourceId === resourceId,
      );
      if (!av) return dailyBookingOccupancyRatio(busy, []);
      const dow = parseIsoDate(activeDateIso).getUTCDay() as
        | 0
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6;
      const windows = av.weekly[dow] ?? [];
      return dailyBookingOccupancyRatio(
        busy,
        mergeIntervals(
          windows.map((window) => ({
            startMin: minutesSinceMidnight(window.start),
            endMin: minutesSinceMidnight(window.end),
          })),
        ),
      );
    };

    // Confirmed rule 3: available busiest→freest→alpha, leave last (All + specific).
    // Rule 4: selected leave stay in roster via filterResourcesForVisibleDates.
    return rankResourcesForCalendarDay(filteredResources, getOccupancyRatio, {
      isOnLeave,
    });
  }, [
    activeDateIso,
    blocks,
    dataAvailability,
    dateOverrides,
    events,
    fallbackTeamMemberId,
    filteredResources,
    knownTeamMemberIds,
    locationAll,
    locations,
    resources.length,
    scheduleRows,
  ]);
  const teamNavResources =
    viewMode === "day" ? dayRankedResources : alphabeticalResources;
  const defaultDaySelectedResourceId =
    getDefaultCalendarResourceId(dayRankedResources);
  const defaultWeekSelectedResourceId =
    getDefaultCalendarResourceId(alphabeticalResources);

  React.useLayoutEffect(() => {
    if (viewMode !== "day") return;
    userPickedTeamMemberRef.current = false;
  }, [activeDateIso, viewMode]);

  React.useLayoutEffect(() => {
    if (filteredResources.length === 0) {
      setSelectedResourceId("");
      return;
    }
    const defaultResourceId =
      viewMode === "day"
        ? defaultDaySelectedResourceId
        : defaultWeekSelectedResourceId;
    setSelectedResourceId((current) => {
      const stillValid =
        Boolean(current) &&
        filteredResources.some((resource) => resource.id === current);
      if (!stillValid) {
        userPickedTeamMemberRef.current = false;
        return defaultResourceId;
      }
      if (!userPickedTeamMemberRef.current && viewMode === "day") {
        return defaultDaySelectedResourceId;
      }
      return current;
    });
  }, [
    defaultDaySelectedResourceId,
    defaultWeekSelectedResourceId,
    filteredResources,
    viewMode,
  ]);

  const hasTeamMembers = resources.length > 0;
  // One source: body columns are always a prefix of headerResources (same order).
  const dayViewTeamLayout = React.useMemo(
    () =>
      buildDayViewTeamLayoutSource({
        viewMode,
        splitScreen,
        resourcesLength: resources.length,
        filteredResources,
        selectedResourceId,
        defaultDaySelectedResourceId,
        dayRankedResources,
        eventsMatchingDrawerFilters,
        activeDateIso,
        teamAll,
        defaultVisibleSlots: TEAM_NAV_VISIBLE_SLOTS,
      }),
    [
      activeDateIso,
      defaultDaySelectedResourceId,
      dayRankedResources,
      eventsMatchingDrawerFilters,
      filteredResources,
      resources.length,
      selectedResourceId,
      splitScreen,
      teamAll,
      viewMode,
    ],
  );
  const dayViewMemberColumnSource = dayViewTeamLayout.memberColumns;
  const dayViewBodyGridTemplateColumns =
    dayViewMemberColumnSource.length > 1
      ? `repeat(${dayViewMemberColumnSource.length}, minmax(0, 1fr))`
      : "1fr";
  // Focus group (selected + shared partners) fits without scroll; else default 3.
  const teamHeaderVisibleSlots =
    viewMode === "day"
      ? dayViewTeamLayout.visibleSlots
      : TEAM_NAV_VISIBLE_SLOTS;
  const dayViewBodyNeedsScroll =
    viewMode === "day" &&
    dayViewMemberColumnSource.length > teamHeaderVisibleSlots;
  const dayViewBodyScrollContentWidth = dayViewBodyNeedsScroll
    ? `calc(100% * ${dayViewMemberColumnSource.length} / ${teamHeaderVisibleSlots})`
    : "100%";
  // Week always needs the date header row; day only needs a header when staff exist.
  const timelineHeaderRows =
    viewMode === "week" ? (hasTeamMembers ? 2 : 1) : hasTeamMembers ? 1 : 0;
  // Day: full ordered roster in header; body uses focus/split columns only.
  const teamHeaderResources =
    viewMode === "day"
      ? resolveDayViewColumnHeaderResources(dayViewTeamLayout)
      : teamNavResources;
  const timelineHeaderMemberCount = teamHeaderResources.length;
  const teamHeaderScrollReservePx =
    hasTeamMembers && timelineHeaderMemberCount > teamHeaderVisibleSlots
      ? TEAM_NAV_SCROLLBAR_PX
      : 0;
  const timelineHeaderPx =
    laneHeaderPx * timelineHeaderRows + teamHeaderScrollReservePx;

  const resetToDefaultTeamMember = React.useCallback(() => {
    userPickedTeamMemberRef.current = false;
    setSelectedResourceId("");
  }, []);

  const activeResource = React.useMemo(
    () =>
      filteredResources.find((r) => r.id === selectedResourceId) ??
      filteredResources.find((r) =>
        viewMode === "day"
          ? r.id === defaultDaySelectedResourceId
          : r.id === defaultWeekSelectedResourceId,
      ) ??
      (viewMode === "day" ? dayRankedResources[0] : alphabeticalResources[0]) ??
      filteredResources[0],
    [
      alphabeticalResources,
      dayRankedResources,
      defaultDaySelectedResourceId,
      defaultWeekSelectedResourceId,
      filteredResources,
      selectedResourceId,
      viewMode,
    ],
  );

  React.useEffect(() => {
    if (viewMode !== "day") {
      setSplitScreen(null);
    }
  }, [viewMode]);

  React.useEffect(() => {
    if (!splitScreen) return;
    const isValid = (resourceId: string) =>
      filteredResources.some((resource) => resource.id === resourceId);
    if (!isValid(splitScreen.primaryId) || !isValid(splitScreen.partnerId)) {
      setSplitScreen(null);
    }
  }, [filteredResources, splitScreen]);

  const selectTeamMember = React.useCallback(
    (resourceId: string) => {
      const normalizedId = String(resourceId);
      if (!resources.some((resource) => String(resource.id) === normalizedId))
        return;

      userPickedTeamMemberRef.current = true;
      setSelectedResourceId(normalizedId);
    },
    [resources],
  );

  const displayedResources = React.useMemo(() => {
    // No team members yet: keep one anonymous lane so the time grid still renders.
    const emptyLane = {
      id: "unassigned",
      name: "Unassigned",
      avatarText: "U",
    } as (typeof filteredResources)[number];
    if (viewMode === "week") {
      if (activeResource) return [activeResource];
      return resources.length === 0 ? [emptyLane] : [];
    }
    // Day view: one outer lane; selected member full width (split screen = two columns).
    if (viewMode === "day") {
      if (dayViewMemberColumnSource.length === 0) return [];
      return [
        {
          id: "__day_view_lane__",
          name: "",
          avatarText: "",
        } as (typeof filteredResources)[number],
      ];
    }
    return filteredResources;
  }, [
    activeResource,
    resources.length,
    dayViewMemberColumnSource.length,
    filteredResources,
    viewMode,
  ]);

  const dayViewMemberColumns = dayViewMemberColumnSource;
  const teamHeaderMemberCount = teamHeaderResources.length;
  const teamHeaderWiderThanViewport =
    teamHeaderMemberCount > teamHeaderVisibleSlots;
  // Focus prefix fills visibleSlots; remainder stays in the horizontal scroller.
  // Body sync only when column counts match (see horizontalScroll); otherwise
  // header scrolls alone and resets to 0 when focus/resources change.
  const teamHeaderNeedsScroll = teamHeaderWiderThanViewport;
  const teamHeaderScrollContentWidth = teamHeaderWiderThanViewport
    ? `calc(100% * ${teamHeaderMemberCount} / ${teamHeaderVisibleSlots})`
    : "100%";
  const teamHeaderGridTemplateColumns =
    teamHeaderMemberCount > 0
      ? `repeat(${teamHeaderMemberCount}, minmax(0, 1fr))`
      : "1fr";
  // Header scroll chrome follows header member count.
  const teamHeaderScrollOverflowSx = {
    overflowX: teamHeaderNeedsScroll ? ("scroll" as const) : ("hidden" as const),
    overflowY: "hidden" as const,
    WebkitOverflowScrolling: "touch" as const,
    scrollSnapType: teamHeaderNeedsScroll ? ("x mandatory" as const) : ("none" as const),
    ...(teamHeaderNeedsScroll
      ? {
          scrollbarGutter: "stable" as const,
          scrollbarWidth: "thin" as const,
          "&::-webkit-scrollbar": {
            height: TEAM_NAV_SCROLLBAR_PX,
            display: "block",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: alpha(navy, 0.06),
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(navy, 0.32),
            borderRadius: "999px",
          },
        }
      : {
          scrollbarWidth: "none" as const,
          msOverflowStyle: "none" as const,
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }),
  };

  return {
    activeResource,
    alphabeticalResources,
    dayRankedResources,
    dayViewBodyGridTemplateColumns,
    dayViewBodyNeedsScroll,
    dayViewBodyScrollContentWidth,
    dayViewMemberColumnSource,
    dayViewMemberColumns,
    defaultDaySelectedResourceId,
    defaultWeekSelectedResourceId,
    displayedResources,
    fallbackTeamMemberId,
    filteredResources,
    hasTeamMembers,
    knownTeamMemberIds,
    resetToDefaultTeamMember,
    selectTeamMember,
    selectedResourceId,
    setSelectedResourceId,
    setSplitScreen,
    splitScreen,
    teamHeaderGridTemplateColumns,
    teamHeaderMemberCount,
    teamHeaderNeedsScroll,
    teamHeaderResources,
    teamHeaderScrollContentWidth,
    teamHeaderScrollOverflowSx,
    teamHeaderScrollReservePx,
    teamHeaderVisibleSlots,
    teamNavResources,
    timelineHeaderMemberCount,
    timelineHeaderPx,
    timelineHeaderRows,
    userPickedTeamMemberRef,
  };
}
