"use client";

import {
  Box,
  Tooltip,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import {
  useProfessionalFixedLocationCalendar,
} from "./useProfessionalFixedLocationCalendar";

import {
  formatWeekDayName,
  formatWeekDayDate,
} from "./professionalFixedLocationCalendar.data";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeaderBag = Pick<
  Vm,
  | "activeDateIso"
  | "getDailyBookingRatio"
  | "getFilteredAvailabilityFor"
  | "m"
  | "renderTeamMemberScrollButton"
  | "scrollWeekDays"
  | "setActiveDateIso"
  | "syncWeekHorizontalScroll"
  | "todayIso"
  | "viewMode"
  | "weekDaysGridTemplateColumns"
  | "weekDaysNeedScroll"
  | "weekDaysScrollContentWidth"
  | "weekDaysScrollEdges"
  | "weekDaysScrollOverflowSx"
  | "weekDaysScrollRef"
  | "weekDaysViewportRef"
  | "laneHeaderPx"
>;

type Resource = Vm["displayedResources"][number];

export type ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeaderProps = {
  bag: ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeaderBag;
  resource: Resource;
  laneDates: string[];
};

/** Week-view day-name header strip for one team lane */
export default function ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeader({
  bag,
  resource: res,
  laneDates,
}: ProfessionalFixedLocationCalendarDayWeekViewWeekDaysHeaderProps) {
  const {
    activeDateIso,
    getDailyBookingRatio,
    getFilteredAvailabilityFor,
    m,
    renderTeamMemberScrollButton,
    scrollWeekDays,
    setActiveDateIso,
    syncWeekHorizontalScroll,
    todayIso,
    viewMode,
    weekDaysGridTemplateColumns,
    weekDaysNeedScroll,
    weekDaysScrollContentWidth,
    weekDaysScrollEdges,
    weekDaysScrollOverflowSx,
    weekDaysScrollRef,
    weekDaysViewportRef,
    laneHeaderPx,
  } = bag;

  return (
                          viewMode === "week" ? (
                            <Box
                              ref={weekDaysViewportRef}
                              sx={{
                                position: "relative",
                                height: laneHeaderPx,
                                bgcolor: "#fff",
                                borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                                minWidth: 0,
                                width: "100%",
                              }}
                            >
                              {weekDaysNeedScroll ? (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    left: 6,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 2,
                                  }}
                                >
                                  {renderTeamMemberScrollButton(
                                    "left",
                                    () => scrollWeekDays(-1),
                                    !weekDaysScrollEdges.canLeft,
                                    "Scroll week days left",
                                  )}
                                </Box>
                              ) : null}
                              <Box
                                ref={weekDaysScrollRef}
                                onScroll={() => syncWeekHorizontalScroll("header")}
                                sx={{
                                  ...weekDaysScrollOverflowSx,
                                  height: "100%",
                                  minWidth: 0,
                                  containerType: "inline-size",
                                  scrollSnapType: weekDaysNeedScroll
                                    ? "x mandatory"
                                    : "none",
                                }}
                              >
                                <Box
                                  sx={{
                                    height: "100%",
                                    display: "grid",
                                    gridTemplateColumns:
                                      weekDaysGridTemplateColumns,
                                    width: weekDaysScrollContentWidth,
                                    minWidth: "100%",
                                  }}
                                >
                              {laneDates.map((date, colIdx) => {
                                const isActiveDay = date === activeDateIso;
                                const isPastDay = date < todayIso;
                                const showClosed =
                                  !isPastDay &&
                                  getFilteredAvailabilityFor(res.id, date)
                                    .length === 0;
                                const closedNote = showClosed
                                  ? "No schedule availability"
                                  : null;
                                const ratio = Math.round(
                                  getDailyBookingRatio(res.id, date) * 100,
                                );

                                return (
                                  <Tooltip
                                    key={`week-day-${date}`}
                                    title={closedNote || ""}
                                    disableHoverListener={!closedNote}
                                    arrow
                                    placement="top"
                                  >
                                  <Box
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isActiveDay}
                                    aria-label={`Select ${formatWeekDayName(date)} ${formatWeekDayDate(date)}`}
                                    onClick={() => setActiveDateIso(date)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setActiveDateIso(date);
                                      }
                                    }}
                                    sx={{
                                      minWidth: 0,
                                      scrollSnapAlign: "start",
                                      px: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexDirection: "column",
                                      cursor: "pointer",
                                      borderLeft:
                                        colIdx > 0
                                          ? `1px solid ${alpha(m.navy, 0.07)}`
                                          : undefined,
                                      bgcolor: showClosed
                                        ? m.blockedTimeBg
                                        : isActiveDay
                                          ? alpha(m.teal, 0.035)
                                          : "#fff",
                                      opacity: isPastDay ? 0.66 : 1,
                                      "&:hover": {
                                        bgcolor: showClosed
                                          ? alpha(m.blockedTimeFg, 0.16)
                                          : isActiveDay
                                            ? alpha(m.teal, 0.05)
                                            : alpha(m.navy, 0.02),
                                      },
                                    }}
                                  >
                                    <BodyText
                                      sx={{
                                        fontSize: 11,
                                        fontWeight: 900,
                                        color: showClosed
                                          ? m.blockedTimeFg
                                          : alpha(m.navy, 0.78),
                                        lineHeight: 1.1,
                                      }}
                                    >
                                      {formatWeekDayName(date)}
                                    </BodyText>
                                    <BodyText
                                      sx={{
                                        mt: 0.3,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: showClosed
                                          ? m.blockedTimeFg
                                          : alpha(m.navy, 0.5),
                                        lineHeight: 1,
                                      }}
                                    >
                                      {formatWeekDayDate(date)}
                                    </BodyText>
                                    <Box
                                      sx={{
                                        mt: 0.45,
                                        height: 3,
                                        width: "70%",
                                        maxWidth: 58,
                                        minWidth: 28,
                                        borderRadius: "999px",
                                        bgcolor: showClosed
                                          ? alpha(m.blockedTimeFg, 0.2)
                                          : m.fxGrayF2F4F7,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          height: "100%",
                                          // No schedule → empty track (not a fake 0%/filled look).
                                          width: showClosed ? "0%" : `${ratio}%`,
                                          bgcolor: isActiveDay
                                            ? m.teal
                                            : alpha(m.navy, 0.24),
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                  </Tooltip>
                                );
                              })}
                                </Box>
                              </Box>
                              {weekDaysNeedScroll ? (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    right: 6,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 2,
                                  }}
                                >
                                  {renderTeamMemberScrollButton(
                                    "right",
                                    () => scrollWeekDays(1),
                                    !weekDaysScrollEdges.canRight,
                                    "Scroll week days right",
                                  )}
                                </Box>
                              ) : null}
                            </Box>
                          ) : null
  );
}
