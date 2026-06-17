export type BookingCatalogProduct = {
  id: string;
  name: string;
  price: number;
};

export const bookingProductCatalog: readonly BookingCatalogProduct[] = [
  { id: "prd-shampoo", name: "Shampoo", price: 25 },
  { id: "prd-conditioner", name: "Conditioner", price: 22 },
  { id: "prd-hair-serum", name: "Hair Serum", price: 18 },
  { id: "prd-face-mask", name: "Face Mask", price: 15 },
] as const;

export type BookingProductDraftItem = {
  selected: boolean;
  quantity: number;
};

export type BookingProductSelectionDraft = Record<string, BookingProductDraftItem>;

export function createEmptyProductSelectionDraft(): BookingProductSelectionDraft {
  return Object.fromEntries(
    bookingProductCatalog.map((product) => [product.id, { selected: false, quantity: 1 }]),
  );
}

export function buildProductSelectionDraftFromSelected(
  selected: ReadonlyArray<{ id: string; quantity: number }>,
): BookingProductSelectionDraft {
  const selectedById = new Map(selected.map((item) => [item.id, item.quantity]));
  return Object.fromEntries(
    bookingProductCatalog.map((product) => [
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
  return quantity > 1 && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}
