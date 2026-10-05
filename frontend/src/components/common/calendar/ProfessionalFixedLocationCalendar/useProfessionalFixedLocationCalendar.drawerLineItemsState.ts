import * as React from "react";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import {
  emptyBookingServiceEditDraft,
  type BookingServiceEditDraft,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import {
  createEmptyProductSelectionDraft,
  type BookingCatalogProduct,
  type BookingProductLineItem,
  type BookingProductSelectionDraft,
} from "../../../../data/bookingProductCatalog.data";
import {
  emptyBookingUniqueItemDraft,
  type BookingUniqueItemDraft,
  type BookingUniqueItemLine,
} from "../../../../data/bookingUniqueItem.data";
import { parseFinancePrice } from "../../../sections/finance/manualEntry.data";
import { isUniqueItemId } from "../bookingTotal";
import type { FinanceInvoiceProduct } from "../../../sections/finance/useFinanceInvoiceSettings";

export type UseProfessionalFixedLocationCalendarDrawerLineItemsStateArgs = {
  serviceCatalog: readonly BookingCatalogService[];
  financeProducts: readonly FinanceInvoiceProduct[];
  financeUniqueItems: readonly FinanceInvoiceProduct[];
};

/** Drawer service/product/unique line-item state + catalog sync (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerLineItemsState({
  serviceCatalog,
  financeProducts,
  financeUniqueItems,
}: UseProfessionalFixedLocationCalendarDrawerLineItemsStateArgs) {
  /** Same list shown in Select Services and used when saving the selection. */
  const baseServiceCatalog = React.useMemo(
    () => [...serviceCatalog],
    [serviceCatalog],
  );
  const [serviceCatalogPatches, setServiceCatalogPatches] = React.useState<
    Record<string, Partial<BookingCatalogService>>
  >({});
  const selectableServiceCatalog = React.useMemo(
    () =>
      baseServiceCatalog.map((service) => {
        const patch = serviceCatalogPatches[service.id];
        return patch ? { ...service, ...patch } : service;
      }),
    [baseServiceCatalog, serviceCatalogPatches],
  );

  const [productCatalog, setProductCatalog] = React.useState<
    BookingCatalogProduct[]
  >([]);
  /** Booking-scoped line edit (never mutates master catalog definitions). */
  const [editingBookingLine, setEditingBookingLine] = React.useState<null | {
    kind: "product" | "unique";
    id: string;
    owner: "client" | string;
  }>(null);

  /** Sync retail products from this professional's finance settings (backend). */
  React.useEffect(() => {
    const nextCatalog = financeProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: parseFinancePrice(product.price),
      vat: product.vat,
      unit: product.unit,
      discountType: product.discountType,
      discountAmount:
        product.discountAmount == null
          ? undefined
          : String(product.discountAmount),
    }));
    setProductCatalog((current) =>
      JSON.stringify(current) === JSON.stringify(nextCatalog)
        ? current
        : nextCatalog,
    );
  }, [financeProducts]);

  const persistedUniqueCatalog = React.useMemo<BookingCatalogProduct[]>(
    () =>
      financeUniqueItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: parseFinancePrice(item.price),
        vat: item.vat,
        unit: item.unit,
        discountType: item.discountType,
        discountAmount: item.discountAmount == null ? undefined : String(item.discountAmount),
      })),
    [financeUniqueItems],
  );

  const [selectedServices, setSelectedServices] = React.useState<
    BookingServiceLineItem[]
  >([]);
  const [serviceSelectionDraft, setServiceSelectionDraft] = React.useState<
    string[]
  >([]);
  const [serviceOverridesDraft, setServiceOverridesDraft] = React.useState<
    Record<string, Partial<BookingServiceLineItem>>
  >({});
  const [serviceEditDraft, setServiceEditDraft] =
    React.useState<BookingServiceEditDraft>(() =>
      emptyBookingServiceEditDraft(),
    );
  const [serviceEditAttempted, setServiceEditAttempted] = React.useState(false);
  const [serviceEditOrigin, setServiceEditOrigin] = React.useState<
    "select-services" | "new-booking"
  >("select-services");
  const [selectedProducts, setSelectedProducts] = React.useState<
    BookingProductLineItem[]
  >([]);
  const [productSelectionDraft, setProductSelectionDraft] =
    React.useState<BookingProductSelectionDraft>(() =>
      createEmptyProductSelectionDraft(),
    );
  const [uniqueItemDraft, setUniqueItemDraft] =
    React.useState<BookingUniqueItemDraft>(() => emptyBookingUniqueItemDraft());
  const [uniqueItemOrigin, setUniqueItemOrigin] = React.useState<
    "products" | "unique"
  >("unique");
  const [editingCatalogProductId, setEditingCatalogProductId] = React.useState<
    string | null
  >(null);
  const [bookingUniqueItems, setBookingUniqueItems] = React.useState<
    BookingUniqueItemLine[]
  >([]);
  const [customBookingProducts, setCustomBookingProducts] = React.useState<
    BookingCatalogProduct[]
  >([]);
  const mergedCustomBookingProducts = React.useMemo(() => {
    const byId = new Map<string, BookingCatalogProduct>();
    customBookingProducts.forEach((product) => {
      if (!isUniqueItemId(product.id)) byId.set(product.id, product);
    });
    return Array.from(byId.values());
  }, [customBookingProducts]);
  const [uniqueItemSelectionDraft, setUniqueItemSelectionDraft] =
    React.useState<BookingProductSelectionDraft>(() =>
      createEmptyProductSelectionDraft(),
    );

  return {
    baseServiceCatalog,
    serviceCatalogPatches,
    setServiceCatalogPatches,
    selectableServiceCatalog,
    productCatalog,
    setProductCatalog,
    editingBookingLine,
    setEditingBookingLine,
    persistedUniqueCatalog,
    selectedServices,
    setSelectedServices,
    serviceSelectionDraft,
    setServiceSelectionDraft,
    serviceOverridesDraft,
    setServiceOverridesDraft,
    serviceEditDraft,
    setServiceEditDraft,
    serviceEditAttempted,
    setServiceEditAttempted,
    serviceEditOrigin,
    setServiceEditOrigin,
    selectedProducts,
    setSelectedProducts,
    productSelectionDraft,
    setProductSelectionDraft,
    uniqueItemDraft,
    setUniqueItemDraft,
    uniqueItemOrigin,
    setUniqueItemOrigin,
    editingCatalogProductId,
    setEditingCatalogProductId,
    bookingUniqueItems,
    setBookingUniqueItems,
    customBookingProducts,
    setCustomBookingProducts,
    mergedCustomBookingProducts,
    uniqueItemSelectionDraft,
    setUniqueItemSelectionDraft,
  };
}
