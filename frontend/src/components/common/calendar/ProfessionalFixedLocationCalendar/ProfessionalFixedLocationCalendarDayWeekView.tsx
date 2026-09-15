"use client";

import {
  Box,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import CalendarTimelineHoverIndicator from "../CalendarTimelineHoverIndicator";

import {
  fmtTimeLabel,
} from "../calendar.utils";

import {
  useProfessionalFixedLocationCalendar,
} from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarDayWeekViewTimeColumn from "./ProfessionalFixedLocationCalendarDayWeekViewTimeColumn";

import ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeader from "./ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeader";

import ProfessionalFixedLocationCalendarDayWeekViewLaneColumn from "./ProfessionalFixedLocationCalendarDayWeekViewLaneColumn";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarDayWeekBag = Pick<
  Vm,
  | "activeDateIso"
  | "appliedFilters"
  | "availabilityHoverTitle"
  | "blocksInRange"
  | "businessResponseWindowInput"
  | "clearTimelineHover"
  | "data"
  | "dateOverrides"
  | "dayBodyScrollRef"
  | "dayViewBodyGridTemplateColumns"
  | "dayViewMemberColumns"
  | "displayedResources"
  | "endMin"
  | "events"
  | "eventsInRange"
  | "getBusyFor"
  | "getDailyBookingRatio"
  | "getFilteredAvailabilityFor"
  | "grid"
  | "handleClientNameClick"
  | "handleTimelineHoverMove"
  | "hasTeamMembers"
  | "knownResourceIds"
  | "laneHeaderPx"
  | "locations"
  | "m"
  | "nowLineTop"
  | "onEmptyClick"
  | "openBookingMessages"
  | "openExistingBooking"
  | "openSplitScreenFromBooking"
  | "renderSplitScreenBanner"
  | "renderTeamMemberHeader"
  | "renderTeamMemberScrollButton"
  | "resolveEventColors"
  | "resourceNameById"
  | "responseTimeConfigured"
  | "rowPx"
  | "rows"
  | "scheduleRows"
  | "scrollWeekDays"
  | "setActiveDateIso"
  | "setAvailabilityHoverTitle"
  | "showNowLine"
  | "showSnackbar"
  | "slotLines"
  | "startMin"
  | "syncDayTeamHorizontalScroll"
  | "syncWeekHorizontalScroll"
  | "teamHeaderNeedsScroll"
  | "teamHeaderScrollContentWidth"
  | "teamHeaderScrollOverflowSx"
  | "timelineGridRef"
  | "timelineGridSlotColors"
  | "timelineHeaderPx"
  | "timelineHover"
  | "todayIso"
  | "unavailableBookingTooltip"
  | "viewMode"
  | "visibleDates"
  | "weekBodyScrollRef"
  | "weekDaysGridTemplateColumns"
  | "weekDaysNeedScroll"
  | "weekDaysScrollContentWidth"
  | "weekDaysScrollEdges"
  | "weekDaysScrollOverflowSx"
  | "weekDaysScrollRef"
  | "weekDaysViewportRef"
>;

export type ProfessionalFixedLocationCalendarDayWeekViewProps = {
  bag: ProfessionalFixedLocationCalendarDayWeekBag;
};

export default function ProfessionalFixedLocationCalendarDayWeekView({ bag }: ProfessionalFixedLocationCalendarDayWeekViewProps) {
  const {
    activeDateIso,
    clearTimelineHover,
    data,
    dayBodyScrollRef,
    dayViewBodyGridTemplateColumns,
    dayViewMemberColumns,
    displayedResources,
    hasTeamMembers,
    m,
    nowLineTop,
    renderSplitScreenBanner,
    renderTeamMemberHeader,
    showNowLine,
    syncDayTeamHorizontalScroll,
    syncWeekHorizontalScroll,
    teamHeaderNeedsScroll,
    teamHeaderScrollContentWidth,
    teamHeaderScrollOverflowSx,
    timelineGridRef,
    timelineHeaderPx,
    timelineHover,
    viewMode,
    visibleDates,
    weekBodyScrollRef,
    weekDaysGridTemplateColumns,
    weekDaysNeedScroll,
    weekDaysScrollContentWidth,
    weekDaysScrollOverflowSx,
  } = bag;

  return (
    <>
              <Box
                sx={{
                  borderRadius: "1px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  overflowX: "hidden",
                  overflowY: "visible",
                  bgcolor: "#fff",
                }}
              >
                {viewMode === "day" && hasTeamMembers
                  ? renderSplitScreenBanner()
                  : null}
                <Box
                  ref={timelineGridRef}
                  onMouseLeave={clearTimelineHover}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "48px minmax(0, 1fr)",
                    bgcolor: m.fxSurface,
                    position: "relative",
                    minWidth: 0,
                  }}
                >
                  {timelineHover ? (
                    <CalendarTimelineHoverIndicator
                      top={timelineHover.absoluteTop}
                      timeLabel={fmtTimeLabel(timelineHover.timeMin)}
                    />
                  ) : null}
                  {showNowLine ? (
                    <>
                      <Box
                        sx={{
                          position: "absolute",
                          gridColumn: "1 / -1",
                          gridRow: 1,
                          left: 36,
                          top: timelineHeaderPx + nowLineTop - 4,
                          width: 8,
                          height: 8,
                          borderRadius: "999px",
                          bgcolor: "#FF2F64",
                          border: "1px solid #fff",
                          zIndex: 20,
                          pointerEvents: "none",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          gridColumn: "1 / -1",
                          gridRow: 1,
                          left: 48,
                          right: 0,
                          top: timelineHeaderPx + nowLineTop,
                          height: 2,
                          bgcolor: "#FF2F64",
                          zIndex: 19,
                          pointerEvents: "none",
                        }}
                      />
                    </>
                  ) : null}
                  <ProfessionalFixedLocationCalendarDayWeekViewTimeColumn bag={bag} />

                  {/* Events canvas */}
                  <Box
                    sx={{
                      gridColumn: 2,
                      gridRow: 1,
                      position: "relative",
                      zIndex: 1,
                      bgcolor: m.fxSurface,
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    {displayedResources.map((res, laneIdx) => {
                      const laneDates =
                        viewMode === "week" ? visibleDates : [activeDateIso];
                      const fallbackTeamId = String(data.resources[0]?.id ?? "");
                      const laneColumns =
                        viewMode === "day"
                          ? dayViewMemberColumns.map((resource) => ({
                              key: resource.id,
                              resource,
                              date: activeDateIso,
                            }))
                          : laneDates.map((date) => ({
                              key: `${res.id}-${date}`,
                              resource: res,
                              date,
                            }));
                      return (
                        <Box
                          key={res.id}
                          sx={{
                            borderTop:
                              laneIdx > 0
                                ? `1px solid ${alpha(m.navy, 0.08)}`
                                : undefined,
                          }}
                        >
                          {hasTeamMembers &&
                          (viewMode === "week" || viewMode === "day")
                            ? renderTeamMemberHeader()
                            : null}
                          <ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeader
                            bag={bag}
                            resource={res}
                            laneDates={laneDates}
                          />

                          {/* Lane body */}
                          <Box
                            ref={
                              viewMode === "week"
                                ? weekBodyScrollRef
                                : viewMode === "day" && teamHeaderNeedsScroll
                                  ? dayBodyScrollRef
                                  : undefined
                            }
                            onScroll={
                              viewMode === "week"
                                ? () => syncWeekHorizontalScroll("body")
                                : viewMode === "day" && teamHeaderNeedsScroll
                                  ? () => syncDayTeamHorizontalScroll("body")
                                  : undefined
                            }
                            sx={{
                              position: "relative",
                              width: "100%",
                              minWidth: 0,
                              bgcolor: "#fff",
                              ...(viewMode === "week"
                                ? {
                                    ...weekDaysScrollOverflowSx,
                                    containerType: "inline-size",
                                    scrollSnapType: weekDaysNeedScroll
                                      ? "x mandatory"
                                      : "none",
                                  }
                                : viewMode === "day" && teamHeaderNeedsScroll
                                  ? {
                                      ...teamHeaderScrollOverflowSx,
                                      // Header already shows the scrollbar chrome.
                                      scrollbarWidth: "none",
                                      msOverflowStyle: "none",
                                      "&::-webkit-scrollbar": {
                                        display: "none",
                                      },
                                    }
                                  : null),
                            }}
                          >
                          <Box
                            sx={{
                              position: "relative",
                              display: "grid",
                              gridTemplateColumns:
                                viewMode === "day"
                                  ? dayViewBodyGridTemplateColumns
                                  : weekDaysGridTemplateColumns,
                              width:
                                viewMode === "week"
                                  ? weekDaysScrollContentWidth
                                  : teamHeaderScrollContentWidth,
                              minWidth: "100%",
                              bgcolor: "#fff",
                            }}
                          >
                            {laneColumns.map(
                              ({ key, resource, date }, colIdx) => (
                                <ProfessionalFixedLocationCalendarDayWeekViewLaneColumn
                                  key={key}
                                  bag={bag}
                                  columnKey={key}
                                  resource={resource}
                                  date={date}
                                  colIdx={colIdx}
                                  fallbackTeamId={fallbackTeamId}
                                  laneColumnCount={laneColumns.length}
                                />
                              ),
                            )}
                          </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
    </>
  );
}
