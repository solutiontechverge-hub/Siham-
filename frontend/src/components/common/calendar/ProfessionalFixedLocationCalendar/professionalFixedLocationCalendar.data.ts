"use client";

import type { LocationAvailabilityKind } from "../calendar-schedule.utils";
import { parseIsoDate } from "../calendar.utils";

const AVAILABILITY_PATTERN_LINE = "#D0D5DD";

const locationAvailabilityPatternSx = (kind: LocationAvailabilityKind) => {
  if (kind === "desired") {
    return {
      backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 5px, ${AVAILABILITY_PATTERN_LINE} 5px, ${AVAILABILITY_PATTERN_LINE} 6px)`,
    };
  }
  if (kind === "both") {
    return {
      backgroundImage: `repeating-linear-gradient(90deg, ${AVAILABILITY_PATTERN_LINE} 0px, ${AVAILABILITY_PATTERN_LINE} 1px, transparent 1px, transparent 6px)`,
      maskImage:
        "repeating-linear-gradient(180deg, #000 0px, #000 3px, transparent 3px, transparent 7px)",
      WebkitMaskImage:
        "repeating-linear-gradient(180deg, #000 0px, #000 3px, transparent 3px, transparent 7px)",
    };
  }
  return {};
};

const formatWeekDayName = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });

const formatWeekDayDate = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Wide enough for readable booking cards; overflow scrolls horizontally. */
const WEEK_DAY_MIN_PX = 156;
/** Week columns with this many bookings switch to compact cards. */
const WEEK_DAY_CROWDED_BOOKING_COUNT = 5;
const TEAM_NAV_VISIBLE_SLOTS = 3;
const TEAM_NAV_SCROLLBAR_PX = 10;

export {
  AVAILABILITY_PATTERN_LINE,
  locationAvailabilityPatternSx,
  formatWeekDayName,
  formatWeekDayDate,
  WEEK_DAY_MIN_PX,
  WEEK_DAY_CROWDED_BOOKING_COUNT,
  TEAM_NAV_VISIBLE_SLOTS,
  TEAM_NAV_SCROLLBAR_PX,
};
