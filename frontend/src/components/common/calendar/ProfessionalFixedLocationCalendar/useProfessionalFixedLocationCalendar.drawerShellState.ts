import * as React from "react";
import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
  CalendarSubTab,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingActivityItem } from "../bookingActivity.types";
import type { SelectedSlot } from "../calendar.utils";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";

export type UseProfessionalFixedLocationCalendarDrawerShellStateArgs = {
  initialSubTab: CalendarSubTab;
  supportedLocations: readonly CalendarBookingLocation[];
  editingEventId: string | null;
};

/** Drawer chrome / anchors / slot shell state (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerShellState({
  initialSubTab,
  supportedLocations,
  editingEventId,
}: UseProfessionalFixedLocationCalendarDrawerShellStateArgs) {
  const addMenuButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const [activeSubTab, setActiveSubTab] =
    React.useState<CalendarSubTab>(initialSubTab);
  const [datePickerAnchor, setDatePickerAnchor] =
    React.useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [slotDrawerTab, setSlotDrawerTab] = React.useState<
    "booking" | "sales" | "activity"
  >("booking");
  const [bookingCheckoutOpen, setBookingCheckoutOpen] = React.useState(false);
  const [focusSalesCardId, setFocusSalesCardId] = React.useState<string | null>(
    null,
  );
  const reopenBookingAfterSaveRef = React.useRef<CalendarEvent | null>(null);
  const bookingCheckoutOpenRef = React.useRef(false);
  const editingEventIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    bookingCheckoutOpenRef.current = bookingCheckoutOpen;
  }, [bookingCheckoutOpen]);
  React.useEffect(() => {
    editingEventIdRef.current = editingEventId;
  }, [editingEventId]);
  const [activityDetailItem, setActivityDetailItem] =
    React.useState<BookingActivityItem | null>(null);
  const [slotLocation, setSlotLocation] = React.useState<CalendarBookingLocation>(
    supportedLocations[0] ?? "FL",
  );
  const [slotBookingType, setSlotBookingType] =
    React.useState<CalendarBookingType>("Online");
  const [slotStatus, setSlotStatus] =
    React.useState<CalendarBookingStatus>("Requested");
  const [slotClientAdded, setSlotClientAdded] = React.useState(false);
  const [slotCalendarOpen, setSlotCalendarOpen] = React.useState(false);
  const [slotCalendarTouched, setSlotCalendarTouched] = React.useState(false);
  /** When true, New Booking drawer shows the time wheel so the slot can be changed. */
  const [allowDrawerTimeSelection, setAllowDrawerTimeSelection] =
    React.useState(false);
  const [slotAddMenuAnchor, setSlotAddMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [bookingActionAnchor, setBookingActionAnchor] =
    React.useState<HTMLElement | null>(null);
  const [addMenuTarget, setAddMenuTarget] = React.useState<"client" | string>(
    "client",
  );
  const [selectionTarget, setSelectionTarget] = React.useState<
    "client" | string
  >("client");
  const [bookingMoreAnchor, setBookingMoreAnchor] =
    React.useState<HTMLElement | null>(null);
  const [slotBookingScreen, setSlotBookingScreen] =
    React.useState<SlotBookingScreen>("new-booking");
  const [slotSaveAttempted, setSlotSaveAttempted] = React.useState(false);
  const [teamProfileMemberId, setTeamProfileMemberId] = React.useState<
    string | null
  >(null);
  const [publicBusinessHoursOpen, setPublicBusinessHoursOpen] =
    React.useState(false);
  const [designOpen, setDesignOpen] = React.useState(false);
  const [slotDrawerOpen, setSlotDrawerOpen] = React.useState(false);
  const [showSilentFieldTags, setShowSilentFieldTags] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<null | SelectedSlot>(
    null,
  );
  const [staffConflictOpen, setStaffConflictOpen] = React.useState(false);
  const [staffConflictMessage, setStaffConflictMessage] = React.useState<
    string | null
  >(null);
  const staffConflictAckRef = React.useRef(false);

  React.useEffect(() => {
    setSlotSaveAttempted(false);
  }, [slotBookingScreen]);

  React.useEffect(() => {
    if (!supportedLocations.includes(slotLocation)) {
      setSlotLocation(supportedLocations[0] ?? "FL");
    }
  }, [supportedLocations, slotLocation]);

  const slotTabs = React.useMemo(
    () =>
      [
        { id: "booking" as const, label: "Booking" },
        { id: "sales" as const, label: "Sales" },
        { id: "activity" as const, label: "Activity" },
      ] as const,
    [],
  );

  return {
    addMenuButtonRef,
    activeSubTab,
    setActiveSubTab,
    datePickerAnchor,
    setDatePickerAnchor,
    addAnchor,
    setAddAnchor,
    filtersOpen,
    setFiltersOpen,
    slotDrawerTab,
    setSlotDrawerTab,
    bookingCheckoutOpen,
    setBookingCheckoutOpen,
    focusSalesCardId,
    setFocusSalesCardId,
    reopenBookingAfterSaveRef,
    bookingCheckoutOpenRef,
    editingEventIdRef,
    activityDetailItem,
    setActivityDetailItem,
    slotLocation,
    setSlotLocation,
    slotBookingType,
    setSlotBookingType,
    slotStatus,
    setSlotStatus,
    slotClientAdded,
    setSlotClientAdded,
    slotCalendarOpen,
    setSlotCalendarOpen,
    slotCalendarTouched,
    setSlotCalendarTouched,
    allowDrawerTimeSelection,
    setAllowDrawerTimeSelection,
    slotAddMenuAnchor,
    setSlotAddMenuAnchor,
    bookingActionAnchor,
    setBookingActionAnchor,
    addMenuTarget,
    setAddMenuTarget,
    selectionTarget,
    setSelectionTarget,
    bookingMoreAnchor,
    setBookingMoreAnchor,
    slotBookingScreen,
    setSlotBookingScreen,
    slotSaveAttempted,
    setSlotSaveAttempted,
    teamProfileMemberId,
    setTeamProfileMemberId,
    publicBusinessHoursOpen,
    setPublicBusinessHoursOpen,
    designOpen,
    setDesignOpen,
    slotDrawerOpen,
    setSlotDrawerOpen,
    showSilentFieldTags,
    setShowSilentFieldTags,
    selectedSlot,
    setSelectedSlot,
    staffConflictOpen,
    setStaffConflictOpen,
    staffConflictMessage,
    setStaffConflictMessage,
    staffConflictAckRef,
    slotTabs,
  };
}
