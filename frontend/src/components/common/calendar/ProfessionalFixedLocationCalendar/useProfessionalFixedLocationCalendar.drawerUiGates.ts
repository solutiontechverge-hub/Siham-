import * as React from "react";
import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { FIXED_LOCATION_MAX_GUESTS } from "../../../../app/clients/booking/booking.page.data";
import { isClientOriginatedBooking } from "../bookingRequestNegotiation";
import { resolveOfflineBookingPrepayAction } from "../bookingCheckout";
import {
  resolveBookingDrawerParticipantKinds,
} from "../bookingDrawerParticipantKinds";
import type { BookingDrawerParticipantKind } from "../BookingDrawerParticipantActions";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";

type InlineGuestDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
};

type BookingGuest = {
  participantType?: string;
};

export type UseProfessionalFixedLocationCalendarDrawerUiGatesArgs = {
  viewingBookingEvent: CalendarEvent | null;
  isViewingBooking: boolean;
  isCompletedBooking: boolean;
  isCancelledOrInvalidBooking: boolean;
  showIncomingRequestActions: boolean;
  showIncomingErActions: boolean;
  isViewingExisting: boolean;
  incomingRequestEditMode: boolean;
  bookingGuests: readonly BookingGuest[];
  slotLocation: CalendarBookingLocation;
  bookingProjectEnabled: boolean;
  slotBookingScreen: SlotBookingScreen;
  editingEventId: string | null;
  isGuestClientPath: boolean;
  isMollureClientPath: boolean;
  addClientSource: string;
  showPrepayment: boolean;
  prepaymentAmount: number;
  paymentMethod: "online" | "offline";
  setInlineGuestParticipantType: React.Dispatch<
    React.SetStateAction<"guest" | "model">
  >;
  setEditingInlineGuestId: React.Dispatch<React.SetStateAction<string | null>>;
  setInlineGuestDraft: React.Dispatch<React.SetStateAction<InlineGuestDraft>>;
  setShowInlineGuestField: React.Dispatch<React.SetStateAction<boolean>>;
};

/** Drawer participant / edit-gate derived UI flags (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerUiGates({
  viewingBookingEvent,
  isViewingBooking,
  isCompletedBooking,
  isCancelledOrInvalidBooking,
  showIncomingRequestActions,
  showIncomingErActions,
  isViewingExisting,
  incomingRequestEditMode,
  bookingGuests,
  slotLocation,
  bookingProjectEnabled,
  slotBookingScreen,
  editingEventId,
  isGuestClientPath,
  isMollureClientPath,
  addClientSource,
  showPrepayment,
  prepaymentAmount,
  paymentMethod,
  setInlineGuestParticipantType,
  setEditingInlineGuestId,
  setInlineGuestDraft,
  setShowInlineGuestField,
}: UseProfessionalFixedLocationCalendarDrawerUiGatesArgs) {
  const lockClientIdentity =
    isViewingBooking && isClientOriginatedBooking(viewingBookingEvent);
  const showManualBookingParticipantActions =
    !isCompletedBooking &&
    !isCancelledOrInvalidBooking &&
    !showIncomingRequestActions &&
    !showIncomingErActions &&
    (!isViewingExisting || incomingRequestEditMode);
  const extraGuestCount = bookingGuests.filter((guest) => {
    const kind = guest.participantType ?? "guest";
    return kind === "guest" || kind === "model";
  }).length;
  const drawerParticipantKinds = React.useMemo<
    BookingDrawerParticipantKind[]
  >(() => {
    if (!showManualBookingParticipantActions) return [];
    return resolveBookingDrawerParticipantKinds({
      location: slotLocation,
      projectEnabled: slotLocation === "DL" && bookingProjectEnabled,
      extraGuestCount,
      maxFixedLocationGuests: FIXED_LOCATION_MAX_GUESTS,
    });
  }, [
    bookingProjectEnabled,
    extraGuestCount,
    incomingRequestEditMode,
    isViewingExisting,
    showManualBookingParticipantActions,
    slotLocation,
  ]);
  const openInlineGuestForm = React.useCallback(
    (participantType: "guest" | "model") => {
      setInlineGuestParticipantType(participantType);
      setEditingInlineGuestId(null);
      setInlineGuestDraft({
        firstName: "",
        lastName: "",
        email: "",
        phoneCode: "",
        phoneNumber: "",
      });
      setShowInlineGuestField(true);
    },
    [
      setEditingInlineGuestId,
      setInlineGuestDraft,
      setInlineGuestParticipantType,
      setShowInlineGuestField,
    ],
  );
  const showLineItemRemoveButton = !isViewingExisting || incomingRequestEditMode;
  const showClientRemoveButton =
    showLineItemRemoveButton && !lockClientIdentity;
  /** Line-item pencils / guest edit — only after Edit booking (or EBR edit mode). */
  const canEditBookingLineItems =
    !isCompletedBooking &&
    !isCancelledOrInvalidBooking &&
    (incomingRequestEditMode ||
      (!isViewingExisting &&
        !showIncomingRequestActions &&
        !showIncomingErActions));
  /** Add menus + policy remove/edit — same gate as line-item mutate. */
  const canMutateDrawerContents = canEditBookingLineItems;
  const hideClientBookingFooterActions =
    slotBookingScreen === "new-booking" && showIncomingRequestActions;
  const isBookingSubScreen =
    slotBookingScreen === "select-services" ||
    slotBookingScreen === "select-products" ||
    slotBookingScreen === "select-unique-items" ||
    slotBookingScreen === "edit-service" ||
    slotBookingScreen === "add-unique-item" ||
    slotBookingScreen === "add-buffer";
  const drawerPrimaryActionLabel = isBookingSubScreen
    ? "Save"
    : incomingRequestEditMode
      ? "Send EBR"
      : editingEventId
        ? "Update"
        : resolveOfflineBookingPrepayAction({
              isNewBooking: !editingEventId,
              isOfflineBooking:
                isGuestClientPath ||
                addClientSource === "non-mollure" ||
                !isMollureClientPath,
              showPrepayment,
              prepaymentAmount,
              paymentMethod,
            })?.label ?? "Save";

  return {
    lockClientIdentity,
    showManualBookingParticipantActions,
    extraGuestCount,
    drawerParticipantKinds,
    openInlineGuestForm,
    showLineItemRemoveButton,
    showClientRemoveButton,
    canEditBookingLineItems,
    canMutateDrawerContents,
    hideClientBookingFooterActions,
    isBookingSubScreen,
    drawerPrimaryActionLabel,
  };
}
