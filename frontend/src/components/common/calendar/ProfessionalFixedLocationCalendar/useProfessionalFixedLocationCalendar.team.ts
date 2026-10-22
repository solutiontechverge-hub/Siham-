import * as React from "react";
import type {
  CalendarBlock,
  CalendarEvent,
  CalendarResource,
  CalendarViewMode,
  ResourceAvailability,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type {
  ScheduleAvailabilityRow,
  ScheduleDateOverride,
} from "../calendar-settings.types";
import { useProfessionalFixedLocationCalendarTeamLayout } from "./useProfessionalFixedLocationCalendar.team.layout";
import { useProfessionalFixedLocationCalendarTeamMenu } from "./useProfessionalFixedLocationCalendar.team.menu";

export type UseProfessionalFixedLocationCalendarTeamArgs = {
  resources: readonly CalendarResource[];
  events: readonly CalendarEvent[];
  blocks: readonly CalendarBlock[];
  scheduleRows: readonly ScheduleAvailabilityRow[];
  dateOverrides?: readonly ScheduleDateOverride[] | null;
  dataAvailability?: readonly ResourceAvailability[] | null;
  filterDrawerResources: readonly CalendarResource[];
  eventsMatchingDrawerFilters: readonly CalendarEvent[];
  teamAll: boolean;
  filtersAreNarrowing: boolean;
  visibleDates: readonly string[];
  viewMode: CalendarViewMode;
  activeDateIso: string;
  /** Location filter for leave checks (FL/DL separately). */
  locationAll?: boolean;
  locations?: Readonly<Record<"FL" | "DL", boolean>>;
  setViewMode: React.Dispatch<React.SetStateAction<CalendarViewMode>>;
  navy: string;
  laneHeaderPx?: number;
};

/** Team resource layout + menu/split (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarTeam(
  args: UseProfessionalFixedLocationCalendarTeamArgs,
) {
  const layout = useProfessionalFixedLocationCalendarTeamLayout(args);
  const menu = useProfessionalFixedLocationCalendarTeamMenu({
    ...args,
    activeResource: layout.activeResource,
    filteredResources: layout.filteredResources,
    selectTeamMember: layout.selectTeamMember,
    setSplitScreen: layout.setSplitScreen,
    splitScreen: layout.splitScreen,
  });

  return {
    ...layout,
    ...menu,
  };
}
