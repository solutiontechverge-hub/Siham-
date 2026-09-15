"use client";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeader from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeader";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendar from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsProject from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsProject";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsClient from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsClient";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanning from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanning";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPayment from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPayment";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotals from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotals";

import { Box, Stack } from "@mui/material";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsBag = Pick<
  Vm,
  | "actionFeedback"
  | "addClientSource"
  | "addIdentityToClientList"
  | "addMenuButtonRef"
  | "addMenuTarget"
  | "allowDrawerTimeSelection"
  | "applyDesiredLocationKilometerDefaults"
  | "applyDrawerTimeSlot"
  | "beginEditBuffer"
  | "beginEditInlineGuest"
  | "beginExistingBookingEdit"
  | "bookingActionAnchor"
  | "bookingDiscountAmount"
  | "bookingDrawerNotListedIdentity"
  | "bookingGuests"
  | "bookingInternalNote"
  | "bookingPhoneDraft"
  | "bookingPrice"
  | "bookingProjectDescription"
  | "bookingProjectEnabled"
  | "bookingProjectUploads"
  | "bookingTotalDiscount"
  | "bookingTotalForSave"
  | "bookingUniqueItems"
  | "businessResponseWindowInput"
  | "calendarFieldLabel"
  | "canEditBookingLineItems"
  | "canMutateDrawerContents"
  | "canUseBookingProject"
  | "cancelledServicesForDrawer"
  | "changeBookingServiceStaff"
  | "data"
  | "defaultDateIso"
  | "deleteProjectUpload"
  | "desiredLocationDraft"
  | "desiredVisitMunicipalityOptions"
  | "drawerOrderedBlocks"
  | "drawerParticipantOrdinals"
  | "drawerPaymentMethod"
  | "drawerPlanningGuests"
  | "drawerPriceDisplay"
  | "drawerSelectableTimes"
  | "editingInlineGuestId"
  | "emptyInlineGuestDraft"
  | "exceededCancellationWindow"
  | "firstDrawerPlanningId"
  | "fixedLocationAddress"
  | "getServiceStaffOptions"
  | "grid"
  | "handleBookingActionSelect"
  | "handleClientNameClick"
  | "handleProjectFilePick"
  | "handleRestartResponseTime"
  | "incomingClientNote"
  | "incomingErNote"
  | "incomingRequestEditMode"
  | "isAddingClient"
  | "isDrawerPrepaymentPaid"
  | "isGuestClientPath"
  | "isMollureClientPath"
  | "isViewingBooking"
  | "isViewingExisting"
  | "kilometerAllowanceAmount"
  | "kilometerAllowanceDraft"
  | "lateCancelNoticeLabel"
  | "lateCancellationFeeAmount"
  | "lateCancellationFeePercent"
  | "lateCancellationFeePercentCeiling"
  | "lateCancellationFeePercentDefault"
  | "lateRescheduleFeeAmount"
  | "lateRescheduleFeePercent"
  | "lateRescheduleFeePercentCeiling"
  | "lateRescheduleFeePercentDefault"
  | "lineDiscountAmount"
  | "m"
  | "mainCancelledServices"
  | "noShowFeeAmount"
  | "noShowFeePercent"
  | "noShowFeePercentCeiling"
  | "noShowFeePercentDefault"
  | "onlinePrepayBlocksAccept"
  | "openActivityComparison"
  | "openBookingMessages"
  | "openBookingStaffProfile"
  | "openDrawerLineTagComparison"
  | "openEditBookingProductLine"
  | "openEditBookingUniqueLine"
  | "openEditServiceFromLineItem"
  | "openSelectProducts"
  | "openSelectServices"
  | "openSelectUniqueItems"
  | "paymentMethod"
  | "paymentMethodPolicy"
  | "persistedPaymentIsOffline"
  | "postBookingPendingPayment"
  | "prepaymentAmount"
  | "prepaymentPercent"
  | "prepaymentSectionTitle"
  | "priceSummaryLines"
  | "primaryMainClientServices"
  | "projectFileInputRef"
  | "remainingAfterPrepayment"
  | "removeClientService"
  | "removeGuestService"
  | "renderInlineGuestFields"
  | "reorderClientServices"
  | "reorderDrawerPlanning"
  | "reorderGuestServices"
  | "requestedScheduleLabel"
  | "resolveBookingStaff"
  | "resolveProductEditTag"
  | "resolveServiceEditTag"
  | "resolvedSelectedClientKind"
  | "resourceNameById"
  | "responseActionsDismissed"
  | "responseTimeConfigured"
  | "scheduleChangeTags"
  | "selectedClient"
  | "selectedProducts"
  | "selectedSlot"
  | "setActionFeedback"
  | "setActiveDateIso"
  | "setAddMenuTarget"
  | "setBookingActionAnchor"
  | "setBookingGuests"
  | "setBookingInternalNote"
  | "setBookingPhoneDraft"
  | "setBookingProjectDescription"
  | "setBookingProjectEnabled"
  | "setBookingUniqueItems"
  | "setCancellationFeeAt"
  | "setDesiredLocationDraft"
  | "setEditingInlineGuestId"
  | "setExceededCancellationWindow"
  | "setFocusSalesCardId"
  | "setIncomingConfirmAction"
  | "setInlineGuestDraft"
  | "setKilometerAllowanceDraft"
  | "setLateCancellationFeePercent"
  | "setLateCancellationFeePercentCeiling"
  | "setLateRescheduleFeePercent"
  | "setLateRescheduleFeePercentCeiling"
  | "setNoShowFeePercent"
  | "setNoShowFeePercentCeiling"
  | "setPaymentMethod"
  | "setPrepaymentPercent"
  | "setProductSelectionDraft"
  | "setSelectedClient"
  | "setSelectedProducts"
  | "setSelectedSlot"
  | "setShowInlineGuestField"
  | "setShowKilometerAllowance"
  | "setShowLateCancellation"
  | "setShowLateRescheduling"
  | "setShowNoShowFee"
  | "setShowPrepayment"
  | "setSlotAddMenuAnchor"
  | "setSlotBookingScreen"
  | "setSlotCalendarOpen"
  | "setSlotCalendarTouched"
  | "setSlotClientAdded"
  | "setSlotDrawerTab"
  | "setSlotLocation"
  | "showClientRemoveButton"
  | "showExpiredResponseBanner"
  | "showIncomingErActions"
  | "showIncomingRequestActions"
  | "showIncomingSuggestChange"
  | "showInlineGuestField"
  | "showInternalNote"
  | "showKilometerAllowance"
  | "showLateCancellation"
  | "showLateRescheduling"
  | "showLineItemRemoveButton"
  | "showNoShowFee"
  | "showPrepayment"
  | "silentFieldUpdates"
  | "slotAddMenuAnchor"
  | "slotCalendarOpen"
  | "slotCalendarTouched"
  | "slotClientAdded"
  | "slotErrors"
  | "slotLocation"
  | "theme"
  | "todayIso"
  | "totalPrice"
  | "unavailableBookingTooltip"
  | "viewingBookingEvent"
  | "viewingBookingOverlapsBlockTime"
  | "viewingBookingPaymentDue"
  | "viewingBookingUnread"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetails({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsProps) {
  const { slotClientAdded } = bag;

  return (
    <Stack spacing={1.6}>
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeader bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendar bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsProject bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsClient bag={bag} />
      {slotClientAdded ? (
        <>
          <ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanning bag={bag} />
          <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPayment bag={bag} />
          <ProfessionalFixedLocationCalendarBookingDrawerDetailsNotesTotals bag={bag} />
          <Box sx={{ flex: 1, minHeight: 40 }} />
        </>
      ) : (
        <Box sx={{ flex: 1, minHeight: 360 }} />
      )}
    </Stack>
  );
}
