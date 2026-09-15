import * as React from "react";
import { emptyDesiredLocation } from "../bookingEventDetails";
import { isPolicyFeeConfigured } from "../bookingGroupAddOns";
import { emptyBookingServiceEditDraft } from "../../../../data/bookingServiceEdit.data";
import { createEmptyProductSelectionDraft } from "../../../../data/bookingProductCatalog.data";
import { emptyBookingUniqueItemDraft } from "../../../../data/bookingUniqueItem.data";
import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { SelectedSlot } from "../calendar.utils";
import type { InlineGuestDraftState } from "./useProfessionalFixedLocationCalendar.types";
import { clearProfessionalBookingDrawerDraft } from "./professionalBookingDrawerDraft";

/** Drawer-reset setters bag — intentional (ponytail: keep apply colocated). */
export type UseProfessionalFixedLocationCalendarOpenBookingDrawerArgs = {
  supportedLocations: readonly CalendarBookingLocation[];
  kilometerAllowanceEurPerKmDefault?: string;
  lateRescheduleFeePercentDefault?: string;
  prepaymentPercentDefault?: string;
  emptyInlineGuestDraft: InlineGuestDraftState;
  staffConflictAckRef: React.MutableRefObject<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply: Record<string, (...args: any[]) => void>;
};

export function useProfessionalFixedLocationCalendarOpenBookingDrawer({
  supportedLocations,
  kilometerAllowanceEurPerKmDefault,
  lateRescheduleFeePercentDefault,
  prepaymentPercentDefault,
  emptyInlineGuestDraft,
  staffConflictAckRef,
  apply,
}: UseProfessionalFixedLocationCalendarOpenBookingDrawerArgs) {
  const {
    setSelectedSlot,
    setSlotDrawerTab,
    setSlotBookingScreen,
    setSlotLocation,
    setSlotBookingType,
    setSlotStatus,
    setSlotClientAdded,
    setAllowDrawerTimeSelection,
    setSlotCalendarOpen,
    setSlotCalendarTouched,
    setSelectedClient,
    setSelectedServices,
    setSelectedProducts,
    setServiceSelectionDraft,
    setServiceOverridesDraft,
    setServiceEditDraft,
    setServiceEditAttempted,
    setProductSelectionDraft,
    setUniqueItemSelectionDraft,
    setUniqueItemDraft,
    setUniqueItemOrigin,
    setEditingCatalogProductId,
    setBookingUniqueItems,
    setCustomBookingProducts,
    setEditingBookingLine,
    setEditingEventId,
    setIsEditingExisting,
    setBookingGuests,
    setShowInlineGuestField,
    setEditingInlineGuestId,
    setInlineGuestDraft,
    setInlineGuestParticipantType,
    setBookingProjectEnabled,
    setBookingProjectDescription,
    setBookingProjectUploads,
    setBookingTotalDiscount,
    setBookingDiscountModalOpen,
    setShowLateCancellation,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setShowLateRescheduling,
    setLateRescheduleFeePercent,
    setLateRescheduleFeePercentCeiling,
    setShowNoShowFee,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setCancellationFeeAt,
    setExceededCancellationWindow,
    setShowInternalNote,
    setBookingInternalNote,
    setShowPrepayment,
    setPrepaymentPercent,
    setPaymentMethod,
    setShowKilometerAllowance,
    setKilometerAllowanceDraft,
    setDesiredLocationDraft,
    setAddMenuTarget,
    setSelectionTarget,
    setSlotAddMenuAnchor,
    setGuestDraft,
    setBookingPhoneDraft,
    setNonMollureClientType,
    setNonMollureDraft,
    setIncomingRequestEditMode,
    setOriginalServicesSnapshot,
    setDiscardBrOpen,
    setDiscardEbrOpen,
    setDiscardErOpen,
    setSlotDrawerOpen,
  } = apply;

  const openBookingDrawer = React.useCallback(
    (
      payload: SelectedSlot,
      options?: {
        allowTimeSelection?: boolean;
        openCalendar?: boolean;
        calendarTouched?: boolean;
      },
    ) => {
      clearProfessionalBookingDrawerDraft();
      const allowTimeSelection = Boolean(options?.allowTimeSelection);
      const openCalendar = options?.openCalendar ?? allowTimeSelection;
      const calendarTouched = options?.calendarTouched ?? !allowTimeSelection;
      setSelectedSlot(payload);
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      const initialLocation = supportedLocations[0] ?? "FL";
      setSlotLocation(initialLocation);
      setSlotBookingType("Online");
      setSlotStatus("Requested");
      setSlotClientAdded(false);
      setAllowDrawerTimeSelection(allowTimeSelection);
      setSlotCalendarOpen(openCalendar);
      setSlotCalendarTouched(calendarTouched);
      setSelectedClient(null);
      setSelectedServices([]);
      setSelectedProducts([]);
      setServiceSelectionDraft([]);
      setServiceOverridesDraft({});
      setServiceEditDraft(emptyBookingServiceEditDraft());
      setServiceEditAttempted(false);
      setProductSelectionDraft(createEmptyProductSelectionDraft());
      setUniqueItemSelectionDraft(createEmptyProductSelectionDraft());
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setUniqueItemOrigin("unique");
      setEditingCatalogProductId(null);
      setBookingUniqueItems([]);
      setCustomBookingProducts([]);
      setEditingBookingLine(null);
      setEditingEventId(null);
      setIsEditingExisting(false);
      setBookingGuests([]);
      setShowInlineGuestField(false);
      setEditingInlineGuestId(null);
      setInlineGuestDraft(emptyInlineGuestDraft);
      setInlineGuestParticipantType("guest");
      staffConflictAckRef.current = false;
      setBookingProjectEnabled(false);
      setBookingProjectDescription("");
      setBookingProjectUploads([]);
      setBookingTotalDiscount(null);
      setBookingDiscountModalOpen(false);
      setShowLateCancellation(false);
      setLateCancellationFeePercent("");
      setLateCancellationFeePercentCeiling("");
      setShowLateRescheduling(false);
      setLateRescheduleFeePercent(lateRescheduleFeePercentDefault ?? "");
      setLateRescheduleFeePercentCeiling("");
      setShowNoShowFee(false);
      setNoShowFeePercent("");
      setNoShowFeePercentCeiling("");
      setCancellationFeeAt(undefined);
      setExceededCancellationWindow(undefined);
      setShowInternalNote(false);
      setBookingInternalNote("");
      const hasSetupPrepayment = isPolicyFeeConfigured(
        prepaymentPercentDefault,
      );
      setShowPrepayment(hasSetupPrepayment);
      setPrepaymentPercent(
        hasSetupPrepayment ? String(prepaymentPercentDefault).trim() : "",
      );
      setPaymentMethod("online");
      if (initialLocation === "DL") {
        setShowKilometerAllowance(true);
        setKilometerAllowanceDraft({
          eurPerKm: String(kilometerAllowanceEurPerKmDefault ?? "").trim(),
          totalKilometer: "",
        });
      } else {
        setShowKilometerAllowance(false);
        setKilometerAllowanceDraft({ eurPerKm: "", totalKilometer: "" });
      }
      setDesiredLocationDraft(emptyDesiredLocation());
      setInlineGuestDraft(emptyInlineGuestDraft);
      setAddMenuTarget("client");
      setSelectionTarget("client");
      setSlotAddMenuAnchor(null);
      setGuestDraft({
        firstName: "",
        lastName: "",
        email: "",
        phoneCode: "",
        phoneNumber: "",
      });
      setBookingPhoneDraft({ phoneCode: "", phoneNumber: "" });
      setNonMollureClientType("");
      setNonMollureDraft({
        firstName: "",
        lastName: "",
        email: "",
        gender: "",
        dob: "",
        phoneCode: "",
        phoneNumber: "",
        companyName: "",
        legalName: "",
        coc: "",
        vat: "",
        contactFirstName: "",
        contactLastName: "",
        street: "",
        streetNumber: "",
        postalCode: "",
        province: "",
        municipality: "",
      });
      setIncomingRequestEditMode(false);
      setOriginalServicesSnapshot([]);
      setDiscardBrOpen(false);
      setDiscardEbrOpen(false);
      setDiscardErOpen(false);
      setSlotDrawerOpen(true);
    },
    [
      supportedLocations,
      kilometerAllowanceEurPerKmDefault,
      lateRescheduleFeePercentDefault,
      prepaymentPercentDefault,
    ],
  );
  return { openBookingDrawer };
}
