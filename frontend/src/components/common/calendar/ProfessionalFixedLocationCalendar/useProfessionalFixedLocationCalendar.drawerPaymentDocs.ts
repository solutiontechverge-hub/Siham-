import * as React from "react";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { BookingUniqueItemLine } from "../../../../data/bookingUniqueItem.data";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { calendarEventIsGuest } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { useGetFinanceTransactionsQuery } from "../../../../store/services/financeApi";
import {
  findIssuedFinanceTransaction,
  hasStoredDocumentSnapshot,
} from "../../finance-documents";
import { resolvePostBookingPendingPayment } from "../bookingCheckout";
import {
  computeBookingPrice,
  resolveBookingPriceDisplay,
} from "../bookingTotal";
import { markNotesPrepaymentPaid } from "../bookingEventDetails";
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
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingUniqueItemLine[];
  selectedSlot: SelectedSlot | null;
  editingEventId: string | null;
  setEvents: React.Dispatch<React.SetStateAction<readonly CalendarEvent[]>>;
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
  selectedProducts,
  bookingUniqueItems,
  selectedSlot,
  editingEventId,
  setEvents,
  selectedClient,
  financeSettings,
  addClientSource,
}: UseProfessionalFixedLocationCalendarDrawerPaymentDocsArgs) {
  // ponytail: temp Stripe bypass — ceiling: local/test pay only; remove when real Pay Now checkout is wired.
  const [drawerPrepaymentPaidOverride, setDrawerPrepaymentPaidOverride] =
    React.useState(false);

  const postBookingPendingPayment = React.useMemo(
    () => resolvePostBookingPendingPayment(viewingBookingEvent),
    [viewingBookingEvent],
  );
  const isDrawerPrepaymentPaid =
    drawerPrepaymentPaidOverride ||
    (viewingBookingEvent != null &&
      resolveCalendarPrepaymentStatus(viewingBookingEvent) === "confirmed");

  const confirmDrawerPrepayment = React.useCallback(() => {
    // ponytail: temp Stripe bypass — sets prepaymentStatus confirmed like offline Save/confirmPrepayment; remove when real Pay Now is wired.
    setDrawerPrepaymentPaidOverride(true);
    if (!editingEventId) return;
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== editingEventId) return event;
        const paidNotes = markNotesPrepaymentPaid(event.notes, paymentMethod);
        return {
          ...event,
          ...(paidNotes ? { notes: paidNotes } : {}),
          details: {
            ...(event.details ?? {}),
            showPrepayment: true,
            prepaymentStatus: "confirmed" as const,
            paymentMethod,
          },
        };
      }),
    );
  }, [editingEventId, paymentMethod, setEvents]);

  const clearDrawerPrepaymentPaidOverride = React.useCallback(() => {
    setDrawerPrepaymentPaidOverride(false);
  }, []);
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

  // Calendar event ids are `b-<uuid>`; finance booking_id stores uuid or unique_code.
  const drawerBookingKey =
    viewingBookingEvent?.bookingCode ||
    (viewingBookingEvent?.id || editingEventId || "").replace(/^b-/, "") ||
    "";
  const { data: drawerFinanceResponse } = useGetFinanceTransactionsQuery(
    { bookingId: String(drawerBookingKey), limit: 50 },
    { skip: !drawerBookingKey },
  );
  const drawerFinanceRows = drawerFinanceResponse?.data?.rows ?? [];

  const drawerDocumentDraft = React.useMemo(
    () =>
      buildDrawerDocumentDraft({
        selectedServices,
        selectedProducts,
        bookingUniqueItems,
        viewingBookingEvent,
        selectedSlot,
        bookingTotalForSave,
      }),
    [
      bookingTotalForSave,
      bookingUniqueItems,
      selectedProducts,
      selectedServices,
      selectedSlot?.date,
      selectedSlot?.start,
      viewingBookingEvent?.date,
      viewingBookingEvent?.start,
    ],
  );

  const drawerInvoiceRow = React.useMemo(() => {
    const issued = findIssuedFinanceTransaction(drawerFinanceRows, {
      bookingId: drawerBookingKey,
      bookingCode: viewingBookingEvent?.bookingCode,
      phase: "full",
    });
    if (issued && hasStoredDocumentSnapshot(issued)) return issued;
    return buildDrawerInvoiceRow({
      drawerDocumentDraft,
      viewingBookingEvent,
      editingEventId,
      selectedClient,
      financeSettings,
      showPrepayment,
      prepaymentAmount,
      isDrawerPrepaymentPaid,
      drawerPaymentMethod,
    });
  }, [
    drawerBookingKey,
    drawerDocumentDraft,
    drawerFinanceRows,
    drawerPaymentMethod,
    editingEventId,
    financeSettings,
    isDrawerPrepaymentPaid,
    prepaymentAmount,
    selectedClient?.email,
    selectedClient?.name,
    showPrepayment,
    viewingBookingEvent,
  ]);

  const drawerReceiptRow = React.useMemo(() => {
    const issued = findIssuedFinanceTransaction(drawerFinanceRows, {
      bookingId: drawerBookingKey,
      bookingCode: viewingBookingEvent?.bookingCode,
      phase: "prepay",
    });
    if (issued && hasStoredDocumentSnapshot(issued)) return issued;
    return buildDrawerReceiptRow({
      drawerDocumentDraft,
      prepaymentAmount,
      isDrawerPrepaymentPaid,
      drawerPaymentIsOffline,
      viewingBookingEvent,
      editingEventId,
      selectedClient,
      financeSettings,
      drawerPaymentMethod,
    });
  }, [
    drawerBookingKey,
    drawerDocumentDraft,
    drawerFinanceRows,
    drawerPaymentIsOffline,
    drawerPaymentMethod,
    editingEventId,
    financeSettings,
    isDrawerPrepaymentPaid,
    prepaymentAmount,
    selectedClient?.email,
    selectedClient?.name,
    viewingBookingEvent,
  ]);

  return {
    postBookingPendingPayment,
    isDrawerPrepaymentPaid,
    confirmDrawerPrepayment,
    clearDrawerPrepaymentPaidOverride,
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
