import * as React from "react";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { calendarEventIsGuest } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { resolvePostBookingPendingPayment } from "../bookingCheckout";
import {
  computeBookingPrice,
  resolveBookingPriceDisplay,
} from "../bookingTotal";
import { prepayBlocksConfirmation } from "../bookingAcknowledgment";
import { isOfflinePaymentMethod } from "../../client-booking/checkoutPaymentOptions";
import { resolveCalendarPrepaymentStatus } from "../prepaymentStatus";
import type { SelectedSlot } from "../calendar.utils";
import {
  buildDrawerDocumentDraft,
  buildDrawerInvoiceRow,
  buildDrawerReceiptRow,
} from "./useProfessionalFixedLocationCalendar.bookingDrawerMappers";

export type UseProfessionalFixedLocationCalendarDrawerPaymentDocsArgs = {
  viewingBookingEvent: CalendarEvent | null;
  bookingPrice: ReturnType<typeof computeBookingPrice>;
  prepaymentAmount: number;
  remainingAfterPrepayment: number;
  bookingTotalForSave: number;
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  setPaymentMethod: React.Dispatch<React.SetStateAction<"online" | "offline">>;
  selectedServices: BookingServiceLineItem[];
  selectedSlot: SelectedSlot | null;
  editingEventId: string | null;
  selectedClient: {
    name: string;
    email: string;
    isGuest?: boolean;
    mollureUserId?: string | null;
    clientKind?: "individual" | "company";
    isMollure?: boolean;
  } | null;
  financeSettings: Parameters<typeof buildDrawerInvoiceRow>[0]["financeSettings"];
  addClientSource: string;
};

/** Drawer payment path + invoice/receipt docs (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerPaymentDocs({
  viewingBookingEvent,
  bookingPrice,
  prepaymentAmount,
  remainingAfterPrepayment,
  bookingTotalForSave,
  showPrepayment,
  prepaymentPercent,
  paymentMethod,
  setPaymentMethod,
  selectedServices,
  selectedSlot,
  editingEventId,
  selectedClient,
  financeSettings,
  addClientSource,
}: UseProfessionalFixedLocationCalendarDrawerPaymentDocsArgs) {
  const postBookingPendingPayment = React.useMemo(
    () => resolvePostBookingPendingPayment(viewingBookingEvent),
    [viewingBookingEvent],
  );
  const isDrawerPrepaymentPaid =
    viewingBookingEvent != null &&
    resolveCalendarPrepaymentStatus(viewingBookingEvent) === "confirmed";
  const prepaymentSectionTitle = isDrawerPrepaymentPaid
    ? "Prepaid"
    : "Prepayment";
  const drawerPriceDisplay = resolveBookingPriceDisplay({
    breakdown: {
      ...bookingPrice,
      prepaidApplied: isDrawerPrepaymentPaid ? prepaymentAmount : 0,
      payableTotal: isDrawerPrepaymentPaid
        ? remainingAfterPrepayment
        : bookingTotalForSave,
    },
    prepaymentPaid: isDrawerPrepaymentPaid,
  });

  const drawerPaymentMethod =
    viewingBookingEvent?.details?.paymentMethod ?? paymentMethod;
  // Paid-like unlocks (accept bypass / receipt) only after Offline is persisted — not on draft select.
  const persistedPaymentIsOffline = isOfflinePaymentMethod(
    viewingBookingEvent?.details?.paymentMethod,
  );
  const drawerPaymentIsOffline = persistedPaymentIsOffline;
  const onlinePrepayBlocksAccept = prepayBlocksConfirmation({
    prepayRequired:
      showPrepayment &&
      ((Number(prepaymentPercent) || 0) > 0 || prepaymentAmount > 0),
    prepayPaid: isDrawerPrepaymentPaid || drawerPaymentIsOffline,
  });

  const isGuestClientPath =
    addClientSource === "guest" ||
    Boolean(selectedClient?.isGuest) ||
    calendarEventIsGuest(viewingBookingEvent);
  const isMollureClientPath =
    !isGuestClientPath &&
    (addClientSource === "mollure-platform" ||
      Boolean(selectedClient?.mollureUserId) ||
      Boolean(viewingBookingEvent?.details?.customerId));
  const paymentMethodPolicy: "online-only" | "offline-only" | "either" =
    viewingBookingEvent
      ? viewingBookingEvent.bookingType === "Offline"
        ? isGuestClientPath
          ? "offline-only"
          : "either"
        : "online-only"
      : isGuestClientPath
        ? "offline-only"
        : isMollureClientPath
          ? "online-only"
          : "either";

  React.useEffect(() => {
    if (viewingBookingEvent) return;
    if (paymentMethodPolicy === "online-only" && paymentMethod !== "online") {
      setPaymentMethod("online");
    } else if (
      paymentMethodPolicy === "offline-only" &&
      paymentMethod !== "offline"
    ) {
      setPaymentMethod("offline");
    }
  }, [paymentMethod, paymentMethodPolicy, setPaymentMethod, viewingBookingEvent]);

  const drawerDocumentDraft = React.useMemo(
    () =>
      buildDrawerDocumentDraft({
        selectedServices,
        viewingBookingEvent,
        selectedSlot,
        bookingTotalForSave,
      }),
    [
      bookingTotalForSave,
      selectedServices,
      selectedSlot?.date,
      selectedSlot?.start,
      viewingBookingEvent?.date,
      viewingBookingEvent?.start,
    ],
  );

  const drawerInvoiceRow = React.useMemo(
    () =>
      buildDrawerInvoiceRow({
        drawerDocumentDraft,
        viewingBookingEvent,
        editingEventId,
        selectedClient,
        financeSettings,
        showPrepayment,
        prepaymentAmount,
        drawerPaymentMethod,
      }),
    [
      drawerDocumentDraft,
      drawerPaymentMethod,
      editingEventId,
      financeSettings,
      prepaymentAmount,
      selectedClient?.email,
      selectedClient?.name,
      showPrepayment,
      viewingBookingEvent?.bookingCode,
    ],
  );

  const drawerReceiptRow = React.useMemo(
    () =>
      buildDrawerReceiptRow({
        drawerDocumentDraft,
        prepaymentAmount,
        isDrawerPrepaymentPaid,
        drawerPaymentIsOffline,
        viewingBookingEvent,
        editingEventId,
        selectedClient,
        financeSettings,
        drawerPaymentMethod,
      }),
    [
      drawerDocumentDraft,
      drawerPaymentIsOffline,
      drawerPaymentMethod,
      editingEventId,
      financeSettings,
      isDrawerPrepaymentPaid,
      prepaymentAmount,
      selectedClient?.email,
      selectedClient?.name,
      viewingBookingEvent?.bookingCode,
    ],
  );

  return {
    postBookingPendingPayment,
    isDrawerPrepaymentPaid,
    prepaymentSectionTitle,
    drawerPriceDisplay,
    drawerPaymentMethod,
    persistedPaymentIsOffline,
    drawerPaymentIsOffline,
    onlinePrepayBlocksAccept,
    isGuestClientPath,
    isMollureClientPath,
    paymentMethodPolicy,
    drawerDocumentDraft,
    drawerInvoiceRow,
    drawerReceiptRow,
  };
}
