import * as React from "react";
import {
  buildBookingProductLine,
  createEmptyProductSelectionDraft,
  getProductBaseName,
  type BookingCatalogProduct,
} from "../../../../data/bookingProductCatalog.data";
import {
  buildCatalogProductFromUniqueItemDraft,
  buildUniqueItemDraftFromProduct,
  buildUniqueItemLine,
  emptyBookingUniqueItemDraft,
} from "../../../../data/bookingUniqueItem.data";
import { stampProductsToEarliestBlock } from "../../../../data/bookingProductPlacement";
import { isUniqueItemId } from "../bookingTotal";
import {
  toFinanceCatalogProduct,
  upsertFinanceProduct,
  upsertFinanceUniqueItem,
} from "../../../sections/finance/financeCatalogPersist";
import type { UseProfessionalFixedLocationCalendarServiceProductScreensArgs } from "./useProfessionalFixedLocationCalendar.serviceProductScreens";

export function useProfessionalFixedLocationCalendarServiceProductScreensUniqueItems(
  args: UseProfessionalFixedLocationCalendarServiceProductScreensArgs,
) {
  const {
    addMenuTarget,
    selectionTarget,
    setSelectionTarget,
    isViewingExisting,
    productCatalog,
    setProductSelectionDraft,
    setSelectedProducts,
    persistedUniqueCatalog,
    uniqueItemSelectionDraft,
    setUniqueItemSelectionDraft,
    bookingUniqueItems,
    setBookingUniqueItems,
    bookingGuests,
    setBookingGuests,
    selectedServices,
    editingBookingLine,
    setEditingBookingLine,
    uniqueItemOrigin,
    setUniqueItemOrigin,
    editingCatalogProductId,
    setEditingCatalogProductId,
    uniqueItemDraft,
    setUniqueItemDraft,
    dispatchBookingEventIfApi,
    editingEventId,
    setSlotAddMenuAnchor,
    setSlotBookingScreen,
    setSlotSaveAttempted,
    setFinanceSettings,
  } = args;

  const openSelectUniqueItems = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    setUniqueItemSelectionDraft(createEmptyProductSelectionDraft());
    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-unique-items");
  }, [addMenuTarget]);

  const toggleUniqueItemSelectionDraft = React.useCallback(
    (productId: string) => {
      if (isViewingExisting) return;
      setUniqueItemSelectionDraft((prev) => {
        const current = prev[productId] ?? { selected: false, quantity: 1 };
        return {
          ...prev,
          [productId]: { ...current, selected: !current.selected },
        };
      });
    },
    [isViewingExisting],
  );

  const adjustUniqueItemQuantityDraft = React.useCallback(
    (productId: string, delta: number) => {
      if (isViewingExisting) return;
      setUniqueItemSelectionDraft((prev) => {
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

  const applyUniqueItemSelection = React.useCallback(() => {
    const nextItems = persistedUniqueCatalog
      .filter((item) => uniqueItemSelectionDraft[item.id]?.selected)
      .map((item) => {
        const quantity = uniqueItemSelectionDraft[item.id]?.quantity ?? 1;
        const line = buildBookingProductLine(item, quantity);
        const id = isUniqueItemId(line.id) ? line.id : `unique-${line.id}`;
        return { ...line, id };
      });

    const ownerServices =
      selectionTarget === "client"
        ? selectedServices
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.services ?? []);

    if (selectionTarget === "client") {
      const mergedById = new Map(
        bookingUniqueItems.map((item) => [item.id, item]),
      );
      for (const item of nextItems) {
        mergedById.set(item.id, item);
      }
      setBookingUniqueItems(
        stampProductsToEarliestBlock(
          Array.from(mergedById.values()),
          ownerServices,
          null,
        ),
      );
    } else {
      const current =
        bookingGuests.find((item) => item.id === selectionTarget)?.products ??
        [];
      const mergedById = new Map(current.map((item) => [item.id, item]));
      for (const item of nextItems) {
        mergedById.set(item.id, item);
      }
      const stamped = stampProductsToEarliestBlock(
        Array.from(mergedById.values()),
        ownerServices,
        selectionTarget,
      );
      setBookingGuests((prev) =>
        prev.map((guest) =>
          guest.id === selectionTarget
            ? { ...guest, products: stamped }
            : guest,
        ),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    bookingUniqueItems,
    persistedUniqueCatalog,
    selectedServices,
    selectionTarget,
    uniqueItemSelectionDraft,
  ]);

  const resetUniqueItemForm = React.useCallback(() => {
    setEditingBookingLine(null);
    setEditingCatalogProductId(null);
    setUniqueItemOrigin("unique");
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
  }, []);

  const leaveUniqueItemScreen = React.useCallback(() => {
    if (editingBookingLine) {
      resetUniqueItemForm();
      setSlotBookingScreen("new-booking");
      return;
    }
    const back =
      uniqueItemOrigin === "products"
        ? "select-products"
        : "select-unique-items";
    resetUniqueItemForm();
    setSlotBookingScreen(back);
  }, [editingBookingLine, resetUniqueItemForm, uniqueItemOrigin]);

  const openAddUniqueItem = React.useCallback(() => {
    setEditingBookingLine(null);
    setEditingCatalogProductId(null);
    setUniqueItemOrigin("unique");
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setSlotBookingScreen("add-unique-item");
  }, []);

  const draftFromBookingLine = React.useCallback(
    (line: {
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      vat?: string;
      discount?: { type: "fixed" | "percentage"; amount: number } | null;
    }) => {
      const catalogMatch = productCatalog.find((product) => product.id === line.id);
      return buildUniqueItemDraftFromProduct({
        name: getProductBaseName(line.name, line.quantity),
        price: line.unitPrice,
        vat: line.vat ?? catalogMatch?.vat,
        unit: line.quantity,
        discountType: line.discount?.type ?? "fixed",
        discountAmount: line.discount
          ? String(line.discount.amount)
          : "0",
      });
    },
    [productCatalog],
  );

  const openEditBookingProductLine = React.useCallback(
    (
      product: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        vat?: string;
        discount?: { type: "fixed" | "percentage"; amount: number } | null;
      },
      owner: "client" | string,
    ) => {
      setUniqueItemOrigin("products");
      setEditingBookingLine({ kind: "product", id: product.id, owner });
      setUniqueItemDraft(draftFromBookingLine(product));
      setSlotBookingScreen("add-unique-item");
    },
    [draftFromBookingLine],
  );

  const openEditBookingUniqueLine = React.useCallback(
    (
      item: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        vat?: string;
        discount?: { type: "fixed" | "percentage"; amount: number } | null;
      },
      owner: "client" | string = "client",
    ) => {
      setEditingCatalogProductId(null);
      setUniqueItemOrigin("unique");
      setEditingBookingLine({ kind: "unique", id: item.id, owner });
      setUniqueItemDraft(draftFromBookingLine(item));
      setSlotBookingScreen("add-unique-item");
    },
    [draftFromBookingLine],
  );

  const persistBookingUniqueCatalogItem = React.useCallback(
    (product: BookingCatalogProduct) => {
      const payload = toFinanceCatalogProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        vat: product.vat,
        unit: product.unit,
        discountType: product.discountType,
        discountAmount: product.discountAmount,
      });
      setFinanceSettings((prev) => upsertFinanceUniqueItem(prev, payload));
    },
    [setFinanceSettings],
  );

  const persistBookingCatalogProduct = React.useCallback(
    (product: BookingCatalogProduct) => {
      const payload = toFinanceCatalogProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        vat: product.vat,
        unit: product.unit,
        discountType: product.discountType,
        discountAmount: product.discountAmount,
      });
      setFinanceSettings((prev) => upsertFinanceProduct(prev, payload));
    },
    [setFinanceSettings],
  );

  const applyUniqueItem = React.useCallback(() => {
    // Booking-scoped edit: update only this booking's line, never the master catalog.
    if (editingBookingLine) {
      const line = buildUniqueItemLine(uniqueItemDraft, editingBookingLine.id);
      if (!line) return;

      const ownerServices =
        editingBookingLine.owner === "client"
          ? selectedServices
          : (bookingGuests.find((guest) => guest.id === editingBookingLine.owner)
              ?.services ?? []);
      const [stamped] = stampProductsToEarliestBlock(
        [line],
        ownerServices,
        editingBookingLine.owner === "client" ? null : editingBookingLine.owner,
      );

      if (editingBookingLine.kind === "unique") {
        if (editingBookingLine.owner === "client") {
          setBookingUniqueItems((prev) =>
            prev.map((item) =>
              item.id === editingBookingLine.id ? stamped : item,
            ),
          );
        } else {
          const ownerId = editingBookingLine.owner;
          setBookingGuests((prev) =>
            prev.map((guest) =>
              guest.id === ownerId
                ? {
                    ...guest,
                    products: guest.products.map((product) =>
                      product.id === editingBookingLine.id ? stamped : product,
                    ),
                  }
                : guest,
            ),
          );
        }
      } else if (editingBookingLine.owner === "client") {
        setSelectedProducts((prev) =>
          prev.map((product) =>
            product.id === editingBookingLine.id ? stamped : product,
          ),
        );
      } else {
        const ownerId = editingBookingLine.owner;
        setBookingGuests((prev) =>
          prev.map((guest) =>
            guest.id === ownerId
              ? {
                  ...guest,
                  products: guest.products.map((product) =>
                    product.id === editingBookingLine.id ? stamped : product,
                  ),
                }
              : guest,
          ),
        );
      }

      setEditingBookingLine(null);
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setSlotBookingScreen("new-booking");
      setSlotSaveAttempted(false);
      void dispatchBookingEventIfApi(editingEventId, "unique_item_edited", {
        initiated_by: "professional",
      });
      return;
    }

    if (editingCatalogProductId) {
      const next = buildCatalogProductFromUniqueItemDraft(
        uniqueItemDraft,
        editingCatalogProductId,
      );
      if (!next) return;
      const editingProduct = uniqueItemOrigin === "products";
      if (editingProduct) {
        persistBookingCatalogProduct(next);
        setProductSelectionDraft((prev) => {
          const current = prev[next.id];
          if (!current) return prev;
          return {
            ...prev,
            [next.id]: {
              ...current,
              quantity: Math.max(1, next.unit ?? current.quantity),
            },
          };
        });
      } else {
        persistBookingUniqueCatalogItem(next);
        setUniqueItemSelectionDraft((prev) => {
          const current = prev[next.id];
          if (!current) return prev;
          return {
            ...prev,
            [next.id]: {
              ...current,
              quantity: Math.max(1, next.unit ?? current.quantity),
            },
          };
        });
      }
      resetUniqueItemForm();
      setSlotBookingScreen(
        editingProduct ? "select-products" : "select-unique-items",
      );
      setSlotSaveAttempted(false);
      return;
    }

    const next = buildCatalogProductFromUniqueItemDraft(
      uniqueItemDraft,
      `unique-${Date.now()}`,
    );
    if (!next) return;
    persistBookingUniqueCatalogItem(next);
    setUniqueItemSelectionDraft((prev) => ({
      ...prev,
      [next.id]: { selected: true, quantity: Math.max(1, next.unit ?? 1) },
    }));
    resetUniqueItemForm();
    setSlotBookingScreen("select-unique-items");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    dispatchBookingEventIfApi,
    editingBookingLine,
    editingCatalogProductId,
    editingEventId,
    persistBookingCatalogProduct,
    persistBookingUniqueCatalogItem,
    resetUniqueItemForm,
    selectedServices,
    uniqueItemDraft,
    uniqueItemOrigin,
  ]);

  return {
    adjustUniqueItemQuantityDraft,
    applyUniqueItem,
    applyUniqueItemSelection,
    draftFromBookingLine,
    leaveUniqueItemScreen,
    openAddUniqueItem,
    openEditBookingProductLine,
    openEditBookingUniqueLine,
    openSelectUniqueItems,
    persistBookingCatalogProduct,
    persistBookingUniqueCatalogItem,
    resetUniqueItemForm,
    toggleUniqueItemSelectionDraft,
  };
}
