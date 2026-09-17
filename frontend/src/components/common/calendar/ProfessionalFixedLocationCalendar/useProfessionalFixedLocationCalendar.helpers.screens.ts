import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";

export function isBookingDetailsSubScreen(screen: SlotBookingScreen): boolean {
  return (
    screen === "select-services" ||
    screen === "edit-service" ||
    screen === "select-products" ||
    screen === "select-unique-items" ||
    screen === "add-unique-item" ||
    screen === "add-buffer"
  );
}

export function resolveUniqueItemFlowLabels(input: {
  uniqueItemOrigin: "unique" | "products";
  editingBookingLine: null | { kind: "product" | "unique" };
  editingCatalogProductId: string | null;
}): {
  isProduct: boolean;
  title: string;
  namePlaceholder: string;
} {
  const isProduct =
    input.uniqueItemOrigin === "products" ||
    input.editingBookingLine?.kind === "product";
  const editing = Boolean(
    input.editingBookingLine || input.editingCatalogProductId,
  );
  return {
    isProduct,
    title: editing
      ? isProduct
        ? "Edit Product"
        : "Edit Unique Item"
      : isProduct
        ? "Add Product"
        : "Add Unique Item",
    namePlaceholder: isProduct ? "Product Name" : "Unique Name",
  };
}

export function findFocusBookingMatch(
  events: readonly CalendarEvent[],
  focusRef: string,
  focusId: string,
): CalendarEvent | null {
  const normalize = (value: string) =>
    value.trim().replace(/^#/, "").replace(/^bk-?/i, "").toLowerCase();

  return (
    events.find((event) => {
      if (
        focusId &&
        (event.id === focusId || String(event.id).includes(focusId))
      ) {
        return true;
      }
      if (focusRef && event.bookingCode) {
        return normalize(event.bookingCode) === normalize(focusRef);
      }
      return false;
    }) ?? null
  );
}
