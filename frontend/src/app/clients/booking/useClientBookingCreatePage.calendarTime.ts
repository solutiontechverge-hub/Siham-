"use client";

import * as React from "react";
import {
  CLIENT_BOOKING_MIN_LEAD_MINUTES,
  fmtMinutesToTimeLabel,
  getNowMinutesFromMidnight,
  isSameDayBookingTooSoon,
  parseTimeLabelToMinutes,
} from "./booking-time";

export function startOfDay(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(d: Date, months: number) {
  const next = new Date(d);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function startOfWeekMon(d: Date) {
  const next = new Date(d);
  const dow0Sun = next.getDay(); // 0..6
  const dowMon0 = (dow0Sun + 6) % 7; // Mon=0
  next.setDate(next.getDate() - dowMon0);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function fmtDow(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function useClientBookingCreateCalendarTime() {
  const today0 = React.useMemo(() => startOfDay(new Date()), []);
  const isPastDay = React.useCallback(
    (d: Date) => startOfDay(d).getTime() < today0.getTime(),
    [today0],
  );
  const clampToBookableDay = React.useCallback(
    (d: Date) => (isPastDay(d) ? today0 : startOfDay(d)),
    [isPastDay, today0],
  );

  const [selectedDate, setSelectedDate] = React.useState<Date>(
    () => new Date(),
  );
  const [monthPickerAnchor, setMonthPickerAnchor] =
    React.useState<HTMLElement | null>(null);
  const weekStart = React.useMemo(
    () => startOfWeekMon(selectedDate),
    [selectedDate],
  );
  const weekDays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const dt = addDays(weekStart, i);
        return { date: dt, key: toISO(dt), dow: fmtDow(dt), day: dt.getDate() };
      }),
    [weekStart],
  );
  const monthLabel = React.useMemo(
    () =>
      selectedDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [selectedDate],
  );
  const monthPickerYear = selectedDate.getFullYear();
  const monthPickerMonth = selectedDate.getMonth(); // 0-11

  const setMonthYear = (year: number, month0: number) => {
    setSelectedDate((prev) => {
      const day = prev.getDate();
      const next = new Date(prev);
      next.setFullYear(year, month0, 1);
      const daysInTargetMonth = new Date(year, month0 + 1, 0).getDate();
      next.setDate(Math.min(day, daysInTargetMonth));
      return clampToBookableDay(next);
    });
  };

  const allDayTimes = React.useMemo(() => {
    // Public Hours are display-only; slot grid uses a wide day window, then
    // Schedule availability (availabilityBookableTimes) filters real bookable times.
    const hours = { startMin: 9 * 60, endMin: 18 * 60 + 1 };
    const slots: string[] = [];
    for (
      let minutes = hours.startMin;
      minutes < hours.endMin;
      minutes += 30
    ) {
      slots.push(fmtMinutesToTimeLabel(minutes));
    }
    return slots;
  }, []);

  const isDayNotAvailable = React.useCallback((_d: Date) => false, []);

  const getDayClosedNote = React.useCallback(
    (_d: Date) => null as string | null,
    [],
  );

  const selectedDayNotAvailable = React.useMemo(
    () => isDayNotAvailable(selectedDate),
    [isDayNotAvailable, selectedDate],
  );

  const selectedDayClosedNote = React.useMemo(
    () => getDayClosedNote(selectedDate),
    [getDayClosedNote, selectedDate],
  );

  const isSelectedToday = React.useMemo(
    () => startOfDay(selectedDate).getTime() === today0.getTime(),
    [selectedDate, today0],
  );

  const [nowTick, setNowTick] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!isSelectedToday) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [isSelectedToday]);

  const nowMinutes = React.useMemo(
    () => getNowMinutesFromMidnight(new Date(nowTick)),
    [nowTick, selectedDate],
  );
  const minBookableMinutes = nowMinutes + CLIENT_BOOKING_MIN_LEAD_MINUTES;

  const getBookableTimesForDate = React.useCallback(
    (d: Date) => {
      if (isPastDay(d)) return [] as string[];
      const hours = { startMin: 9 * 60, endMin: 18 * 60 + 1 };
      const slots: string[] = [];
      for (
        let minutes = hours.startMin;
        minutes < hours.endMin;
        minutes += 30
      ) {
        slots.push(fmtMinutesToTimeLabel(minutes));
      }
      const isToday = startOfDay(d).getTime() === today0.getTime();
      if (!isToday) return slots;
      return slots.filter(
        (t) => parseTimeLabelToMinutes(t) > minBookableMinutes,
      );
    },
    [isPastDay, minBookableMinutes, today0],
  );

  /** Day cannot be chosen: past, or no bookable times in the day window. */
  const isDayUnselectable = React.useCallback(
    (d: Date) => {
      if (isPastDay(d)) return true;
      return getBookableTimesForDate(d).length === 0;
    },
    [getBookableTimesForDate, isPastDay],
  );

  const times = allDayTimes;

  const baseAvailableTimes = React.useMemo(() => {
    if (!isSelectedToday) return times;
    return times.filter((t) => parseTimeLabelToMinutes(t) > minBookableMinutes);
  }, [isSelectedToday, minBookableMinutes, times]);

  const isTimeUnavailable = React.useCallback(
    (t: string) =>
      isSelectedToday && parseTimeLabelToMinutes(t) <= minBookableMinutes,
    [isSelectedToday, minBookableMinutes],
  );

  const timeScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeSlots = React.useCallback((direction: "left" | "right") => {
    const el = timeScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  }, []);

  const [selectedTime, setSelectedTime] = React.useState(() => {
    const mins = getNowMinutesFromMidnight() + CLIENT_BOOKING_MIN_LEAD_MINUTES;
    const future = allDayTimes.filter((t) => parseTimeLabelToMinutes(t) > mins);
    return future[0] ?? allDayTimes[0] ?? "";
  });
  const [timeValidationError, setTimeValidationError] = React.useState<
    string | null
  >(null);
  const selectedTimeTooSoon = React.useMemo(
    () =>
      isSelectedToday &&
      isSameDayBookingTooSoon(selectedTime, new Date(nowTick)),
    [isSelectedToday, nowTick, selectedTime],
  );

  React.useEffect(() => {
    // Safety: never allow a past date to remain selected.
    if (isPastDay(selectedDate)) setSelectedDate(today0);
  }, [isPastDay, selectedDate, today0]);

  React.useEffect(() => {
    if (!selectedTimeTooSoon) setTimeValidationError(null);
  }, [selectedTimeTooSoon]);

  React.useEffect(() => {
    const el = timeScrollRef.current;
    if (!el || !selectedTime) return;
    const activeBtn = el.querySelector<HTMLElement>(
      `[data-time-slot="${selectedTime}"]`,
    );
    activeBtn?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedTime, selectedDate]);

  return {
    startOfDay,
    today0,
    isPastDay,
    clampToBookableDay,
    toISO,
    addDays,
    addMonths,
    startOfWeekMon,
    fmtDow,
    selectedDate,
    setSelectedDate,
    monthPickerAnchor,
    setMonthPickerAnchor,
    weekStart,
    weekDays,
    monthLabel,
    monthPickerYear,
    monthPickerMonth,
    setMonthYear,
    allDayTimes,
    isDayNotAvailable,
    isDayUnselectable,
    getDayClosedNote,
    selectedDayNotAvailable,
    selectedDayClosedNote,
    isSelectedToday,
    nowTick,
    setNowTick,
    nowMinutes,
    minBookableMinutes,
    times,
    baseAvailableTimes,
    isTimeUnavailable,
    timeScrollRef,
    scrollTimeSlots,
    selectedTime,
    setSelectedTime,
    timeValidationError,
    setTimeValidationError,
    selectedTimeTooSoon,
  };
}
