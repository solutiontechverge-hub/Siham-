import * as React from "react";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import type {
  BookingServiceEditDraft,
  BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import type {
  BookingCatalogProduct,
  BookingProductLineItem,
  BookingProductSelectionDraft,
} from "../../../../data/bookingProductCatalog.data";
import type {
  BookingUniqueItemDraft,
  BookingUniqueItemLine,
} from "../../../../data/bookingUniqueItem.data";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";
import {
  isBookingDetailsSubScreen,
  resolveUniqueItemFlowLabels,
  type PickMostAvailableTeamMemberId,
} from "./useProfessionalFixedLocationCalendar.helpers";
import type { SelectedSlot } from "../calendar.utils";
import type {
  CalendarBookingGuestItem,
  CalendarBookingLocation,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { FinanceInvoiceSettings } from "../../../sections/finance/useFinanceInvoiceSettings";
import { useProfessionalFixedLocationCalendarServiceProductScreensServices } from "./useProfessionalFixedLocationCalendar.serviceProductScreens.services";
import { useProfessionalFixedLocationCalendarServiceProductScreensProducts } from "./useProfessionalFixedLocationCalendar.serviceProductScreens.products";
import { useProfessionalFixedLocationCalendarServiceProductScreensUniqueItems } from "./useProfessionalFixedLocationCalendar.serviceProductScreens.uniqueItems";

type BookingGuest = CalendarBookingGuestItem;

export type UseProfessionalFixedLocationCalendarServiceProductScreensArgs = {
  addMenuTarget: "client" | string;
  selectionTarget: "client" | string;
  setSelectionTarget: React.Dispatch<React.SetStateAction<"client" | string>>;
  serviceOverridesDraft: Record<string, Partial<BookingServiceLineItem>>;
  setServiceOverridesDraft: React.Dispatch<
    React.SetStateAction<Record<string, Partial<BookingServiceLineItem>>>
  >;
  selectedServices: BookingServiceLineItem[];
  setSelectedServices: React.Dispatch<
    React.SetStateAction<BookingServiceLineItem[]>
  >;
  bookingGuests: BookingGuest[];
  setBookingGuests: React.Dispatch<React.SetStateAction<BookingGuest[]>>;
  selectedSlot: SelectedSlot | null;
  setSelectedSlot: React.Dispatch<React.SetStateAction<SelectedSlot | null>>;
  selectableServiceCatalog: readonly BookingCatalogService[];
  serviceEditDraft: BookingServiceEditDraft;
  setServiceEditDraft: React.Dispatch<
    React.SetStateAction<BookingServiceEditDraft>
  >;
  serviceEditOrigin: "select-services" | "new-booking";
  setServiceEditOrigin: React.Dispatch<
    React.SetStateAction<"select-services" | "new-booking">
  >;
  setServiceEditAttempted: React.Dispatch<React.SetStateAction<boolean>>;
  isViewingExisting: boolean;
  serviceSelectionDraft: string[];
  setServiceSelectionDraft: React.Dispatch<React.SetStateAction<string[]>>;
  setServiceCatalogPatches: React.Dispatch<
    React.SetStateAction<Record<string, Partial<BookingCatalogService>>>
  >;
  originalServicesSnapshot: BookingServiceLineItem[];
  pickMostAvailableTeamMemberId: PickMostAvailableTeamMemberId;
  resourceCount: number;
  slotLocation: CalendarBookingLocation;
  dispatchBookingEventIfApi: (
    editingEventId: string | null | undefined,
    event: import("../../../../store/services/businessApi").BookingNotificationEvent,
    options?: { initiated_by?: "client" | "professional"; message?: string },
  ) => void | Promise<void>;
  editingEventId: string | null;
  productCatalog: BookingCatalogProduct[];
  productSelectionDraft: BookingProductSelectionDraft;
  setProductSelectionDraft: React.Dispatch<
    React.SetStateAction<BookingProductSelectionDraft>
  >;
  selectedProducts: BookingProductLineItem[];
  setSelectedProducts: React.Dispatch<
    React.SetStateAction<BookingProductLineItem[]>
  >;
  mergedCustomBookingProducts: BookingCatalogProduct[];
  persistedUniqueCatalog: BookingCatalogProduct[];
  uniqueItemSelectionDraft: BookingProductSelectionDraft;
  setUniqueItemSelectionDraft: React.Dispatch<
    React.SetStateAction<BookingProductSelectionDraft>
  >;
  bookingUniqueItems: BookingUniqueItemLine[];
  setBookingUniqueItems: React.Dispatch<
    React.SetStateAction<BookingUniqueItemLine[]>
  >;
  editingBookingLine: null | {
    kind: "product" | "unique";
    id: string;
    owner: "client" | string;
  };
  setEditingBookingLine: React.Dispatch<
    React.SetStateAction<
      null | {
        kind: "product" | "unique";
        id: string;
        owner: "client" | string;
      }
    >
  >;
  uniqueItemOrigin: "unique" | "products";
  setUniqueItemOrigin: React.Dispatch<
    React.SetStateAction<"unique" | "products">
  >;
  editingCatalogProductId: string | null;
  setEditingCatalogProductId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  uniqueItemDraft: BookingUniqueItemDraft;
  setUniqueItemDraft: React.Dispatch<
    React.SetStateAction<BookingUniqueItemDraft>
  >;
  setSlotAddMenuAnchor: React.Dispatch<
    React.SetStateAction<HTMLElement | null>
  >;
  setSlotBookingScreen: React.Dispatch<
    React.SetStateAction<SlotBookingScreen>
  >;
  setSlotCalendarTouched: React.Dispatch<React.SetStateAction<boolean>>;
  setSlotSaveAttempted: React.Dispatch<React.SetStateAction<boolean>>;
  setFinanceSettings: React.Dispatch<React.SetStateAction<FinanceInvoiceSettings>>;
  slotBookingScreen: SlotBookingScreen;
};

export function useProfessionalFixedLocationCalendarServiceProductScreens(
  args: UseProfessionalFixedLocationCalendarServiceProductScreensArgs,
) {
  const services = useProfessionalFixedLocationCalendarServiceProductScreensServices(args);
  const products = useProfessionalFixedLocationCalendarServiceProductScreensProducts(args);
  const uniqueItems =
    useProfessionalFixedLocationCalendarServiceProductScreensUniqueItems(args);

  const bookingDetailsSubScreen = isBookingDetailsSubScreen(args.slotBookingScreen);
  const uniqueItemFlowLabels = resolveUniqueItemFlowLabels({
    uniqueItemOrigin: args.uniqueItemOrigin,
    editingBookingLine: args.editingBookingLine,
    editingCatalogProductId: args.editingCatalogProductId,
  });
  const uniqueItemFlowIsProduct = uniqueItemFlowLabels.isProduct;
  const uniqueItemFlowTitle = uniqueItemFlowLabels.title;
  const uniqueItemFlowNamePlaceholder = uniqueItemFlowLabels.namePlaceholder;

  return {
    adjustProductQuantityDraft: products.adjustProductQuantityDraft,
    adjustUniqueItemQuantityDraft: uniqueItems.adjustUniqueItemQuantityDraft,
    applyProductSelection: products.applyProductSelection,
    applyServiceEdit: services.applyServiceEdit,
    applyServiceSelection: services.applyServiceSelection,
    applyUniqueItem: uniqueItems.applyUniqueItem,
    applyUniqueItemSelection: uniqueItems.applyUniqueItemSelection,
    draftFromBookingLine: uniqueItems.draftFromBookingLine,
    isBookingDetailsSubScreen: bookingDetailsSubScreen,
    leaveUniqueItemScreen: uniqueItems.leaveUniqueItemScreen,
    openAddProduct: uniqueItems.openAddProduct,
    openAddUniqueItem: uniqueItems.openAddUniqueItem,
    openEditBookingProductLine: uniqueItems.openEditBookingProductLine,
    openEditBookingUniqueLine: uniqueItems.openEditBookingUniqueLine,
    openEditService: services.openEditService,
    openEditServiceFromLineItem: services.openEditServiceFromLineItem,
    openSelectProducts: products.openSelectProducts,
    openSelectServices: services.openSelectServices,
    openSelectUniqueItems: uniqueItems.openSelectUniqueItems,
    persistBookingCatalogProduct: uniqueItems.persistBookingCatalogProduct,
    persistBookingUniqueCatalogItem: uniqueItems.persistBookingUniqueCatalogItem,
    resetUniqueItemForm: uniqueItems.resetUniqueItemForm,
    toggleProductSelectionDraft: products.toggleProductSelectionDraft,
    toggleServiceSelectionDraft: services.toggleServiceSelectionDraft,
    toggleUniqueItemSelectionDraft: uniqueItems.toggleUniqueItemSelectionDraft,
    uniqueItemFlowIsProduct,
    uniqueItemFlowNamePlaceholder,
    uniqueItemFlowTitle,
  };
}
