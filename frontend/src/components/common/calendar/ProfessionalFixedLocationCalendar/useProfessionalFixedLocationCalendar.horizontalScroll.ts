import * as React from "react";
import { WEEK_DAY_MIN_PX } from "./professionalFixedLocationCalendar.data";

export type UseProfessionalFixedLocationCalendarHorizontalScrollArgs = {
  viewMode: string;
  activeDateIso: string;
  teamHeaderNeedsScroll: boolean;
  teamHeaderVisibleSlots: number;
  teamHeaderResources: readonly unknown[];
  teamHeaderScrollContentWidth: string;
  /** Day body column count — sync header↔body scroll only when equal to header count. */
  dayViewBodyColumnCount: number;
  visibleDatesLength: number;
  displayedResourcesLength: number;
};

export function useProfessionalFixedLocationCalendarHorizontalScroll({
  viewMode,
  activeDateIso,
  teamHeaderNeedsScroll: _teamHeaderNeedsScroll,
  teamHeaderVisibleSlots,
  teamHeaderResources,
  teamHeaderScrollContentWidth,
  dayViewBodyColumnCount,
  visibleDatesLength,
  displayedResourcesLength,
}: UseProfessionalFixedLocationCalendarHorizontalScrollArgs) {
  const weekTeamHeaderScrollRef = React.useRef<HTMLDivElement>(null);
  const dayBodyScrollRef = React.useRef<HTMLDivElement>(null);
  const dayScrollSyncLockRef = React.useRef(false);
  const [weekTeamHeaderScrollEdges, setWeekTeamHeaderScrollEdges] =
    React.useState({
      canLeft: false,
      canRight: false,
    });

  const dayHeaderBodyScrollAligned =
    viewMode === "day" &&
    dayViewBodyColumnCount > 1 &&
    dayViewBodyColumnCount === teamHeaderResources.length;

  const refreshHorizontalScrollEdges = React.useCallback(
    (
      el: HTMLDivElement | null,
      setter: React.Dispatch<
        React.SetStateAction<{ canLeft: boolean; canRight: boolean }>
      >,
    ) => {
      if (!el) {
        setter({ canLeft: false, canRight: false });
        return;
      }
      const maxScroll = el.scrollWidth - el.clientWidth;
      setter({
        canLeft: el.scrollLeft > 2,
        canRight: maxScroll > 2 && el.scrollLeft < maxScroll - 2,
      });
    },
    [],
  );

  const refreshWeekTeamHeaderScrollEdges = React.useCallback(() => {
    refreshHorizontalScrollEdges(
      weekTeamHeaderScrollRef.current,
      setWeekTeamHeaderScrollEdges,
    );
  }, [refreshHorizontalScrollEdges]);

  const syncDayTeamHorizontalScroll = React.useCallback(
    (source: "header" | "body") => {
      refreshWeekTeamHeaderScrollEdges();
      if (!dayHeaderBodyScrollAligned || dayScrollSyncLockRef.current) return;
      const header = weekTeamHeaderScrollRef.current;
      const body = dayBodyScrollRef.current;
      if (!header || !body) return;
      dayScrollSyncLockRef.current = true;
      if (source === "header") {
        body.scrollLeft = header.scrollLeft;
      } else {
        header.scrollLeft = body.scrollLeft;
      }
      requestAnimationFrame(() => {
        dayScrollSyncLockRef.current = false;
      });
    },
    [dayHeaderBodyScrollAligned, refreshWeekTeamHeaderScrollEdges],
  );

  const onTeamHeaderScroll = React.useCallback(() => {
    if (dayHeaderBodyScrollAligned) {
      syncDayTeamHorizontalScroll("header");
      return;
    }
    // Focus/split: header scrolls alone (body stays on focus columns).
    refreshWeekTeamHeaderScrollEdges();
  }, [
    dayHeaderBodyScrollAligned,
    refreshWeekTeamHeaderScrollEdges,
    syncDayTeamHorizontalScroll,
  ]);

  // Focus/split: snap header back to leading prefix when focus/date/roster changes.
  React.useLayoutEffect(() => {
    if (viewMode !== "day" || dayHeaderBodyScrollAligned) return;
    const el = weekTeamHeaderScrollRef.current;
    if (!el || el.scrollLeft === 0) return;
    el.scrollLeft = 0;
    refreshWeekTeamHeaderScrollEdges();
  }, [
    activeDateIso,
    dayHeaderBodyScrollAligned,
    dayViewBodyColumnCount,
    refreshWeekTeamHeaderScrollEdges,
    teamHeaderResources,
    teamHeaderVisibleSlots,
    viewMode,
  ]);

  React.useEffect(() => {
    const el = weekTeamHeaderScrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => refreshWeekTeamHeaderScrollEdges());
    observer.observe(el);
    refreshWeekTeamHeaderScrollEdges();
    return () => observer.disconnect();
  }, [
    teamHeaderResources,
    teamHeaderScrollContentWidth,
    refreshWeekTeamHeaderScrollEdges,
  ]);

  const scrollTeamNav = React.useCallback(
    (el: HTMLDivElement | null, direction: -1 | 1): number | undefined => {
      if (!el) return undefined;
      const slots = Math.max(1, teamHeaderVisibleSlots);
      const step = el.clientWidth / slots;
      if (step <= 0) return undefined;
      const maxIndex = Math.max(
        0,
        Math.round((el.scrollWidth - el.clientWidth) / step),
      );
      const currentIndex = Math.round(el.scrollLeft / step);
      const nextLeft =
        Math.max(0, Math.min(maxIndex, currentIndex + direction)) * step;
      el.scrollTo({ left: nextLeft, behavior: "smooth" });
      return nextLeft;
    },
    [teamHeaderVisibleSlots],
  );

  const scrollWeekTeamHeader = React.useCallback(
    (direction: -1 | 1) => {
      const nextLeft = scrollTeamNav(
        weekTeamHeaderScrollRef.current,
        direction,
      );
      // Only mirror into body when column counts match (filter-narrowed day).
      // Focus/split: shorter body stays under leading header cells.
      if (
        typeof nextLeft === "number" &&
        viewMode === "day" &&
        dayHeaderBodyScrollAligned
      ) {
        dayBodyScrollRef.current?.scrollTo({
          left: nextLeft,
          behavior: "smooth",
        });
      }
    },
    [dayHeaderBodyScrollAligned, scrollTeamNav, viewMode],
  );

  const weekDayCount = visibleDatesLength;
  const weekDaysViewportRef = React.useRef<HTMLDivElement>(null);
  const weekDaysScrollRef = React.useRef<HTMLDivElement>(null);
  const weekBodyScrollRef = React.useRef<HTMLDivElement>(null);
  const weekScrollSyncLockRef = React.useRef(false);
  const [weekDaysVisibleSlots, setWeekDaysVisibleSlots] =
    React.useState(weekDayCount);
  const [weekDaysScrollEdges, setWeekDaysScrollEdges] = React.useState({
    canLeft: false,
    canRight: false,
  });

  const refreshWeekDaysScrollEdges = React.useCallback(() => {
    refreshHorizontalScrollEdges(
      weekDaysScrollRef.current,
      setWeekDaysScrollEdges,
    );
  }, [refreshHorizontalScrollEdges]);

  const syncWeekHorizontalScroll = React.useCallback(
    (source: "header" | "body") => {
      const header = weekDaysScrollRef.current;
      const body = weekBodyScrollRef.current;
      if (!header || !body || weekScrollSyncLockRef.current) return;
      weekScrollSyncLockRef.current = true;
      if (source === "header") {
        body.scrollLeft = header.scrollLeft;
      } else {
        header.scrollLeft = body.scrollLeft;
      }
      refreshWeekDaysScrollEdges();
      requestAnimationFrame(() => {
        weekScrollSyncLockRef.current = false;
      });
    },
    [refreshWeekDaysScrollEdges],
  );

  const updateWeekDaysLayout = React.useCallback(() => {
    const viewport = weekDaysViewportRef.current;
    if (!viewport || weekDayCount <= 0) {
      setWeekDaysVisibleSlots(1);
      refreshWeekDaysScrollEdges();
      return;
    }
    const slots = Math.min(
      weekDayCount,
      Math.max(1, Math.floor(viewport.clientWidth / WEEK_DAY_MIN_PX)),
    );
    setWeekDaysVisibleSlots(slots);
    refreshWeekDaysScrollEdges();
  }, [refreshWeekDaysScrollEdges, weekDayCount]);

  React.useLayoutEffect(() => {
    if (viewMode !== "week") return;
    const viewport = weekDaysViewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => updateWeekDaysLayout());
    observer.observe(viewport);
    updateWeekDaysLayout();
    return () => observer.disconnect();
  }, [
    displayedResourcesLength,
    updateWeekDaysLayout,
    viewMode,
    weekDayCount,
  ]);

  React.useLayoutEffect(() => {
    if (viewMode !== "week") return;
    refreshWeekDaysScrollEdges();
  }, [
    refreshWeekDaysScrollEdges,
    viewMode,
    weekDayCount,
    weekDaysVisibleSlots,
  ]);

  React.useLayoutEffect(() => {
    if (viewMode !== "week") return;
    const scroller = weekDaysScrollRef.current;
    if (!scroller) return;
    const active = scroller.querySelector('[aria-pressed="true"]');
    if (!(active instanceof HTMLElement)) return;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    let nextScrollLeft = scroller.scrollLeft;
    if (left < scroller.scrollLeft) {
      nextScrollLeft = left;
    } else if (right > scroller.scrollLeft + scroller.clientWidth) {
      nextScrollLeft = right - scroller.clientWidth;
    }
    if (nextScrollLeft !== scroller.scrollLeft) {
      scroller.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
      weekBodyScrollRef.current?.scrollTo({
        left: nextScrollLeft,
        behavior: "smooth",
      });
    }
  }, [activeDateIso, viewMode, weekDaysVisibleSlots]);

  const weekDaysNeedScroll = weekDayCount > weekDaysVisibleSlots;
  const weekDaysScrollContentWidth = weekDaysNeedScroll
    ? `calc(100cqw * ${weekDayCount} / ${weekDaysVisibleSlots})`
    : "100%";
  const weekDaysGridTemplateColumns =
    weekDayCount > 0
      ? weekDaysNeedScroll
        ? `repeat(${weekDayCount}, calc(100cqw / ${weekDaysVisibleSlots}))`
        : `repeat(${weekDayCount}, minmax(0, 1fr))`
      : "1fr";
  const weekDaysScrollOverflowSx = {
    overflowX: weekDaysNeedScroll ? ("auto" as const) : ("hidden" as const),
    overflowY: "hidden" as const,
    WebkitOverflowScrolling: "touch" as const,
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
    "&::-webkit-scrollbar": { display: "none" },
  };

  const scrollWeekDays = React.useCallback(
    (direction: -1 | 1) => {
      const el = weekDaysScrollRef.current;
      if (!el) return;
      const step = el.clientWidth / Math.max(1, weekDaysVisibleSlots);
      el.scrollBy({ left: direction * step, behavior: "smooth" });
      const body = weekBodyScrollRef.current;
      if (body) {
        body.scrollBy({ left: direction * step, behavior: "smooth" });
      }
    },
    [weekDaysVisibleSlots],
  );

  return {
    dayBodyScrollRef,
    dayScrollSyncLockRef,
    onTeamHeaderScroll,
    refreshHorizontalScrollEdges,
    refreshWeekDaysScrollEdges,
    refreshWeekTeamHeaderScrollEdges,
    scrollTeamNav,
    scrollWeekDays,
    scrollWeekTeamHeader,
    setWeekDaysScrollEdges,
    setWeekDaysVisibleSlots,
    setWeekTeamHeaderScrollEdges,
    syncDayTeamHorizontalScroll,
    syncWeekHorizontalScroll,
    updateWeekDaysLayout,
    weekBodyScrollRef,
    weekDayCount,
    weekDaysGridTemplateColumns,
    weekDaysNeedScroll,
    weekDaysScrollContentWidth,
    weekDaysScrollEdges,
    weekDaysScrollOverflowSx,
    weekDaysScrollRef,
    weekDaysViewportRef,
    weekDaysVisibleSlots,
    weekScrollSyncLockRef,
    weekTeamHeaderScrollEdges,
    weekTeamHeaderScrollRef,
  };
}
