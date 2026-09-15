import * as React from "react";
import {
  getEffectiveServicePrice,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import {
  productLineOriginalAmount,
  type BookingProductLineItem,
} from "../../../../data/bookingProductCatalog.data";
import type { BookingUniqueItemLine } from "../../../../data/bookingUniqueItem.data";

export type BookingTotalsGuestLine = {
  services: BookingServiceLineItem[];
  products: BookingProductLineItem[];
};

export type UseProfessionalFixedLocationCalendarBookingTotalsArgs = {
  selectedServices: readonly BookingServiceLineItem[];
  selectedProducts: readonly BookingProductLineItem[];
  bookingUniqueItems: readonly BookingUniqueItemLine[];
  bookingGuests: readonly BookingTotalsGuestLine[];
};

/** Drawer line pricing totals memos (ponytail: pure reduce fan-out). */
export function useProfessionalFixedLocationCalendarBookingTotals({
  selectedServices,
  selectedProducts,
  bookingUniqueItems,
  bookingGuests,
}: UseProfessionalFixedLocationCalendarBookingTotalsArgs) {
  const servicesTotal = React.useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + getEffectiveServicePrice(service),
        0,
      ),
    [selectedServices],
  );
  const productsTotal = React.useMemo(
    () => selectedProducts.reduce((sum, p) => sum + p.price, 0),
    [selectedProducts],
  );
  const uniqueItemsTotal = React.useMemo(
    () => bookingUniqueItems.reduce((sum, item) => sum + item.price, 0),
    [bookingUniqueItems],
  );
  const guestsTotal = React.useMemo(
    () =>
      bookingGuests.reduce(
        (sum, guest) =>
          sum +
          guest.services.reduce(
            (serviceSum, service) =>
              serviceSum + getEffectiveServicePrice(service),
            0,
          ) +
          guest.products.reduce(
            (productSum, product) => productSum + product.price,
            0,
          ),
        0,
      ),
    [bookingGuests],
  );
  const subtotalPrice =
    servicesTotal + productsTotal + uniqueItemsTotal + guestsTotal;
  const lineActualAmount = React.useMemo(() => {
    const servicesActual = selectedServices.reduce(
      (sum, service) => sum + service.price,
      0,
    );
    const productsActual = selectedProducts.reduce(
      (sum, product) => sum + productLineOriginalAmount(product),
      0,
    );
    const uniqueActual = bookingUniqueItems.reduce(
      (sum, item) => sum + productLineOriginalAmount(item),
      0,
    );
    const guestsActual = bookingGuests.reduce(
      (sum, guest) =>
        sum +
        guest.services.reduce(
          (serviceSum, service) => serviceSum + service.price,
          0,
        ) +
        guest.products.reduce(
          (productSum, product) =>
            productSum + productLineOriginalAmount(product),
          0,
        ),
      0,
    );
    return servicesActual + productsActual + uniqueActual + guestsActual;
  }, [bookingGuests, bookingUniqueItems, selectedProducts, selectedServices]);
  const lineDiscountAmount = Math.max(0, lineActualAmount - subtotalPrice);

  return {
    guestsTotal,
    lineActualAmount,
    lineDiscountAmount,
    productsTotal,
    servicesTotal,
    subtotalPrice,
    uniqueItemsTotal,
  };
}
