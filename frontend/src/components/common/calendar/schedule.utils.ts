import type {
  CalendarBookingLocation,
  TeamScheduleAvailabilityEntry,
  TeamScheduleBlockedEntry,
  TeamScheduleTimeRange,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { blockTitleFromDraft, weekdayNameFromIso, type BlockTimeDraft } from "./calendar.utils";

const KNOWN_BLOCK_TITLES = ["Meeting", "Training", "Holiday"] as const;

function titlePartsFromActivity(activity: string): Pick<BlockTimeDraft, "title" | "customTitle"> {
  const trimmed = activity.trim();
  if ((KNOWN_BLOCK_TITLES as readonly string[]).includes(trimmed)) {
    return { title: trimmed as (typeof KNOWN_BLOCK_TITLES)[number] };
  }
  return { title: "Custom", customTitle: trimmed };
}

export type AvailabilityDraft = {
  teamIds: string[];
  locations: CalendarBookingLocation[];
  dateFrom: string;
  dateTo: string;
  dayFrom: BlockTimeDraft["dayFrom"];
  dayTo: BlockTimeDraft["dayTo"];
  shifts: TeamScheduleTimeRange[];
};

export const DAY_FULL_OPTIONS = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
] as const;

const DAY_FULL_TO_ABBR: Record<BlockTimeDraft["dayFrom"], string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const DAY_ABBR_TO_FULL: Record<string, BlockTimeDraft["dayFrom"]> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export const toDayAbbr = (day: BlockTimeDraft["dayFrom"] | string) =>
  DAY_FULL_TO_ABBR[day as BlockTimeDraft["dayFrom"]] ?? day.slice(0, 3);

export const toDayFull = (day: string): BlockTimeDraft["dayFrom"] =>
  DAY_ABBR_TO_FULL[day] ?? (day as BlockTimeDraft["dayFrom"]);

export const emptyAvailabilityDraft = (dateIso: string): AvailabilityDraft => {
  const day = weekdayNameFromIso(dateIso);
  return {
    teamIds: [],
    locations: [],
    dateFrom: dateIso,
    dateTo: dateIso,
    dayFrom: day,
    dayTo: day,
    shifts: [{ start: "09:00", end: "17:00" }],
  };
};

export const availabilityEntryToDraft = (entry: TeamScheduleAvailabilityEntry): AvailabilityDraft => ({
  teamIds: [entry.resourceId],
  locations: [entry.location],
  dateFrom: entry.dateFrom,
  dateTo: entry.dateTo,
  dayFrom: weekdayNameFromIso(entry.dateFrom),
  dayTo: weekdayNameFromIso(entry.dateTo),
  shifts: [...entry.times],
});

export const blockedEntryToDraft = (
  entry: TeamScheduleBlockedEntry,
  supportedLocations: readonly CalendarBookingLocation[],
): BlockTimeDraft & { activity: string } => {
  const titleParts = titlePartsFromActivity(entry.activity);
  return {
    ...titleParts,
    teamIds: [entry.resourceId],
    locations: [...supportedLocations],
    dateFrom: entry.dateFrom,
    dateTo: entry.dateTo,
    dayFrom: weekdayNameFromIso(entry.dateFrom),
    dayTo: weekdayNameFromIso(entry.dateTo),
    startTime: entry.times[0]?.start ?? "09:00",
    endTime: entry.times[0]?.end ?? "17:00",
    activity: entry.activity,
  };
};

export const buildAvailabilityEntriesFromDraft = (
  draft: AvailabilityDraft,
  editingEntry?: TeamScheduleAvailabilityEntry,
): TeamScheduleAvailabilityEntry[] => {
  const dayFrom = toDayAbbr(weekdayNameFromIso(draft.dateFrom));
  const dayTo = toDayAbbr(weekdayNameFromIso(draft.dateTo));
  const shifts = draft.shifts.filter((shift) => shift.start && shift.end);

  if (editingEntry) {
    return [
      {
        ...editingEntry,
        resourceId: draft.teamIds[0] ?? editingEntry.resourceId,
        location: draft.locations[0] ?? editingEntry.location,
        dateFrom: draft.dateFrom,
        dateTo: draft.dateTo,
        dayFrom,
        dayTo,
        times: shifts.length ? shifts : editingEntry.times,
      },
    ];
  }

  const entries: TeamScheduleAvailabilityEntry[] = [];
  for (const teamId of draft.teamIds) {
    for (const location of draft.locations) {
      entries.push({
        id: `avail-${teamId}-${location}-${Date.now()}-${entries.length}`,
        resourceId: teamId,
        location,
        dateFrom: draft.dateFrom,
        dateTo: draft.dateTo,
        dayFrom,
        dayTo,
        times: shifts.length ? shifts : [{ start: "09:00", end: "17:00" }],
        bookedDates: [],
      });
    }
  }
  return entries;
};

export const buildBlockedEntryFromDraft = (
  draft: BlockTimeDraft & { activity?: string },
  editingEntry?: TeamScheduleBlockedEntry,
): TeamScheduleBlockedEntry => ({
  id: editingEntry?.id ?? `blocked-${Date.now()}`,
  resourceId: draft.teamIds[0] ?? editingEntry?.resourceId ?? "",
  activity: blockTitleFromDraft(draft),
  dateFrom: draft.dateFrom,
  dateTo: draft.dateTo,
  dayFrom: toDayAbbr(weekdayNameFromIso(draft.dateFrom)),
  dayTo: toDayAbbr(weekdayNameFromIso(draft.dateTo)),
  times: [{ start: draft.startTime, end: draft.endTime }],
  archived: editingEntry?.archived,
});
