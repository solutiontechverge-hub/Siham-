export type ListingSearchFor = "all" | "women" | "men" | "kids";
export type ListingPriceTier = "1" | "2" | "3" | "4";

export type ListingDrawerFilters = {
  /** `null` = no audience filter (nothing checked) */
  searchFor: ListingSearchFor | null;
  priceTiers: Record<ListingPriceTier, boolean>;
  discount: boolean;
  allSelectedCategories: boolean;
  noPrepayment: boolean;
  noMinTimeslotDl: boolean;
  bookSameTimeFl: boolean;
};

export type ListingCardFilterMeta = {
  serviceFor?: string[];
  priceTier?: ListingPriceTier;
  lowestPrice?: number;
  hasDiscount?: boolean;
  coversAllSelectedCategories?: boolean;
  hasNoPrepayment?: boolean;
  hasNoMinTimeslotDl?: boolean;
  bookSameTimeFl?: boolean;
};

export const defaultListingDrawerFilters = (): ListingDrawerFilters => ({
  searchFor: null,
  priceTiers: { "1": false, "2": false, "3": false, "4": false },
  discount: false,
  allSelectedCategories: false,
  noPrepayment: false,
  noMinTimeslotDl: false,
  bookSameTimeFl: false,
});

const SEARCH_FOR_OPTIONS: { key: ListingSearchFor; label: string }[] = [
  { key: "all", label: "All" },
  { key: "women", label: "Woman" },
  { key: "men", label: "Men" },
  { key: "kids", label: "Kids" },
];

const PRICE_TIER_OPTIONS: { key: ListingPriceTier; label: string }[] = [
  { key: "1", label: "€" },
  { key: "2", label: "€€" },
  { key: "3", label: "€€€" },
  { key: "4", label: "€€€€" },
];

const OTHER_OPTIONS: { key: keyof Omit<ListingDrawerFilters, "searchFor" | "priceTiers">; label: string }[] = [
  { key: "discount", label: "Discount" },
  {
    key: "allSelectedCategories",
    label: "Professional provides services in all selected categories",
  },
  { key: "noPrepayment", label: "No prepayment" },
  { key: "noMinTimeslotDl", label: "No minimum timeslot for DL" },
  { key: "bookSameTimeFl", label: "Book services at the same time option for FL" },
];

export const listingDrawerFilterSections = {
  searchFor: SEARCH_FOR_OPTIONS,
  priceTiers: PRICE_TIER_OPTIONS,
  other: OTHER_OPTIONS,
} as const;

function getLowestPrice(card: ListingCardFilterMeta): number {
  if (card.lowestPrice != null && card.lowestPrice > 0) return card.lowestPrice;
  return 0;
}

export function resolvePriceTier(card: ListingCardFilterMeta): ListingPriceTier {
  const price = getLowestPrice(card);
  if (price < 30) return "1";
  if (price < 60) return "2";
  if (price < 100) return "3";
  return "4";
}

function cardMatchesSearchFor(card: ListingCardFilterMeta, searchFor: ListingSearchFor | null): boolean {
  if (!searchFor || searchFor === "all") return true;
  const ids = (card.serviceFor ?? []).map((v) => String(v).toLowerCase());
  // Businesses without audience metadata are not excluded
  if (!ids.length) return true;
  return ids.includes(searchFor);
}

function cardMatchesPriceTiers(card: ListingCardFilterMeta, priceTiers: ListingDrawerFilters["priceTiers"]): boolean {
  const active = (Object.entries(priceTiers) as [ListingPriceTier, boolean][])
    .filter(([, on]) => on)
    .map(([tier]) => tier);
  if (!active.length) return true;
  const tier = card.priceTier ?? resolvePriceTier(card);
  return active.includes(tier);
}

function optionalFlagPasses(required: boolean, value: boolean | undefined): boolean {
  if (!required) return true;
  return value === true;
}

export function isDrawerFiltersActive(filters: ListingDrawerFilters): boolean {
  if (filters.searchFor && filters.searchFor !== "all") return true;
  if (Object.values(filters.priceTiers).some(Boolean)) return true;
  return (
    filters.discount ||
    filters.allSelectedCategories ||
    filters.noPrepayment ||
    filters.noMinTimeslotDl ||
    filters.bookSameTimeFl
  );
}

export function cardMatchesDrawerFilters(card: ListingCardFilterMeta, filters: ListingDrawerFilters): boolean {
  if (!cardMatchesSearchFor(card, filters.searchFor)) return false;
  if (!cardMatchesPriceTiers(card, filters.priceTiers)) return false;
  if (!optionalFlagPasses(filters.discount, card.hasDiscount)) return false;
  if (!optionalFlagPasses(filters.allSelectedCategories, card.coversAllSelectedCategories)) return false;
  if (!optionalFlagPasses(filters.noPrepayment, card.hasNoPrepayment)) return false;
  if (!optionalFlagPasses(filters.noMinTimeslotDl, card.hasNoMinTimeslotDl)) return false;
  if (!optionalFlagPasses(filters.bookSameTimeFl, card.bookSameTimeFl)) return false;
  return true;
}
