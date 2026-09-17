import * as React from "react";
import type { ManualEntryDiscount } from "../../../sections/finance/manualEntry.data";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { SelectedSlot } from "../calendar.utils";
import {
  clearProfessionalBookingDrawerDraft,
  professionalBookingDrawerDraftHasContent,
  readProfessionalBookingDrawerDraft,
  writeProfessionalBookingDrawerDraft,
  type ProfessionalBookingDrawerDraft,
} from "./professionalBookingDrawerDraft";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";

export type UseProfessionalBookingDrawerDraftArgs = {
  editingEventId: string | null;
  slotDrawerOpen: boolean;
  selectedSlot: SelectedSlot | null;
  slotLocation: CalendarBookingLocation;
  slotBookingType: CalendarBookingType;
  slotStatus: CalendarBookingStatus;
  slotClientAdded: boolean;
  allowDrawerTimeSelection: boolean;
  slotCalendarTouched: boolean;
  selectedClient: ProfessionalBookingDrawerDraft["selectedClient"];
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingProductLineItem[];
  bookingGuests: ProfessionalBookingDrawerDraft["bookingGuests"];
  bookingProjectEnabled: boolean;
  bookingProjectDescription: string;
  bookingProjectUploads: ProfessionalBookingDrawerDraft["bookingProjectUploads"];
  desiredLocationDraft: ProfessionalBookingDrawerDraft["desiredLocationDraft"];
  showInternalNote: boolean;
  bookingInternalNote: string;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: ProfessionalBookingDrawerDraft["kilometerAllowanceDraft"];
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  bookingTotalDiscount: ManualEntryDiscount | null;
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling: string;
  showNoShowFee: boolean;
  noShowFeePercent: string;
  noShowFeePercentCeiling: string;
  guestDraft: ProfessionalBookingDrawerDraft["guestDraft"];
  bookingPhoneDraft: ProfessionalBookingDrawerDraft["bookingPhoneDraft"];
  nonMollureClientType: "" | "individual" | "company";
  nonMollureDraft: ProfessionalBookingDrawerDraft["nonMollureDraft"];
  selectionTarget: "client" | string;
  addMenuTarget: "client" | string;
  // restore setters
  setSelectedSlot: (slot: SelectedSlot) => void;
  setSlotLocation: (loc: CalendarBookingLocation) => void;
  setSlotBookingType: (t: CalendarBookingType) => void;
  setSlotStatus: (s: CalendarBookingStatus) => void;
  setSlotClientAdded: (v: boolean) => void;
  setAllowDrawerTimeSelection: (v: boolean) => void;
  setSlotCalendarOpen: (v: boolean) => void;
  setSlotCalendarTouched: (v: boolean) => void;
  setSelectedClient: (
    c: ProfessionalBookingDrawerDraft["selectedClient"],
  ) => void;
  setSelectedServices: (rows: BookingServiceLineItem[]) => void;
  setSelectedProducts: (rows: BookingProductLineItem[]) => void;
  setBookingUniqueItems: (rows: BookingProductLineItem[]) => void;
  setBookingGuests: (
    rows: ProfessionalBookingDrawerDraft["bookingGuests"],
  ) => void;
  setBookingProjectEnabled: (v: boolean) => void;
  setBookingProjectDescription: (v: string) => void;
  setBookingProjectUploads: (
    rows: ProfessionalBookingDrawerDraft["bookingProjectUploads"],
  ) => void;
  setDesiredLocationDraft: (
    v: ProfessionalBookingDrawerDraft["desiredLocationDraft"],
  ) => void;
  setShowInternalNote: (v: boolean) => void;
  setBookingInternalNote: (v: string) => void;
  setShowKilometerAllowance: (v: boolean) => void;
  setKilometerAllowanceDraft: (
    v: ProfessionalBookingDrawerDraft["kilometerAllowanceDraft"],
  ) => void;
  setShowPrepayment: (v: boolean) => void;
  setPrepaymentPercent: (v: string) => void;
  setPaymentMethod: (v: "online" | "offline") => void;
  setBookingTotalDiscount: (v: ManualEntryDiscount | null) => void;
  setShowLateCancellation: (v: boolean) => void;
  setLateCancellationFeePercent: (v: string) => void;
  setLateCancellationFeePercentCeiling: (v: string) => void;
  setShowLateRescheduling: (v: boolean) => void;
  setLateRescheduleFeePercent: (v: string) => void;
  setLateRescheduleFeePercentCeiling: (v: string) => void;
  setShowNoShowFee: (v: boolean) => void;
  setNoShowFeePercent: (v: string) => void;
  setNoShowFeePercentCeiling: (v: string) => void;
  setGuestDraft: (v: ProfessionalBookingDrawerDraft["guestDraft"]) => void;
  setBookingPhoneDraft: (
    v: ProfessionalBookingDrawerDraft["bookingPhoneDraft"],
  ) => void;
  setNonMollureClientType: (v: "" | "individual" | "company") => void;
  setNonMollureDraft: (
    v: ProfessionalBookingDrawerDraft["nonMollureDraft"],
  ) => void;
  setSelectionTarget: (v: "client" | string) => void;
  setAddMenuTarget: (v: "client" | string) => void;
  setSlotBookingScreen: React.Dispatch<React.SetStateAction<SlotBookingScreen>>;
  setSlotDrawerTab: (v: "booking" | "sales" | "activity") => void;
  setEditingEventId: (v: string | null) => void;
  setIsEditingExisting: (v: boolean) => void;
  setSlotDrawerOpen: (v: boolean) => void;
};

/** Persist / restore New Booking drawer draft across reloads (ponytail: sessionStorage). */
export function useProfessionalBookingDrawerDraft(
  args: UseProfessionalBookingDrawerDraftArgs,
) {
  const restoredRef = React.useRef(false);

  React.useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const draft = readProfessionalBookingDrawerDraft();
    if (!professionalBookingDrawerDraftHasContent(draft) || !draft) return;

    args.setEditingEventId(null);
    args.setIsEditingExisting(false);
    args.setSlotBookingScreen("new-booking");
    args.setSlotDrawerTab("booking");
    args.setSelectedSlot(draft.selectedSlot);
    args.setSlotLocation(draft.slotLocation);
    args.setSlotBookingType(draft.slotBookingType);
    args.setSlotStatus(draft.slotStatus);
    args.setSlotClientAdded(draft.slotClientAdded);
    args.setAllowDrawerTimeSelection(draft.allowDrawerTimeSelection);
    args.setSlotCalendarOpen(false);
    args.setSlotCalendarTouched(draft.slotCalendarTouched);
    args.setSelectedClient(draft.selectedClient);
    args.setSelectedServices(draft.selectedServices);
    args.setSelectedProducts(draft.selectedProducts);
    args.setBookingUniqueItems(draft.bookingUniqueItems);
    args.setBookingGuests(draft.bookingGuests);
    args.setBookingProjectEnabled(draft.bookingProjectEnabled);
    args.setBookingProjectDescription(draft.bookingProjectDescription);
    args.setBookingProjectUploads(draft.bookingProjectUploads);
    args.setDesiredLocationDraft(draft.desiredLocationDraft);
    args.setShowInternalNote(draft.showInternalNote);
    args.setBookingInternalNote(draft.bookingInternalNote);
    args.setShowKilometerAllowance(draft.showKilometerAllowance);
    args.setKilometerAllowanceDraft(draft.kilometerAllowanceDraft);
    args.setShowPrepayment(draft.showPrepayment);
    args.setPrepaymentPercent(draft.prepaymentPercent);
    args.setPaymentMethod(draft.paymentMethod);
    args.setBookingTotalDiscount(draft.bookingTotalDiscount);
    args.setShowLateCancellation(draft.showLateCancellation);
    args.setLateCancellationFeePercent(draft.lateCancellationFeePercent);
    args.setLateCancellationFeePercentCeiling(
      draft.lateCancellationFeePercentCeiling,
    );
    args.setShowLateRescheduling(draft.showLateRescheduling);
    args.setLateRescheduleFeePercent(draft.lateRescheduleFeePercent);
    args.setLateRescheduleFeePercentCeiling(
      draft.lateRescheduleFeePercentCeiling,
    );
    args.setShowNoShowFee(draft.showNoShowFee);
    args.setNoShowFeePercent(draft.noShowFeePercent);
    args.setNoShowFeePercentCeiling(draft.noShowFeePercentCeiling);
    args.setGuestDraft(draft.guestDraft);
    args.setBookingPhoneDraft(draft.bookingPhoneDraft);
    args.setNonMollureClientType(draft.nonMollureClientType);
    args.setNonMollureDraft(draft.nonMollureDraft);
    args.setSelectionTarget(draft.selectionTarget);
    args.setAddMenuTarget(draft.addMenuTarget);
    args.setSlotDrawerOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore on mount
  }, []);

  React.useEffect(() => {
    if (args.editingEventId || !args.slotDrawerOpen || !args.selectedSlot) {
      return;
    }
    const draft: ProfessionalBookingDrawerDraft = {
      selectedSlot: args.selectedSlot,
      slotLocation: args.slotLocation,
      slotBookingType: args.slotBookingType,
      slotStatus: args.slotStatus,
      slotClientAdded: args.slotClientAdded,
      allowDrawerTimeSelection: args.allowDrawerTimeSelection,
      slotCalendarTouched: args.slotCalendarTouched,
      selectedClient: args.selectedClient,
      selectedServices: args.selectedServices,
      selectedProducts: args.selectedProducts,
      bookingUniqueItems: args.bookingUniqueItems,
      bookingGuests: args.bookingGuests,
      bookingProjectEnabled: args.bookingProjectEnabled,
      bookingProjectDescription: args.bookingProjectDescription,
      bookingProjectUploads: args.bookingProjectUploads.map((u) => ({
        id: u.id,
        name: u.name,
        previewUrl: u.previewUrl,
        url: u.url,
        mimeType: u.mimeType,
        kind: u.kind,
      })),
      desiredLocationDraft: args.desiredLocationDraft,
      showInternalNote: args.showInternalNote,
      bookingInternalNote: args.bookingInternalNote,
      showKilometerAllowance: args.showKilometerAllowance,
      kilometerAllowanceDraft: args.kilometerAllowanceDraft,
      showPrepayment: args.showPrepayment,
      prepaymentPercent: args.prepaymentPercent,
      paymentMethod: args.paymentMethod,
      bookingTotalDiscount: args.bookingTotalDiscount,
      showLateCancellation: args.showLateCancellation,
      lateCancellationFeePercent: args.lateCancellationFeePercent,
      lateCancellationFeePercentCeiling: args.lateCancellationFeePercentCeiling,
      showLateRescheduling: args.showLateRescheduling,
      lateRescheduleFeePercent: args.lateRescheduleFeePercent,
      lateRescheduleFeePercentCeiling: args.lateRescheduleFeePercentCeiling,
      showNoShowFee: args.showNoShowFee,
      noShowFeePercent: args.noShowFeePercent,
      noShowFeePercentCeiling: args.noShowFeePercentCeiling,
      guestDraft: args.guestDraft,
      bookingPhoneDraft: args.bookingPhoneDraft,
      nonMollureClientType: args.nonMollureClientType,
      nonMollureDraft: args.nonMollureDraft,
      selectionTarget: args.selectionTarget,
      addMenuTarget: args.addMenuTarget,
      savedAt: new Date().toISOString(),
    };
    if (!professionalBookingDrawerDraftHasContent(draft)) return;
    writeProfessionalBookingDrawerDraft(draft);
  }, [
    args.addMenuTarget,
    args.allowDrawerTimeSelection,
    args.bookingGuests,
    args.bookingInternalNote,
    args.bookingPhoneDraft,
    args.bookingProjectDescription,
    args.bookingProjectEnabled,
    args.bookingProjectUploads,
    args.bookingTotalDiscount,
    args.bookingUniqueItems,
    args.desiredLocationDraft,
    args.editingEventId,
    args.guestDraft,
    args.kilometerAllowanceDraft,
    args.lateCancellationFeePercent,
    args.lateCancellationFeePercentCeiling,
    args.lateRescheduleFeePercent,
    args.lateRescheduleFeePercentCeiling,
    args.noShowFeePercent,
    args.noShowFeePercentCeiling,
    args.nonMollureClientType,
    args.nonMollureDraft,
    args.paymentMethod,
    args.prepaymentPercent,
    args.selectedClient,
    args.selectedProducts,
    args.selectedServices,
    args.selectedSlot,
    args.selectionTarget,
    args.showInternalNote,
    args.showKilometerAllowance,
    args.showLateCancellation,
    args.showLateRescheduling,
    args.showNoShowFee,
    args.showPrepayment,
    args.slotCalendarTouched,
    args.slotClientAdded,
    args.slotDrawerOpen,
    args.slotBookingType,
    args.slotLocation,
    args.slotStatus,
  ]);

  return { clearProfessionalBookingDrawerDraft };
}
