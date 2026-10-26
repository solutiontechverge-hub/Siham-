import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { BookingUniqueItemLine } from "../../../../data/bookingUniqueItem.data";
import { normalizeServiceLinePricing } from "../../../../data/bookingLinePricing";
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
  selectedProducts?: readonly BookingProductLineItem[];
  bookingUniqueItems?: readonly BookingUniqueItemLine[];
  viewingBookingEvent: CalendarEvent | null;
  selectedSlot: SelectedSlot | null;
  bookingTotalForSave: number;
}) {
  const {
    selectedServices,
    selectedProducts = [],
    bookingUniqueItems = [],
    viewingBookingEvent,
    selectedSlot,
    bookingTotalForSave,
  } = input;
  const products = [
    ...selectedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      quantity: Math.max(1, Number(product.quantity) || 1),
      unitPrice: Number(product.unitPrice) || Number(product.price) || 0,
    })),
    ...bookingUniqueItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice: Number(item.unitPrice) || Number(item.price) || 0,
    })),
  ];
  // Product-only drafts are valid — do not null out when services are empty.
  if (!selectedServices.length && !products.length) return null;
  return {
    selectedDateISO: viewingBookingEvent?.date ?? selectedSlot?.date ?? "",
    selectedTime: viewingBookingEvent?.start ?? selectedSlot?.start ?? "",
    combineServices: false,
    services: selectedServices.map((service) => {
      const priced = normalizeServiceLinePricing(service);
      return {
        id: service.id,
        name: service.name,
        price: priced.price,
        originalPrice: priced.originalPrice,
        discountType: priced.discount?.type,
        discountAmount: priced.discount?.amount,
        durationMins: Number(service.durationMins) || 30,
      };
    }),
    products,
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
  isDrawerPrepaymentPaid: boolean;
  drawerPaymentMethod: string;
  kilometerAllowanceAmount?: number;
}) {
  const {
    drawerDocumentDraft,
    viewingBookingEvent,
    editingEventId,
    selectedClient,
    financeSettings,
    showPrepayment,
    prepaymentAmount,
    isDrawerPrepaymentPaid,
    drawerPaymentMethod,
    kilometerAllowanceAmount,
  } = input;
  if (!drawerDocumentDraft) return null;
  const bookingRef =
    viewingBookingEvent?.bookingCode ?? editingEventId ?? "booking";
  const showPrepaidRow = showPrepayment && prepaymentAmount > 0;
  return buildClientBookingTransactionRow({
    bookingRef,
    draft: drawerDocumentDraft,
    requesterName: selectedClient?.name ?? "Client",
    requesterEmail: selectedClient?.email,
    financeSettings,
    prepaymentAmount: showPrepaidRow ? prepaymentAmount : undefined,
    prepaymentPaid: showPrepaidRow ? isDrawerPrepaymentPaid : undefined,
    kilometerAllowanceAmount,
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
  kilometerAllowanceAmount?: number;
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
    kilometerAllowanceAmount,
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
    kilometerAllowanceAmount,
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
