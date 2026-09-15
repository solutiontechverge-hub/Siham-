import * as React from "react";
import { alpha } from "@mui/material/styles";
import { getCombinedAvailabilityIntervals } from "../calendar-schedule.utils";
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
  buildDayViewMemberColumnSource,
  filterResourcesForVisibleDates,
} from "./useProfessionalFixedLocationCalendar.helpers";
import type { UseProfessionalFixedLocationCalendarTeamArgs } from "./useProfessionalFixedLocationCalendar.team";

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
        dateOverrides ?? [],
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
    return rankResourcesForCalendarDay(filteredResources, getOccupancyRatio);
  }, [
    activeDateIso,
    blocks,
    dataAvailability,
    dateOverrides,
    events,
    fallbackTeamMemberId,
    filteredResources,
    knownTeamMemberIds,
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
  const dayViewMemberColumnSource = React.useMemo(
    () =>
      buildDayViewMemberColumnSource({
        viewMode,
        splitScreen,
        resourcesLength: resources.length,
        filteredResources,
        dayRankedResources,
      }),
    [
      resources.length,
      dayRankedResources,
      filteredResources,
      splitScreen,
      viewMode,
    ],
  );
  const dayViewBodyGridTemplateColumns =
    dayViewMemberColumnSource.length > 1
      ? `repeat(${dayViewMemberColumnSource.length}, minmax(0, 1fr))`
      : "1fr";
  // Week always needs the date header row; day only needs a header when staff exist.
  const timelineHeaderRows =
    viewMode === "week" ? (hasTeamMembers ? 2 : 1) : hasTeamMembers ? 1 : 0;
  // Header scrollbar only when visible header columns exceed the slot cap.
  const timelineHeaderMemberCount =
    viewMode === "day"
      ? dayViewMemberColumnSource.length
      : teamNavResources.length;
  const teamHeaderScrollReservePx =
    hasTeamMembers && timelineHeaderMemberCount > TEAM_NAV_VISIBLE_SLOTS
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
  const teamHeaderResources =
    viewMode === "day" && dayViewMemberColumns.length > 0
      ? dayViewMemberColumns
      : teamNavResources;
  const teamHeaderMemberCount = teamHeaderResources.length;
  const teamHeaderNeedsScroll = teamHeaderMemberCount > TEAM_NAV_VISIBLE_SLOTS;
  const teamHeaderScrollContentWidth = teamHeaderNeedsScroll
    ? `calc(100% * ${teamHeaderMemberCount} / ${TEAM_NAV_VISIBLE_SLOTS})`
    : "100%";
  const teamHeaderGridTemplateColumns =
    viewMode === "day" && dayViewMemberColumns.length > 0
      ? dayViewBodyGridTemplateColumns
      : teamHeaderMemberCount > 0
        ? `repeat(${teamHeaderMemberCount}, minmax(0, 1fr))`
        : "1fr";
  // Header scroll chrome must follow visible header columns (day), not the full nav list.
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
    teamNavResources,
    timelineHeaderMemberCount,
    timelineHeaderPx,
    timelineHeaderRows,
    userPickedTeamMemberRef,
  };
}
