"use client";

import BookingSelectProductsScreen from "../BookingSelectProductsScreen";

import BookingAddUniqueItemScreen from "../BookingAddUniqueItemScreen";

import BookingEditCatalogItemScreen from "../BookingEditCatalogItemScreen";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensProductsBag = Pick<
  Vm,
  | "adjustProductQuantityDraft"
  | "adjustUniqueItemQuantityDraft"
  | "editingCatalogProductId"
  | "isViewingExisting"
  | "mergedCustomBookingProducts"
  | "openAddProduct"
  | "openAddUniqueItem"
  | "persistedUniqueCatalog"
  | "productCatalog"
  | "productSelectionDraft"
  | "setUniqueItemDraft"
  | "slotErrors"
  | "toggleProductSelectionDraft"
  | "toggleUniqueItemSelectionDraft"
  | "uniqueItemDraft"
  | "uniqueItemFlowNamePlaceholder"
  | "uniqueItemFlowTitle"
  | "uniqueItemSelectionDraft"
>;

type Props = { bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensProductsBag };

export function ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectProducts({ bag }: Props) {
  const {
    adjustProductQuantityDraft,
    isViewingExisting,
    mergedCustomBookingProducts,
    openAddProduct,
    productCatalog,
    productSelectionDraft,
    toggleProductSelectionDraft,
  } = bag;

  return (
      <BookingSelectProductsScreen
        draft={productSelectionDraft}
        catalog={productCatalog}
        customProducts={mergedCustomBookingProducts}
        onToggle={(product) =>
          toggleProductSelectionDraft(product.id)
        }
        onQuantityChange={adjustProductQuantityDraft}
        onAddProduct={
          isViewingExisting ? undefined : () => openAddProduct()
        }
        disabled={isViewingExisting}
      />
  );
}

export function ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectUniqueItems({ bag }: Props) {
  const {
    adjustUniqueItemQuantityDraft,
    isViewingExisting,
    openAddUniqueItem,
    persistedUniqueCatalog,
    toggleUniqueItemSelectionDraft,
    uniqueItemSelectionDraft,
  } = bag;

  return (
      <BookingSelectProductsScreen
        draft={uniqueItemSelectionDraft}
        catalog={persistedUniqueCatalog}
        heading="Select Unique Item"
        searchPlaceholder="Search unique items..."
        addButtonLabel="Add new unique item"
        emptyLabel="No unique items yet. Add one to get started."
        emptySearchLabel="No unique items match your search."
        onToggle={(item) =>
          toggleUniqueItemSelectionDraft(item.id)
        }
        onQuantityChange={adjustUniqueItemQuantityDraft}
        onAddProduct={
          isViewingExisting ? undefined : () => openAddUniqueItem()
        }
        disabled={isViewingExisting}
      />
  );
}

export function ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddUniqueItem({ bag }: Props) {
  const {
    editingCatalogProductId,
    isViewingExisting,
    setUniqueItemDraft,
    slotErrors,
    uniqueItemDraft,
    uniqueItemFlowNamePlaceholder,
    uniqueItemFlowTitle,
  } = bag;

  return (
      editingCatalogProductId ? (
        <BookingEditCatalogItemScreen
          draft={uniqueItemDraft}
          errors={{
            productName: slotErrors.uniqueItemProductName,
            price: slotErrors.uniqueItemPrice,
          }}
          heading={uniqueItemFlowTitle}
          namePlaceholder={uniqueItemFlowNamePlaceholder}
          onChange={(patch) =>
            setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
          }
          disabled={isViewingExisting}
        />
      ) : (
        <BookingAddUniqueItemScreen
          draft={uniqueItemDraft}
          errors={{
            productName: slotErrors.uniqueItemProductName,
            price: slotErrors.uniqueItemPrice,
          }}
          heading={uniqueItemFlowTitle}
          namePlaceholder={uniqueItemFlowNamePlaceholder}
          onChange={(patch) =>
            setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
          }
          disabled={isViewingExisting}
        />
      )
  );
}
