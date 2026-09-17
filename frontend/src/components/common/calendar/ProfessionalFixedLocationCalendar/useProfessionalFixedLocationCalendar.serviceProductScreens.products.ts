import * as React from "react";
import {
  buildBookingProductLine,
  createEmptyProductSelectionDraft,
} from "../../../../data/bookingProductCatalog.data";
import { stampProductsToEarliestBlock } from "../../../../data/bookingProductPlacement";
import { isUniqueItemId } from "../bookingTotal";
import type { UseProfessionalFixedLocationCalendarServiceProductScreensArgs } from "./useProfessionalFixedLocationCalendar.serviceProductScreens";

export function useProfessionalFixedLocationCalendarServiceProductScreensProducts(
  args: UseProfessionalFixedLocationCalendarServiceProductScreensArgs,
) {
  const {
    addMenuTarget,
    selectionTarget,
    setSelectionTarget,
    isViewingExisting,
    productCatalog,
    productSelectionDraft,
    setProductSelectionDraft,
    selectedProducts,
    setSelectedProducts,
    mergedCustomBookingProducts,
    bookingGuests,
    setBookingGuests,
    selectedServices,
    setSlotAddMenuAnchor,
    setSlotBookingScreen,
    setSlotSaveAttempted,
  } = args;

  const openSelectProducts = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    // Add flow: nothing preselected - only what the user picks is added.
    setProductSelectionDraft(createEmptyProductSelectionDraft());

    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-products");
  }, [addMenuTarget]);

  const toggleProductSelectionDraft = React.useCallback(
    (productId: string) => {
      if (isViewingExisting) return;
      setProductSelectionDraft((prev) => {
        const current = prev[productId] ?? { selected: false, quantity: 1 };
        return {
          ...prev,
          [productId]: { ...current, selected: !current.selected },
        };
      });
    },
    [isViewingExisting],
  );

  const adjustProductQuantityDraft = React.useCallback(
    (productId: string, delta: number) => {
      if (isViewingExisting) return;
      setProductSelectionDraft((prev) => {
        const current = prev[productId] ?? { selected: false, quantity: 1 };
        if (!current.selected) return prev;
        const nextQty = Math.max(1, current.quantity + delta);
        return {
          ...prev,
          [productId]: { ...current, quantity: nextQty },
        };
      });
    },
    [isViewingExisting],
  );

  const applyProductSelection = React.useCallback(() => {
    const catalogProducts = productCatalog
      .filter((product) => productSelectionDraft[product.id]?.selected)
      .map((product) => {
        const quantity = productSelectionDraft[product.id]?.quantity ?? 1;
        return buildBookingProductLine(product, quantity);
      });

    const customProducts = mergedCustomBookingProducts
      .filter((product) => productSelectionDraft[product.id]?.selected)
      .map((product) => {
        const quantity = productSelectionDraft[product.id]?.quantity ?? 1;
        return buildBookingProductLine(product, quantity);
      });

    const nextProducts = [...catalogProducts, ...customProducts].filter(
      (product) => !isUniqueItemId(product.id),
    );
    const currentProducts =
      selectionTarget === "client"
        ? selectedProducts
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.products ?? []);

    // Merge newly picked products into the current list (no defaults, no wipe).
    const mergedById = new Map(
      currentProducts.map((product) => [product.id, product]),
    );
    for (const product of nextProducts) {
      mergedById.set(product.id, product);
    }
    const mergedProducts = Array.from(mergedById.values());

    // Section 2.9: stamp onto the person's earliest chronological service block.
    const ownerServices =
      selectionTarget === "client"
        ? selectedServices
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.services ?? []);
    const stampedProducts = stampProductsToEarliestBlock(
      mergedProducts,
      ownerServices,
      selectionTarget === "client" ? null : selectionTarget,
    );

    if (selectionTarget === "client") {
      setSelectedProducts(stampedProducts);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) =>
          guest.id === selectionTarget
            ? { ...guest, products: stampedProducts }
            : guest,
        ),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    mergedCustomBookingProducts,
    productCatalog,
    productSelectionDraft,
    selectedProducts,
    selectedServices,
    selectionTarget,
  ]);

  return {
    adjustProductQuantityDraft,
    applyProductSelection,
    openSelectProducts,
    toggleProductSelectionDraft,
  };
}
