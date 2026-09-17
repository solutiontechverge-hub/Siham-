"use client";

import CalendarSlotAddMenu from "../CalendarSlotAddMenu";

import CalendarTeamMemberBookingsPopover from "../CalendarTeamMemberBookingsPopover";

import CalendarFiltersDrawer from "../CalendarFiltersDrawer";

import { calendarFiltersAreNarrowing } from "../calendar.utils";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarOverlaysTeamFiltersBag = Pick<
  Vm,
  | "appliedFilters"
  | "applyFilters"
  | "bookingStatuses"
  | "bookingTypes"
  | "closeTeamMenu"
  | "data"
  | "discardSplitScreen"
  | "draftFilters"
  | "filtersOpen"
  | "handleSlotAddContinue"
  | "initialFilters"
  | "locationFilterAvailable"
  | "locations"
  | "openExistingBooking"
  | "openSplitScreenWith"
  | "openTeamMemberAvailabilityEditor"
  | "setDraftFilters"
  | "setFiltersOpen"
  | "setPendingSlotPayload"
  | "setSlotAddAnchor"
  | "setSplitScreen"
  | "setTeamProfileMemberId"
  | "slotAddAnchor"
  | "splitScreen"
  | "splitScreenCandidates"
  | "teamActionAnchor"
  | "teamMenuBookings"
  | "teamMenuResource"
  | "viewMode"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarOverlaysTeamFiltersBag;
};

export default function ProfessionalFixedLocationCalendarOverlaysTeamFilters({
  bag,
}: Props) {
  const {
    appliedFilters,
    applyFilters,
    bookingStatuses,
    bookingTypes,
    closeTeamMenu,
    data,
    discardSplitScreen,
    draftFilters,
    filtersOpen,
    handleSlotAddContinue,
    initialFilters,
    locationFilterAvailable,
    locations,
    openExistingBooking,
    openSplitScreenWith,
    openTeamMemberAvailabilityEditor,
    setDraftFilters,
    setFiltersOpen,
    setPendingSlotPayload,
    setSlotAddAnchor,
    setSplitScreen,
    setTeamProfileMemberId,
    slotAddAnchor,
    splitScreen,
    splitScreenCandidates,
    teamActionAnchor,
    teamMenuBookings,
    teamMenuResource,
    viewMode,
  } = bag;

  return (
    <>
      <CalendarTeamMemberBookingsPopover
        open={Boolean(teamActionAnchor)}
        anchorEl={teamActionAnchor}
        memberName={teamMenuResource?.name ?? ""}
        bookings={teamMenuBookings}
        showDate={viewMode !== "day"}
        showEditAvailability={viewMode === "day"}
        editAvailabilityDisabled={!teamMenuResource}
        splitScreenEnabled={viewMode === "day"}
        splitScreenActive={Boolean(splitScreen)}
        splitScreenCandidates={splitScreenCandidates}
        onClose={closeTeamMenu}
        onSelectBooking={(booking) => {
          closeTeamMenu();
          openExistingBooking(booking);
        }}
        onViewProfile={() => {
          const memberId = teamMenuResource?.id;
          closeTeamMenu();
          if (memberId) {
            setTeamProfileMemberId(String(memberId));
          }
        }}
        onEditAvailability={openTeamMemberAvailabilityEditor}
        onSplitScreenWith={openSplitScreenWith}
        onDiscardSplitScreen={() => {
          discardSplitScreen();
          closeTeamMenu();
        }}
      />
      <CalendarFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        appliedFilters={appliedFilters}
        draftFilters={draftFilters}
        initialFilters={initialFilters}
        locations={locations}
        bookingTypes={bookingTypes}
        bookingStatuses={bookingStatuses}
        resources={data.resources}
        setDraftFilters={setDraftFilters}
        onApply={(filters) => {
          applyFilters(filters);
          if (
            calendarFiltersAreNarrowing(filters, { locationFilterAvailable }) &&
            filters.teamAll
          ) {
            setSplitScreen(null);
          }
          setFiltersOpen(false);
        }}
      />
      <CalendarSlotAddMenu
        anchorPosition={slotAddAnchor}
        onClose={() => {
          setSlotAddAnchor(null);
          setPendingSlotPayload(null);
        }}
        onSelect={handleSlotAddContinue}
      />
    </>
  );
}
