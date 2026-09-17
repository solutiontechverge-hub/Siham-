import * as React from "react";
import type { CalendarViewMode } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  getCalendarQueryDateRange,
  toIsoLocalDate,
  toMonthIso,
  type CalendarQueryDateRange,
} from "../calendar.utils";
import {
  buildVisibleDates,
  computeNextActiveDateIso,
  computePrevCandidateIso,
} from "./useProfessionalFixedLocationCalendar.helpers";

export type UseProfessionalFixedLocationCalendarViewNavigationArgs = {
  onDateRangeChange?: (range: CalendarQueryDateRange) => void;
};

export function useProfessionalFixedLocationCalendarViewNavigation({
  onDateRangeChange,
}: UseProfessionalFixedLocationCalendarViewNavigationArgs) {
  const defaultDateIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("day");
  const [activeDateIso, setActiveDateIso] = React.useState(defaultDateIso);

  React.useEffect(() => {
    onDateRangeChange?.(getCalendarQueryDateRange(activeDateIso, viewMode));
  }, [activeDateIso, onDateRangeChange, viewMode]);

  const visibleDates = React.useMemo(
    () => buildVisibleDates(viewMode, activeDateIso),
    [activeDateIso, viewMode],
  );

  const [todayIso, setTodayIso] = React.useState(defaultDateIso);
  const [nowMin, setNowMin] = React.useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      setNowMin(now.getHours() * 60 + now.getMinutes());
      setTodayIso(toIsoLocalDate(now));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const activeMonthIso = React.useMemo(
    () => toMonthIso(activeDateIso),
    [activeDateIso],
  );

  const prevCandidateIso = React.useMemo(
    () => computePrevCandidateIso(viewMode, activeDateIso, activeMonthIso),
    [activeDateIso, activeMonthIso, viewMode],
  );

  const goToday = React.useCallback(() => {
    setActiveDateIso(todayIso);
    setViewMode("day");
  }, [todayIso]);

  const onPrev = React.useCallback(() => {
    setActiveDateIso(prevCandidateIso);
  }, [prevCandidateIso]);

  const onNext = React.useCallback(() => {
    setActiveDateIso(
      computeNextActiveDateIso(viewMode, activeDateIso, activeMonthIso),
    );
  }, [activeDateIso, activeMonthIso, viewMode]);

  return {
    activeDateIso,
    activeMonthIso,
    defaultDateIso,
    goToday,
    nowMin,
    onNext,
    onPrev,
    prevCandidateIso,
    setActiveDateIso,
    setNowMin,
    setTodayIso,
    setViewMode,
    todayIso,
    viewMode,
    visibleDates,
  };
}
