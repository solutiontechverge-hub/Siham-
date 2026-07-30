export type BookingCatalogProduct = {
  id: string;
  name: string;
  price: number;
  /** Optional fields kept for edit round-trip (Add/Edit Product form). */
  vat?: string;
  unit?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: string;
};

/** Empty — professionals load their own products from finance settings. */
export const bookingProductCatalog: readonly BookingCatalogProduct[] = [];

export type BookingProductDraftItem = {
  selected: boolean;
  quantity: number;
};

export type BookingProductSelectionDraft = Record<
  string,
  BookingProductDraftItem
>;

export function createEmptyProductSelectionDraft(
  catalog: readonly BookingCatalogProduct[] = bookingProductCatalog,
): BookingProductSelectionDraft {
  return Object.fromEntries(
    catalog.map((product) => [product.id, { selected: false, quantity: 1 }]),
  );
}

export function buildProductSelectionDraftFromSelected(
  selected: ReadonlyArray<{ id: string; quantity: number }>,
  catalog: readonly BookingCatalogProduct[] = bookingProductCatalog,
): BookingProductSelectionDraft {
  const selectedById = new Map(
    selected.map((item) => [item.id, item.quantity]),
  );
  return Object.fromEntries(
    catalog.map((product) => [
      product.id,
      {
        selected: selectedById.has(product.id),
        quantity: selectedById.get(product.id) ?? 1,
      },
    ]),
  );
}

export function formatProductLineName(name: string, quantity: number) {
  return quantity > 1 ? `${name} x${quantity}` : name;
}

export function formatProductUnitPrice(price: number) {
  return `€${price}`;
}

export function getProductBaseName(name: string, quantity: number) {
  const suffix = ` x${quantity}`;
  return quantity > 1 && name.endsWith(suffix)
    ? name.slice(0, -suffix.length)
    : name;
}
