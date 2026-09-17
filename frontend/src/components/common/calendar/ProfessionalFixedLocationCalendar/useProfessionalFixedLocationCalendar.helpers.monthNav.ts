import type {
  CalendarEvent,
  CalendarViewMode,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  addDaysIso,
  addMonthsIso,
  parseIsoDate,
  startOfWeekIso,
} from "../calendar.utils";

export type MonthCell = {
  iso: string;
  dateNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  dayEvents: CalendarEvent[];
  hiddenCount: number;
};

export function buildMonthCells(input: {
  activeMonthIso: string;
  activeDateIso: string;
  todayIso: string;
  monthEvents: readonly CalendarEvent[];
}): MonthCell[] {
  const { activeMonthIso, activeDateIso, todayIso, monthEvents } = input;
  const first = parseIsoDate(activeMonthIso);
  const monthIndex = first.getUTCMonth();
  const gridStartIso = startOfWeekIso(activeMonthIso);

  return Array.from({ length: 42 }, (_, idx) => {
    const iso = addDaysIso(gridStartIso, idx);
    const dayDate = parseIsoDate(iso);
    const inMonth = dayDate.getUTCMonth() === monthIndex;
    const dayEvents = monthEvents
      .filter((event) => event.date === iso)
      .sort((a, b) =>
        `${a.start}-${a.resourceId}`.localeCompare(
          `${b.start}-${b.resourceId}`,
        ),
      );

    return {
      iso,
      dateNumber: dayDate.getUTCDate(),
      inMonth,
      isToday: iso === todayIso,
      isSelected: iso === activeDateIso,
      isPast: iso < todayIso,
      dayEvents,
      hiddenCount: Math.max(0, dayEvents.length - 3),
    };
  });
}


export function buildVisibleDates(
  viewMode: CalendarViewMode,
  activeDateIso: string,
): string[] {
  if (viewMode === "day") return [activeDateIso];
  if (viewMode === "week") {
    const start = startOfWeekIso(activeDateIso);
    return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
  }
  // month: we still keep a single active date; month grid computed separately in UI.
  return [activeDateIso];
}

export function computePrevCandidateIso(
  viewMode: CalendarViewMode,
  activeDateIso: string,
  activeMonthIso: string,
): string {
  if (viewMode === "week") return addDaysIso(activeDateIso, -7);
  if (viewMode === "month") return addMonthsIso(activeMonthIso, -1);
  return addDaysIso(activeDateIso, -1);
}

export function computeNextActiveDateIso(
  viewMode: CalendarViewMode,
  activeDateIso: string,
  activeMonthIso: string,
): string {
  if (viewMode === "week") return addDaysIso(activeDateIso, 7);
  if (viewMode === "month") return addMonthsIso(activeMonthIso, 1);
  return addDaysIso(activeDateIso, 1);
}
