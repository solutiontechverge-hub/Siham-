import * as React from "react";
import type {
  CalendarBookingGuestItem,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { BookingUniqueItemLine } from "../../../../data/bookingUniqueItem.data";
import type { ManualEntryDiscount } from "../../../sections/finance/manualEntry.data";
import type { SelectedSlot } from "../calendar.utils";

type SelectedClient = {
  name: string;
  email: string;
  mollureUserId?: string | null;
  clientKind?: "individual" | "company";
  isGuest?: boolean;
  isMollure?: boolean;
} | null;

type InlineGuestDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
};

type ClientListItem = {
  name: string;
  email: string;
  clientKind?: "individual" | "company";
};

export type UseProfessionalFixedLocationCalendarDrawerEditDirtyArgs = {
  isCompletedBooking: boolean;
  isCancelledOrInvalidBooking: boolean;
  editingEventId: string | null;
  isEditingExisting: boolean;
  setIsEditingExisting: React.Dispatch<React.SetStateAction<boolean>>;
  selectedClient: SelectedClient;
  clientList: readonly ClientListItem[];
  viewingBookingEvent: CalendarEvent | null;
  slotLocation: string;
  slotClientAdded: boolean;
  setBookingProjectEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingUniqueItemLine[];
  selectedSlot: SelectedSlot | null;
  bookingGuests: CalendarBookingGuestItem[];
  showInlineGuestField: boolean;
  editingInlineGuestId: string | null;
  inlineGuestDraft: InlineGuestDraft;
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  desiredLocationDraft: {
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  };
  slotStatus: CalendarEvent["status"] | string;
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling: string;
  showNoShowFee: boolean;
  noShowFeePercent: string;
  noShowFeePercentCeiling: string;
  cancellationFeeAt: string | undefined;
  exceededCancellationWindow: boolean | undefined;
  showInternalNote: boolean;
  bookingInternalNote: string;
  bookingTotalDiscount: ManualEntryDiscount | null;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: { eurPerKm: string; totalKilometer: string };
  bookingProjectEnabled: boolean;
  bookingProjectDescription: string;
  bookingProjectUploads: readonly { id: string; name: string }[];
  showIncomingRequestActions: boolean;
  showIncomingErActions: boolean;
  setIncomingRequestEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setAllowDrawerTimeSelection: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useProfessionalFixedLocationCalendarDrawerEditDirty(
  args: UseProfessionalFixedLocationCalendarDrawerEditDirtyArgs,
) {
  const {
    isCompletedBooking,
    isCancelledOrInvalidBooking,
    editingEventId,
    isEditingExisting,
    setIsEditingExisting,
    selectedClient,
    clientList,
    viewingBookingEvent,
    slotLocation,
    slotClientAdded,
    setBookingProjectEnabled,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    selectedSlot,
    bookingGuests,
    showInlineGuestField,
    editingInlineGuestId,
    inlineGuestDraft,
    bookingPhoneDraft,
    desiredLocationDraft,
    slotStatus,
    showPrepayment,
    prepaymentPercent,
    paymentMethod,
    showLateCancellation,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    showLateRescheduling,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    showNoShowFee,
    noShowFeePercent,
    noShowFeePercentCeiling,
    cancellationFeeAt,
    exceededCancellationWindow,
    showInternalNote,
    bookingInternalNote,
    bookingTotalDiscount,
    showKilometerAllowance,
    kilometerAllowanceDraft,
    bookingProjectEnabled,
    bookingProjectDescription,
    bookingProjectUploads,
    showIncomingRequestActions,
    showIncomingErActions,
    setIncomingRequestEditMode,
    setAllowDrawerTimeSelection,
  } = args;

  const isViewingExisting =
    isCompletedBooking ||
    isCancelledOrInvalidBooking ||
    (Boolean(editingEventId) && !isEditingExisting);
  const resolvedSelectedClientKind:
    | "individual"
    | "company"
    | undefined = (() => {
    if (selectedClient?.clientKind) return selectedClient.clientKind;
    const email = selectedClient?.email?.trim().toLowerCase();
    if (email) {
      const listed = clientList.find(
        (c) => c.email.trim().toLowerCase() === email,
      );
      if (listed?.clientKind) return listed.clientKind;
    }
    return (
      viewingBookingEvent?.clientKind ??
      viewingBookingEvent?.details?.clientKind
    );
  })();
  const isSelectedCompanyClient = resolvedSelectedClientKind === "company";
  const canUseBookingProject =
    slotLocation === "DL" && slotClientAdded && isSelectedCompanyClient;

  React.useEffect(() => {
    if (!isSelectedCompanyClient && !isViewingExisting) {
      setBookingProjectEnabled(false);
    }
  }, [isSelectedCompanyClient, isViewingExisting, setBookingProjectEnabled]);

  const bookingEditSignature = React.useMemo(
    () =>
      JSON.stringify({
        services: selectedServices,
        products: selectedProducts,
        uniqueItems: bookingUniqueItems,
        slot: selectedSlot,
        client: selectedClient,
        guests: bookingGuests,
        inlineGuest:
          showInlineGuestField || editingInlineGuestId
            ? { editingInlineGuestId, ...inlineGuestDraft }
            : null,
        phone: bookingPhoneDraft,
        desiredLocation: desiredLocationDraft,
        location: slotLocation,
        status: slotStatus,
        showPrepayment,
        prepaymentPercent,
        paymentMethod,
        showLateCancellation,
        lateCancellationFeePercent,
        lateCancellationFeePercentCeiling,
        showLateRescheduling,
        lateRescheduleFeePercent,
        lateRescheduleFeePercentCeiling,
        showNoShowFee,
        noShowFeePercent,
        noShowFeePercentCeiling,
        cancellationFeeAt,
        exceededCancellationWindow,
        showInternalNote,
        internalNote: bookingInternalNote,
        totalDiscount: bookingTotalDiscount,
        showKilometerAllowance,
        kilometerAllowance: kilometerAllowanceDraft,
        projectEnabled: bookingProjectEnabled,
        projectDescription: bookingProjectDescription,
        projectUploads: bookingProjectUploads.map((u) => ({
          id: u.id,
          name: u.name,
        })),
      }),
    [
      selectedServices,
      selectedProducts,
      bookingUniqueItems,
      selectedSlot,
      selectedClient,
      bookingGuests,
      editingInlineGuestId,
      inlineGuestDraft,
      showInlineGuestField,
      bookingPhoneDraft,
      desiredLocationDraft,
      slotLocation,
      slotStatus,
      showPrepayment,
      prepaymentPercent,
      paymentMethod,
      showLateCancellation,
      lateCancellationFeePercent,
      lateCancellationFeePercentCeiling,
      showLateRescheduling,
      lateRescheduleFeePercent,
      lateRescheduleFeePercentCeiling,
      showNoShowFee,
      noShowFeePercent,
      noShowFeePercentCeiling,
      cancellationFeeAt,
      exceededCancellationWindow,
      showInternalNote,
      bookingInternalNote,
      bookingTotalDiscount,
      showKilometerAllowance,
      kilometerAllowanceDraft,
      bookingProjectEnabled,
      bookingProjectDescription,
      bookingProjectUploads,
    ],
  );
  const [editBaselineSignature, setEditBaselineSignature] = React.useState<
    string | null
  >(null);
  React.useEffect(() => {
    if (isEditingExisting) {
      setEditBaselineSignature((prev) =>
        prev === null ? bookingEditSignature : prev,
      );
      return;
    }
    if (!editingEventId) {
      setEditBaselineSignature(null);
      return;
    }
    // View / accept / live-hydrate must not look like an unsaved edit.
    setEditBaselineSignature(bookingEditSignature);
  }, [isEditingExisting, bookingEditSignature, editingEventId]);
  const isBookingDirty =
    Boolean(editingEventId) &&
    editBaselineSignature !== null &&
    bookingEditSignature !== editBaselineSignature;

  const silentEditBaselineRef = React.useRef<{
    services: BookingServiceLineItem[];
    guests: CalendarBookingGuestItem[];
    products: BookingProductLineItem[];
    uniqueItems: BookingUniqueItemLine[];
    phoneCode: string;
    phoneNumber: string;
  } | null>(null);

  const beginExistingBookingEdit = React.useCallback(() => {
    if (!editingEventId) return;
    if (isCompletedBooking || isCancelledOrInvalidBooking) return;
    if (isEditingExisting) return;
    // Pending BR/ER must not hard-lock Edit — enter EBR mode so Save works.
    if (showIncomingRequestActions || showIncomingErActions) {
      setIncomingRequestEditMode(true);
      setAllowDrawerTimeSelection(true);
    }
    if (!silentEditBaselineRef.current) {
      silentEditBaselineRef.current = {
        services: selectedServices,
        guests: bookingGuests,
        products: selectedProducts,
        uniqueItems: bookingUniqueItems,
        phoneCode: bookingPhoneDraft.phoneCode,
        phoneNumber: bookingPhoneDraft.phoneNumber,
      };
    }
    setEditBaselineSignature((prev) => prev ?? bookingEditSignature);
    setIsEditingExisting(true);
  }, [
    bookingEditSignature,
    bookingGuests,
    bookingPhoneDraft.phoneCode,
    bookingPhoneDraft.phoneNumber,
    bookingUniqueItems,
    editingEventId,
    isCancelledOrInvalidBooking,
    isCompletedBooking,
    isEditingExisting,
    selectedProducts,
    selectedServices,
    setAllowDrawerTimeSelection,
    setIncomingRequestEditMode,
    setIsEditingExisting,
    showIncomingErActions,
    showIncomingRequestActions,
  ]);

  return {
    isViewingExisting,
    resolvedSelectedClientKind,
    isSelectedCompanyClient,
    canUseBookingProject,
    bookingEditSignature,
    editBaselineSignature,
    setEditBaselineSignature,
    isBookingDirty,
    silentEditBaselineRef,
    beginExistingBookingEdit,
  };
}
