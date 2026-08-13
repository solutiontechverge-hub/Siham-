import type { ListingFilterValues } from "../../../components/common";
import type { ListingCardData, ListingCardService } from "./listing.data";

export type ListingCardServiceCatalogItem = {
  name: string;
  price: number;
  durationLabel?: string;
  categoryId?: string;
  categoryTitle?: string;
  searchTokens: string[];
};

export type ListingCardPresentationFilters = Pick<
  ListingFilterValues,
  "category" | "categories" | "keywords"
>;

const normalizeCategoryToken = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const formatStartingFromLabel = (price: number) =>
  `Starting From ${Math.round(price)} EUR`;

const formatServicePriceLabel = (price: number, isLowest: boolean) =>
  isLowest ? formatStartingFromLabel(price) : `${Math.round(price)} EUR`;

const selectedCategories = (filters: ListingCardPresentationFilters) => {
  const categories = filters.categories ?? [];
  if (categories.length) return categories;
  const single = String(filters.category ?? "").trim();
  return single ? [single] : [];
};

const selectedKeywords = (filters: ListingCardPresentationFilters) =>
  (filters.keywords ?? [])
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);

export const hasListingPresentationFilters = (
  filters: ListingCardPresentationFilters,
) =>
  selectedCategories(filters).length > 0 || selectedKeywords(filters).length > 0;

const catalogItemMatchesCategory = (
  item: ListingCardServiceCatalogItem,
  categories: string[],
) => {
  if (!categories.length) return true;

  const itemTokens = new Set<string>();
  const addToken = (raw: string | undefined) => {
    const trimmed = String(raw ?? "").trim().toLowerCase();
    if (!trimmed) return;
    itemTokens.add(trimmed);
    itemTokens.add(normalizeCategoryToken(trimmed));
    itemTokens.add(trimmed.replaceAll("_", " "));
  };

  addToken(item.categoryId);
  addToken(item.categoryTitle);

  return categories.some((category) => {
    const needle = category.trim().toLowerCase();
    if (!needle) return false;
    const needleNorm = normalizeCategoryToken(category);
    const needleSpaced = needle.replaceAll("_", " ");

    for (const token of itemTokens) {
      if (token === needle) return true;
      if (normalizeCategoryToken(token) === needleNorm) return true;
      if (token.includes(needle) || needle.includes(token)) return true;
      if (token.includes(needleSpaced) || needleSpaced.includes(token)) {
        return true;
      }
    }
    return false;
  });
};

const catalogItemMatchesKeywords = (
  item: ListingCardServiceCatalogItem,
  keywords: string[],
) => {
  if (!keywords.length) return true;
  const hay = item.searchTokens.join(" ").toLowerCase();
  return keywords.some((keyword) => hay.includes(keyword));
};

const buildDisplayedServices = (
  catalog: ListingCardServiceCatalogItem[],
): ListingCardService[] => {
  const priced = catalog.filter((item) => Number.isFinite(item.price) && item.price > 0);
  if (!priced.length) {
    return [{ name: "Services", priceLabel: "Price on request" }];
  }

  const sorted = [...priced].sort((a, b) => a.price - b.price);
  const lowestPrice = sorted[0]?.price ?? 0;

  return sorted.slice(0, 3).map((item) => ({
    name: item.name,
    durationLabel: item.durationLabel,
    priceLabel: formatServicePriceLabel(item.price, item.price === lowestPrice),
  }));
};

const resolveStartingFromLabel = (catalog: ListingCardServiceCatalogItem[]) => {
  const lowestPrice = catalog
    .map((item) => item.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b)[0];

  if (lowestPrice == null) return "Price on request";
  return formatStartingFromLabel(lowestPrice);
};

export const presentListingCard = (
  card: ListingCardData,
  filters: ListingCardPresentationFilters,
): ListingCardData => {
  const catalog = card.serviceCatalog ?? [];
  if (!catalog.length) {
    return card;
  }

  const categories = selectedCategories(filters);
  const keywords = selectedKeywords(filters);

  const filteredCatalog = catalog.filter(
    (item) =>
      catalogItemMatchesCategory(item, categories) &&
      catalogItemMatchesKeywords(item, keywords),
  );

  const services = buildDisplayedServices(filteredCatalog);
  const startingFromLabel = resolveStartingFromLabel(filteredCatalog);
  const lowestPrice =
    filteredCatalog
      .map((item) => item.price)
      .filter((price) => Number.isFinite(price) && price > 0)
      .sort((a, b) => a - b)[0] ?? 0;

  return {
    ...card,
    services,
    startingFromLabel,
    lowestPrice,
  };
};

export const presentListingCards = (
  cards: ListingCardData[],
  filters: ListingCardPresentationFilters,
) => cards.map((card) => presentListingCard(card, filters));
