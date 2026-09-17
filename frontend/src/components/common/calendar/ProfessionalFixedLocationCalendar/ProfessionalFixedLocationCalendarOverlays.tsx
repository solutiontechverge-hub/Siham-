"use client";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarOverlaysTeamFilters from "./ProfessionalFixedLocationCalendarOverlaysTeamFilters";

import ProfessionalFixedLocationCalendarOverlaysBlockConflict from "./ProfessionalFixedLocationCalendarOverlaysBlockConflict";

import ProfessionalFixedLocationCalendarOverlaysSettings from "./ProfessionalFixedLocationCalendarOverlaysSettings";

import ProfessionalFixedLocationCalendarOverlaysBookingDialogs from "./ProfessionalFixedLocationCalendarOverlaysBookingDialogs";

import ProfessionalFixedLocationCalendarOverlaysClientDocs from "./ProfessionalFixedLocationCalendarOverlaysClientDocs";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarOverlaysBag = Pick<
  Vm,
  | "addIdentityToClientList"
  | "appliedFilters"
  | "applyFilters"
  | "blockDraft"
  | "blockOverlapOpen"
  | "blockTimeOpen"
  | "bookingDiscountModalOpen"
  | "bookingStatuses"
  | "bookingTotalDiscount"
  | "bookingTypes"
  | "calendarSettings"
  | "cancelModalOpen"
  | "categoryOptions"
  | "closeBookingDrawer"
  | "closeClientDetailsDrawer"
  | "closeNotInListPopover"
  | "closeTeamMenu"
  | "data"
  | "dateOverrides"
  | "designDraft"
  | "designOpen"
  | "discardBrOpen"
  | "discardEbrOpen"
  | "discardErOpen"
  | "discardSplitScreen"
  | "draftFilters"
  | "drawerDocOpen"
  | "drawerDocType"
  | "drawerInvoiceRow"
  | "drawerPaymentIsOffline"
  | "drawerReceiptRow"
  | "editAvailabilityDraft"
  | "editAvailabilityOpen"
  | "events"
  | "filtersOpen"
  | "financeSettings"
  | "handleAcceptConfirmedEr"
  | "handleAcceptIncomingRequest"
  | "handleConfirmBookingAction"
  | "handleConfirmCancel"
  | "handleConfirmNoShow"
  | "handleDiscardBr"
  | "handleDiscardConfirmedEr"
  | "handleDiscardEbr"
  | "handleRejectConfirmedEr"
  | "handleRejectIncomingRequest"
  | "handleSlotAddContinue"
  | "incomingConfirmAction"
  | "initialFilters"
  | "isAddingClient"
  | "isDrawerPrepaymentPaid"
  | "locationFilterAvailable"
  | "locations"
  | "m"
  | "noShowModalOpen"
  | "noShowParticipants"
  | "notInListPopover"
  | "openBookingMessages"
  | "openExistingBooking"
  | "openSplitScreenWith"
  | "openTeamMemberAvailabilityEditor"
  | "pendingBookingAction"
  | "pendingOverviewBlockRef"
  | "persistAvailabilitySettings"
  | "persistBookingFromDrawer"
  | "persistOverviewBlockedTime"
  | "prepaymentAmount"
  | "prepaymentPercent"
  | "professionalBusinessOverride"
  | "publicBusinessHoursDraft"
  | "publicBusinessHoursOpen"
  | "saveClientTechnicalNote"
  | "selectedClient"
  | "serviceOptions"
  | "setAppliedDesign"
  | "setBlockDraft"
  | "setBlockOverlapOpen"
  | "setBlockTimeOpen"
  | "setBookingDiscountModalOpen"
  | "setBookingTotalDiscount"
  | "setCancelModalOpen"
  | "setDateOverrides"
  | "setDesignDraft"
  | "setDesignOpen"
  | "setDiscardBrOpen"
  | "setDiscardEbrOpen"
  | "setDiscardErOpen"
  | "setDraftFilters"
  | "setDrawerDocOpen"
  | "setEditAvailabilityDraft"
  | "setEditAvailabilityOpen"
  | "setFiltersOpen"
  | "setIncomingConfirmAction"
  | "setNoShowModalOpen"
  | "setPendingBookingAction"
  | "setPendingSlotPayload"
  | "setPublicBusinessHoursDraft"
  | "setPublicBusinessHoursOpen"
  | "setResponseActionsDismissed"
  | "setSlotAddAnchor"
  | "setSplitScreen"
  | "setStaffConflictMessage"
  | "setStaffConflictOpen"
  | "setTeamProfileMemberId"
  | "showIncomingErActions"
  | "showPrepayment"
  | "showSnackbar"
  | "slotAddAnchor"
  | "splitScreen"
  | "splitScreenCandidates"
  | "staffConflictAckRef"
  | "staffConflictMessage"
  | "staffConflictOpen"
  | "teamActionAnchor"
  | "teamLabelById"
  | "teamMenuBookings"
  | "teamMenuResource"
  | "teamProfileMemberId"
  | "templateCategoryRows"
  | "viewClient"
  | "viewMode"
  | "viewingBookingEvent"
>;

export type ProfessionalFixedLocationCalendarOverlaysProps = {
  bag: ProfessionalFixedLocationCalendarOverlaysBag;
};

export default function ProfessionalFixedLocationCalendarOverlays({
  bag,
}: ProfessionalFixedLocationCalendarOverlaysProps) {
  return (
    <>
      <ProfessionalFixedLocationCalendarOverlaysTeamFilters bag={bag} />
      <ProfessionalFixedLocationCalendarOverlaysBlockConflict bag={bag} />
      <ProfessionalFixedLocationCalendarOverlaysSettings bag={bag} />
      <ProfessionalFixedLocationCalendarOverlaysBookingDialogs bag={bag} />
      <ProfessionalFixedLocationCalendarOverlaysClientDocs bag={bag} />
    </>
  );
}
