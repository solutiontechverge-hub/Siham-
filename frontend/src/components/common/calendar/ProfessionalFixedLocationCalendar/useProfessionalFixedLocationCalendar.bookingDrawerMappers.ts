import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { BookingUniqueItemLine } from "../../../../data/bookingUniqueItem.data";
import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { buildBookingDetailsSnapshot } from "../bookingEventDetails";
import { buildClientBookingTransactionRow } from "../../finance-documents";
import {
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodTitle,
} from "../../client-booking/checkoutPaymentOptions";
import type { SelectedSlot } from "../calendar.utils";

export function bookingEventLiveKey(ev: CalendarEvent) {
  return [
    ev.id,
    ev.date,
    ev.start,
    ev.end,
    ev.status,
    ev.title,
    ev.bookingScenario ?? "",
    ev.updatedAt ?? "",
    ev.notes ?? "",
    // Unlock Accept / Prepaid label when client completes online prepay.
    ev.details?.prepaymentStatus ?? "",
    ev.details?.services?.map((service) => service.id).join(",") ?? "",
  ].join(":");
}

export function buildDrawerDocumentDraft(input: {
  selectedServices: readonly BookingServiceLineItem[];
  viewingBookingEvent: CalendarEvent | null;
  selectedSlot: SelectedSlot | null;
  bookingTotalForSave: number;
}) {
  const {
    selectedServices,
    viewingBookingEvent,
    selectedSlot,
    bookingTotalForSave,
  } = input;
  if (!selectedServices.length) return null;
  return {
    selectedDateISO: viewingBookingEvent?.date ?? selectedSlot?.date ?? "",
    selectedTime: viewingBookingEvent?.start ?? selectedSlot?.start ?? "",
    combineServices: false,
    services: selectedServices.map((service) => ({
      id: service.id,
      name: service.name,
      price: Number(service.price) || 0,
      durationMins: Number(service.durationMins) || 30,
    })),
    total: bookingTotalForSave,
  };
}

type DrawerDocumentDraft = NonNullable<
  ReturnType<typeof buildDrawerDocumentDraft>
>;

export function buildDrawerInvoiceRow(input: {
  drawerDocumentDraft: DrawerDocumentDraft | null;
  viewingBookingEvent: CalendarEvent | null;
  editingEventId: string | null;
  selectedClient: { name?: string; email?: string } | null;
  financeSettings: Parameters<
    typeof buildClientBookingTransactionRow
  >[0]["financeSettings"];
  showPrepayment: boolean;
  prepaymentAmount: number;
  drawerPaymentMethod: string;
}) {
  const {
    drawerDocumentDraft,
    viewingBookingEvent,
    editingEventId,
    selectedClient,
    financeSettings,
    showPrepayment,
    prepaymentAmount,
    drawerPaymentMethod,
  } = input;
  if (!drawerDocumentDraft) return null;
  const bookingRef =
    viewingBookingEvent?.bookingCode ?? editingEventId ?? "booking";
  return buildClientBookingTransactionRow({
    bookingRef,
    draft: drawerDocumentDraft,
    requesterName: selectedClient?.name ?? "Client",
    requesterEmail: selectedClient?.email,
    financeSettings,
    prepaymentAmount:
      showPrepayment && prepaymentAmount > 0 ? prepaymentAmount : undefined,
    methodTitle: checkoutPaymentMethodTitle(drawerPaymentMethod),
    methodDetail: checkoutPaymentMethodDetail(drawerPaymentMethod),
  });
}

export function buildDrawerReceiptRow(input: {
  drawerDocumentDraft: DrawerDocumentDraft | null;
  prepaymentAmount: number;
  isDrawerPrepaymentPaid: boolean;
  drawerPaymentIsOffline: boolean;
  viewingBookingEvent: CalendarEvent | null;
  editingEventId: string | null;
  selectedClient: { name?: string; email?: string } | null;
  financeSettings: Parameters<
    typeof buildClientBookingTransactionRow
  >[0]["financeSettings"];
  drawerPaymentMethod: string;
}) {
  const {
    drawerDocumentDraft,
    prepaymentAmount,
    isDrawerPrepaymentPaid,
    drawerPaymentIsOffline,
    viewingBookingEvent,
    editingEventId,
    selectedClient,
    financeSettings,
    drawerPaymentMethod,
  } = input;
  if (!drawerDocumentDraft || !(prepaymentAmount > 0)) return null;
  if (!isDrawerPrepaymentPaid && !drawerPaymentIsOffline) return null;
  const bookingRef =
    viewingBookingEvent?.bookingCode ?? editingEventId ?? "booking";
  return buildClientBookingTransactionRow({
    bookingRef: `${bookingRef}-prepay`,
    draft: drawerDocumentDraft,
    requesterName: selectedClient?.name ?? "Client",
    requesterEmail: selectedClient?.email,
    financeSettings,
    documentAmount: prepaymentAmount,
    prepaymentAmount,
    asPrepaymentReceipt: true,
    methodTitle: checkoutPaymentMethodTitle(drawerPaymentMethod),
    methodDetail: checkoutPaymentMethodDetail(drawerPaymentMethod),
  });
}

/** Builds a draft CalendarEvent for sales/activity tabs when no saved booking is open. */
export function buildDraftSalesActivityContext(input: {
  viewingBookingEvent: CalendarEvent | null;
  selectedSlot: SelectedSlot | null;
  editingEventId: string | null;
  selectedServices: readonly BookingServiceLineItem[];
  selectedProducts: readonly BookingProductLineItem[];
  bookingUniqueItems: readonly BookingUniqueItemLine[];
  slotStatus: CalendarBookingStatus;
  slotLocation: CalendarBookingLocation;
  slotBookingType: CalendarBookingType;
  selectedClient: Parameters<
    typeof buildBookingDetailsSnapshot
  >[0]["selectedClient"];
  guestDraft: { firstName: string; lastName: string };
  nonMollureDraft: { firstName: string; lastName: string };
  addClientSource: string;
  snapshot: Omit<
    Parameters<typeof buildBookingDetailsSnapshot>[0],
    "selectedClient" | "isGuest" | "selectedServices" | "selectedProducts"
  >;
}): CalendarEvent | null {
  const {
    viewingBookingEvent,
    selectedSlot,
    editingEventId,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    slotStatus,
    slotLocation,
    slotBookingType,
    selectedClient,
    guestDraft,
    nonMollureDraft,
    addClientSource,
    snapshot,
  } = input;

  if (viewingBookingEvent) return viewingBookingEvent;
  if (!selectedSlot) return null;

  return {
    id: editingEventId ?? "draft",
    resourceId: selectedSlot.resourceId,
    date: selectedSlot.date,
    start: selectedSlot.start,
    end: selectedSlot.end,
    title:
      selectedServices[0]?.name ??
      selectedProducts[0]?.name ??
      bookingUniqueItems[0]?.name ??
      "Booking",
    status: slotStatus,
    location: slotLocation,
    bookingType: slotBookingType,
    bookingScenario: slotStatus === "Requested" ? "BR" : undefined,
    showClientName:
      selectedClient?.name ||
      `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ||
      `${nonMollureDraft.firstName} ${nonMollureDraft.lastName}`.trim() ||
      undefined,
    details: buildBookingDetailsSnapshot({
      ...snapshot,
      selectedClient,
      isGuest:
        addClientSource === "guest" || Boolean(selectedClient?.isGuest),
      selectedServices: [...selectedServices],
      selectedProducts: [...selectedProducts, ...bookingUniqueItems],
    }),
  };
}
