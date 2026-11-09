"use client";

import * as React from "react";

import AppButton from "../../AppButton";

import { Box, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import {
  canEnablePersistentBookingCheckout,
} from "../bookingCheckout";
import { showPersistentCheckoutButton } from "../bookingStatusActions";
import { SALES_META_CHANGED_EVENT } from "../salesOverview.storage";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerFooterActionsBag = Pick<
  Vm,
  | "applyBufferDraft"
  | "applyProductSelection"
  | "applyServiceEdit"
  | "applyServiceSelection"
  | "applyUniqueItem"
  | "applyUniqueItemSelection"
  | "closeBookingDrawer"
  | "drawerPrimaryActionLabel"
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
  | "isViewingExisting"
  | "leaveUniqueItemScreen"
  | "m"
  | "nonMollureDraft"
  | "openExistingBooking"
  | "persistBookingFromDrawer"
  | "reopenBookingAfterSaveRef"
  | "selectedSlot"
  | "serviceEditOrigin"
  | "serviceSelectionDraft"
  | "setAddClientSource"
  | "setBookingPhoneDraft"
  | "setEditingBufferId"
  | "setPaymentMethod"
  | "setSelectedClient"
  | "setServiceEditAttempted"
  | "setSlotBookingScreen"
  | "setSlotClientAdded"
  | "setSlotSaveAttempted"
  | "showSnackbar"
  | "slotBookingScreen"
  | "slotValidation"
  | "viewingBookingEvent"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerFooterActionsBag;
  /** When true, render only the checkout strip used outside the booking-tab footer. */
  standaloneCheckout?: boolean;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerFooterActions({
  bag,
  standaloneCheckout = false,
}: Props) {
  const {
    applyBufferDraft,
    applyProductSelection,
    applyServiceEdit,
    applyServiceSelection,
    applyUniqueItem,
    applyUniqueItemSelection,
    closeBookingDrawer,
    drawerPrimaryActionLabel,
    guestDraft,
    handleBookingActionSelect,
    hasProductDraftSelection,
    hasUniqueItemDraftSelection,
    hideClientBookingFooterActions,
    incomingRequestEditMode,
    isBookingDirty,
    isBookingSubScreen,
    isCancelledOrInvalidBooking,
    isCompletedBooking,
    isEditingExisting,
    isSaving,
    isViewingExisting,
    leaveUniqueItemScreen,
    m,
    nonMollureDraft,
    openExistingBooking,
    persistBookingFromDrawer,
    reopenBookingAfterSaveRef,
    selectedSlot,
    serviceEditOrigin,
    serviceSelectionDraft,
    setAddClientSource,
    setBookingPhoneDraft,
    setEditingBufferId,
    setPaymentMethod,
    setSelectedClient,
    setServiceEditAttempted,
    setSlotBookingScreen,
    setSlotClientAdded,
    setSlotSaveAttempted,
    showSnackbar,
    slotBookingScreen,
    slotValidation,
    viewingBookingEvent,
  } = bag;

  const [salesMetaTick, setSalesMetaTick] = React.useState(0);
  React.useEffect(() => {
    const onMeta = () => setSalesMetaTick((n) => n + 1);
    window.addEventListener(SALES_META_CHANGED_EVENT, onMeta);
    return () => window.removeEventListener(SALES_META_CHANGED_EVENT, onMeta);
  }, []);

  void salesMetaTick;

  const showCheckout =
    showPersistentCheckoutButton(viewingBookingEvent) &&
    canEnablePersistentBookingCheckout(viewingBookingEvent);

  if (standaloneCheckout) {
    if (!showCheckout) return null;
    return (
      <Box
        sx={{
          px: 2.5,
          pt: 1.25,
          pb: 2,
          borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: "#fff",
        }}
      >
        <Stack direction="row" justifyContent="flex-end">
          <AppButton
            tone="primary"
            onClick={() => void handleBookingActionSelect("checkout")}
            sx={{ height: 38, minWidth: 110 }}
          >
            Checkout
          </AppButton>
        </Stack>
      </Box>
    );
  }

  return (
    <>
      {!hideClientBookingFooterActions ? (
        <AppButton
          tone="secondary"
          onClick={async () => {
            if (slotBookingScreen === "add-unique-item") {
              leaveUniqueItemScreen();
              return;
            }
            if (slotBookingScreen === "add-buffer") {
              setEditingBufferId(null);
              setSlotBookingScreen("new-booking");
              return;
            }
            if (slotBookingScreen === "edit-service") {
              setSlotBookingScreen(serviceEditOrigin);
              return;
            }
            if (
              slotBookingScreen === "select-services" ||
              slotBookingScreen === "select-products" ||
              slotBookingScreen === "select-unique-items"
            ) {
              setSlotBookingScreen("new-booking");
              return;
            }
            if (
              slotBookingScreen === "non-mollure-individual" ||
              slotBookingScreen === "non-mollure-company"
            ) {
              setSlotBookingScreen("add-client-choice");
              return;
            }
            if (slotBookingScreen === "guest") {
              setSlotBookingScreen("add-client-choice");
              return;
            }
            if (slotBookingScreen === "add-client-choice") {
              setSlotBookingScreen("new-booking");
              return;
            }
            closeBookingDrawer();
          }}
          sx={{
            height: 38,
            minWidth: 110,
          }}
        >
          {slotBookingScreen === "new-booking" ? "Cancel" : "Back"}
        </AppButton>
      ) : null}
      {!hideClientBookingFooterActions &&
        (slotBookingScreen === "new-booking" &&
        (isCompletedBooking || isCancelledOrInvalidBooking) ? null : (
          <AppButton
            tone="primary"
            disabled={
              isSaving ||
              (slotBookingScreen === "guest"
                ? false
                : slotBookingScreen === "edit-service"
                  ? isViewingExisting || !slotValidation.isValid
                  : slotBookingScreen === "select-services"
                    ? isViewingExisting ||
                      serviceSelectionDraft.length === 0
                    : slotBookingScreen === "select-products"
                      ? isViewingExisting || !hasProductDraftSelection
                      : slotBookingScreen === "select-unique-items"
                        ? isViewingExisting || !hasUniqueItemDraftSelection
                        : slotBookingScreen === "add-unique-item"
                          ? isViewingExisting || !slotValidation.isValid
                          : slotBookingScreen === "add-buffer"
                            ? isViewingExisting || !slotValidation.isValid
                            : incomingRequestEditMode
                              ? !slotValidation.isValid
                              : drawerPrimaryActionLabel === "Update"
                                ? !isEditingExisting ||
                                  !slotValidation.isValid ||
                                  !isBookingDirty
                                : !slotValidation.isValid ||
                                  isViewingExisting)
            }
            onClick={() => {
              if (isCompletedBooking || isCancelledOrInvalidBooking)
                return;
              setSlotSaveAttempted(true);
              if (
                drawerPrimaryActionLabel === "Update" &&
                !isEditingExisting
              ) {
                return;
              }
              if (slotBookingScreen === "edit-service") {
                if (isViewingExisting) return;
                setServiceEditAttempted(true);
                if (!slotValidation.isValid) return;
                applyServiceEdit();
                return;
              }
              if (slotBookingScreen === "select-services") {
                if (
                  isViewingExisting ||
                  serviceSelectionDraft.length === 0
                )
                  return;
                applyServiceSelection();
                return;
              }
              if (slotBookingScreen === "select-products") {
                if (isViewingExisting || !hasProductDraftSelection)
                  return;
                applyProductSelection();
                return;
              }
              if (slotBookingScreen === "select-unique-items") {
                if (isViewingExisting || !hasUniqueItemDraftSelection)
                  return;
                applyUniqueItemSelection();
                return;
              }
              if (slotBookingScreen === "add-unique-item") {
                if (isViewingExisting || !slotValidation.isValid)
                  return;
                applyUniqueItem();
                return;
              }
              if (slotBookingScreen === "add-buffer") {
                if (isViewingExisting || !slotValidation.isValid)
                  return;
                applyBufferDraft();
                return;
              }
              if (!slotValidation.isValid) return;
              if (isBookingSubScreen) return;
              if (
                slotBookingScreen === "non-mollure-individual" ||
                slotBookingScreen === "non-mollure-company"
              ) {
                setAddClientSource("non-mollure");
                setSelectedClient({
                  name:
                    `${nonMollureDraft.firstName} ${nonMollureDraft.lastName}`.trim() ||
                    nonMollureDraft.legalName.trim() ||
                    "Client",
                  email: nonMollureDraft.email.trim(),
                  mollureUserId: null,
                  isMollure: false,
                  clientKind:
                    slotBookingScreen === "non-mollure-company"
                      ? "company"
                      : "individual",
                });
                setBookingPhoneDraft({
                  phoneCode: nonMollureDraft.phoneCode,
                  phoneNumber: nonMollureDraft.phoneNumber,
                });
                setPaymentMethod("online");
                setSlotClientAdded(true);
                showSnackbar({
                  severity: "success",
                  message: "Client details saved.",
                });
                setSlotBookingScreen("new-booking");
                setSlotSaveAttempted(false);
                return;
              }
              if (slotBookingScreen === "guest") {
                setAddClientSource("guest");
                setSelectedClient({
                  name:
                    `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ||
                    "Guest",
                  email: guestDraft.email.trim(),
                  mollureUserId: null,
                  isGuest: true,
                });
                setBookingPhoneDraft({
                  phoneCode: guestDraft.phoneCode,
                  phoneNumber: guestDraft.phoneNumber,
                });
                setPaymentMethod("offline");
                setSlotClientAdded(true);
                showSnackbar({
                  severity: "success",
                  message: "Guest added.",
                });
                setSlotBookingScreen("new-booking");
                setSlotSaveAttempted(false);
                return;
              }
              if (!selectedSlot) return;
              void persistBookingFromDrawer().then((saved) => {
                if (!saved) return;
                const reopen = reopenBookingAfterSaveRef.current;
                reopenBookingAfterSaveRef.current = null;
                closeBookingDrawer();
                if (reopen) {
                  window.setTimeout(() => {
                    openExistingBooking(reopen);
                  }, 60);
                }
              });
            }}
            sx={{
              height: 38,
              minWidth: 110,
            }}
          >
            {drawerPrimaryActionLabel}
          </AppButton>
        ))}
      {showCheckout && slotBookingScreen === "new-booking" ? (
        <AppButton
          tone="primary"
          onClick={() => void handleBookingActionSelect("checkout")}
          sx={{
            height: 38,
            minWidth: 110,
          }}
        >
          Checkout
        </AppButton>
      ) : null}
    </>
  );
}
