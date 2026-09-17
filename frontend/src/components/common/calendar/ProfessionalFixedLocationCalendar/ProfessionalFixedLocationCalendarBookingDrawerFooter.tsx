"use client";

import { Box, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerFooterParticipants from "./ProfessionalFixedLocationCalendarBookingDrawerFooterParticipants";

import ProfessionalFixedLocationCalendarBookingDrawerFooterAddOns from "./ProfessionalFixedLocationCalendarBookingDrawerFooterAddOns";

import ProfessionalFixedLocationCalendarBookingDrawerFooterActions from "./ProfessionalFixedLocationCalendarBookingDrawerFooterActions";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerFooterBag = Pick<
  Vm,
  | "activityDetailItem"
  | "addDlParticipant"
  | "applyBufferDraft"
  | "applyProductSelection"
  | "applyServiceEdit"
  | "applyServiceSelection"
  | "applyUniqueItem"
  | "applyUniqueItemSelection"
  | "beginExistingBookingEdit"
  | "bookingCheckoutOpen"
  | "bookingGuests"
  | "bookingMoreAnchor"
  | "cancellationBeforeHours"
  | "cancellationBeforeMinutes"
  | "closeBookingDrawer"
  | "drawerParticipantKinds"
  | "drawerPrimaryActionLabel"
  | "editingEventId"
  | "editingInlineGuestId"
  | "events"
  | "guestDraft"
  | "handleBookingActionSelect"
  | "hasProductDraftSelection"
  | "hasUniqueItemDraftSelection"
  | "hideClientBookingFooterActions"
  | "incomingRequestEditMode"
  | "isBookingDirty"
  | "isBookingSubScreen"
  | "isCancelledOrInvalidBooking"
  | "isCompletedBooking"
  | "isEditingExisting"
  | "isSaving"
  | "isSelectedCompanyClient"
  | "isViewingExisting"
  | "lateCancellationFeePercentDefault"
  | "lateRescheduleFeePercentDefault"
  | "leaveUniqueItemScreen"
  | "m"
  | "negotiationDetails"
  | "noShowFeePercentDefault"
  | "nonMollureDraft"
  | "openExistingBooking"
  | "openInlineGuestForm"
  | "persistBookingFromDrawer"
  | "prepaymentPercentDefault"
  | "reopenBookingAfterSaveRef"
  | "selectedServices"
  | "selectedSlot"
  | "serviceEditOrigin"
  | "serviceSelectionDraft"
  | "setAddClientSource"
  | "setBookingDiscountModalOpen"
  | "setBookingMoreAnchor"
  | "setBookingPhoneDraft"
  | "setCancellationFeeAt"
  | "setEditingBufferId"
  | "setExceededCancellationWindow"
  | "setLateCancellationFeePercent"
  | "setLateCancellationFeePercentCeiling"
  | "setLateRescheduleFeePercent"
  | "setLateRescheduleFeePercentCeiling"
  | "setNoShowFeePercent"
  | "setNoShowFeePercentCeiling"
  | "setPaymentMethod"
  | "setPrepaymentPercent"
  | "setSelectedClient"
  | "setServiceEditAttempted"
  | "setShowInternalNote"
  | "setShowKilometerAllowance"
  | "setShowLateCancellation"
  | "setShowLateRescheduling"
  | "setShowNoShowFee"
  | "setShowPrepayment"
  | "setSlotBookingScreen"
  | "setSlotClientAdded"
  | "setSlotSaveAttempted"
  | "showInlineGuestField"
  | "showInternalNote"
  | "showKilometerAllowance"
  | "showLateCancellation"
  | "showLateRescheduling"
  | "showNoShowFee"
  | "showPrepayment"
  | "showSnackbar"
  | "slotBookingScreen"
  | "slotClientAdded"
  | "slotDrawerTab"
  | "slotLocation"
  | "slotStatus"
  | "slotValidation"
  | "viewingBookingEvent"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerFooterProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerFooterBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerFooter({
  bag,
}: ProfessionalFixedLocationCalendarBookingDrawerFooterProps) {
  const {
    activityDetailItem,
    bookingCheckoutOpen,
    m,
    selectedSlot,
    slotDrawerTab,
  } = bag;

  return bookingCheckoutOpen || activityDetailItem || !selectedSlot ? null : selectedSlot &&
    slotDrawerTab === "booking" ? (
    <Box
      sx={{
        px: 2.5,
        pt: 1.25,
        pb: 2,
        borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        boxShadow: "0 -8px 20px rgba(16, 35, 63, 0.06)",
      }}
    >
      <ProfessionalFixedLocationCalendarBookingDrawerFooterParticipants bag={bag} />
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <ProfessionalFixedLocationCalendarBookingDrawerFooterAddOns bag={bag} />
        <Box sx={{ flex: 1 }} />
        <ProfessionalFixedLocationCalendarBookingDrawerFooterActions bag={bag} />
      </Stack>
    </Box>
  ) : (
    <ProfessionalFixedLocationCalendarBookingDrawerFooterActions
      bag={bag}
      standaloneCheckout
    />
  );
}
