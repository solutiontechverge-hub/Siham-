import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { Interval } from "../calendar.utils";
import type { InlineGuestDraftState } from "./useProfessionalFixedLocationCalendar.types";

export const toDateTimeInput = (date: string, time: string) =>
  `${date}T${time}:00`;
export const clockHm = (value?: string | null) =>
  String(value ?? "").slice(0, 5);
export const isIsoDateTime = (value?: string | null) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value));

export function applyPendingInlineGuestEdit<
  T extends {
    id: string;
    name: string;
    email?: string;
    phoneCode?: string;
    phoneNumber?: string;
    participantType?: string;
  },
>(
  guests: T[],
  editingId: string | null,
  draft: InlineGuestDraftState,
): T[] {
  if (!editingId) return guests;
  const guestName =
    `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim();
  return guests.map((guest) => {
    if (guest.id !== editingId) return guest;
    const fallback = guest.participantType === "model" ? "Model" : "Guest";
    return {
      ...guest,
      name: guestName || guest.name || fallback,
      email: draft.email.trim(),
      phoneCode: draft.phoneCode,
      phoneNumber: draft.phoneNumber.trim(),
    };
  });
}

export const locationToApi = (location: CalendarBookingLocation) =>
  location === "DL" ? "desired" : "fixed";

export const isMinuteInAvailability = (
  minute: number,
  windows: readonly Interval[],
) => windows.some((w) => minute >= w.startMin && minute < w.endMin);

export type {
  SlotValidationErrors,
  SlotValidationInput,
} from "./useProfessionalFixedLocationCalendar.helpers.slotValidation";
export { computeSlotValidation } from "./useProfessionalFixedLocationCalendar.helpers.slotValidation";

export { buildDayViewMemberColumnSource, remountDayViewSegmentsOntoVisibleColumns } from "./useProfessionalFixedLocationCalendar.helpers.dayView";

export {
  formatLateCancelNoticeLabel,
  calendarStatusToApiValue,
  emptyCalendarDesignDraft,
  resolveEventCategoryKey,
  lookupCategoryColor,
  resolveEventColors,
} from "./useProfessionalFixedLocationCalendar.helpers.design";

export {
  resolveClientActivityIdentity,
  synthesizeCalendarBookingFromEvent,
  matchClientBookingsForActivity,
} from "./useProfessionalFixedLocationCalendar.helpers.clientActivity";

export {
  filterEventsMatchingDrawerFilters,
  filterResourcesForVisibleDates,
  filterMonthEventsForFocusedTeam,
  filterRangeEventsForFocusedTeam,
} from "./useProfessionalFixedLocationCalendar.helpers.filters";

export type { MonthCell } from "./useProfessionalFixedLocationCalendar.helpers.monthNav";
export {
  buildMonthCells,
  buildVisibleDates,
  computePrevCandidateIso,
  computeNextActiveDateIso,
} from "./useProfessionalFixedLocationCalendar.helpers.monthNav";

export { buildBusyIntervalsForResource } from "./useProfessionalFixedLocationCalendar.helpers.busy";

export {
  resolveDrawerAddClientSource,
  mapSnapshotPersonToDrawerGuest,
  resolveOpenExistingBookingGuests,
  resolveOpenExistingProjectDetails,
} from "./useProfessionalFixedLocationCalendar.helpers.openExisting";

export type { PickMostAvailableTeamMemberId } from "./useProfessionalFixedLocationCalendar.helpers.staffAssign";
export { assignStaffToPickedServices } from "./useProfessionalFixedLocationCalendar.helpers.staffAssign";

export {
  isBookingDetailsSubScreen,
  resolveUniqueItemFlowLabels,
  findFocusBookingMatch,
} from "./useProfessionalFixedLocationCalendar.helpers.screens";
