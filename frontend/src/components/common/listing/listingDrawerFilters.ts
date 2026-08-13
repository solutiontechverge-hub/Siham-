export type ListingSearchForKey =
  | "all"
  | "women"
  | "womenOnly"
  | "men"
  | "menOnly"
  | "kids"
  | "kidsOnly";

export type ListingPriceTier = "1" | "2" | "3";

export type ListingSearchForFilters = Record<ListingSearchForKey, boolean>;

export type ListingDrawerFilters = {
  searchFor: ListingSearchForFilters;
  priceTiers: Record<ListingPriceTier, boolean>;
  discount: boolean;
  allSelectedCategories: boolean;
  noPrepayment: boolean;
  noMinTimeslotDl: boolean;
  noKmAllowanceDl: boolean;
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
  hasNoKmAllowanceDl?: boolean;
  bookSameTimeFl?: boolean;
};

const createDefaultSearchFor = (): ListingSearchForFilters => ({
  all: true,
  women: false,
  womenOnly: false,
  men: false,
  menOnly: false,
  kids: false,
  kidsOnly: false,
});

export const defaultListingDrawerFilters = (): ListingDrawerFilters => ({
  searchFor: createDefaultSearchFor(),
  priceTiers: { "1": false, "2": false, "3": false },
  discount: false,
  allSelectedCategories: false,
  noPrepayment: false,
  noMinTimeslotDl: false,
  noKmAllowanceDl: false,
  bookSameTimeFl: false,
});

const SEARCH_FOR_OPTIONS: { key: ListingSearchForKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "women", label: "Woman" },
  { key: "womenOnly", label: "Woman only" },
  { key: "men", label: "Men" },
  { key: "menOnly", label: "Men only" },
  { key: "kids", label: "Kids" },
  { key: "kidsOnly", label: "Kids only" },
];

const PRICE_TIER_OPTIONS: { key: ListingPriceTier; label: string }[] = [
  { key: "1", label: "€ (budget-friendly)" },
  { key: "2", label: "€€ (standard)" },
  { key: "3", label: "€€€ (Premium)" },
];

const OTHER_OPTIONS: {
  key: keyof Omit<ListingDrawerFilters, "searchFor" | "priceTiers">;
  label: string;
}[] = [
  { key: "discount", label: "Discount" },
  {
    key: "allSelectedCategories",
    label: "Professional provides services in all selected categories",
  },
  { key: "noPrepayment", label: "No prepayment" },
  { key: "noMinTimeslotDl", label: "No minimum timeslot for DL" },
  { key: "noKmAllowanceDl", label: "No km allowance for DL" },
  {
    key: "bookSameTimeFl",
    label: "Book services at the same time option for FL",
  },
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
  return "3";
}

function normalizeAudienceIds(serviceFor: string[] | undefined) {
  return (serviceFor ?? []).map((value) => String(value).toLowerCase());
}

function getAudienceFlags(serviceFor: string[] | undefined) {
  const ids = normalizeAudienceIds(serviceFor);
  const hasWomen = ids.includes("women") || ids.includes("woman");
  const hasMen = ids.includes("men") || ids.includes("man");
  const hasKids = ids.includes("kids") || ids.includes("kid");
  const count = [hasWomen, hasMen, hasKids].filter(Boolean).length;

  return {
    hasWomen,
    hasMen,
    hasKids,
    womenOnly: hasWomen && count === 1,
    menOnly: hasMen && count === 1,
    kidsOnly: hasKids && count === 1,
  };
}

function cardMatchesSearchFor(
  card: ListingCardFilterMeta,
  searchFor: ListingSearchForFilters,
): boolean {
  if (searchFor.all) return true;

  const active = (Object.entries(searchFor) as [ListingSearchForKey, boolean][])
    .filter(([key, on]) => on && key !== "all")
    .map(([key]) => key);

  if (!active.length) return true;

  const audiences = getAudienceFlags(card.serviceFor);
  if (!normalizeAudienceIds(card.serviceFor).length) return true;

  return active.some((key) => {
    switch (key) {
      case "women":
        return audiences.hasWomen;
      case "womenOnly":
        return audiences.womenOnly;
      case "men":
        return audiences.hasMen;
      case "menOnly":
        return audiences.menOnly;
      case "kids":
        return audiences.hasKids;
      case "kidsOnly":
        return audiences.kidsOnly;
      default:
        return false;
    }
  });
}

function cardMatchesPriceTiers(
  card: ListingCardFilterMeta,
  priceTiers: ListingDrawerFilters["priceTiers"],
): boolean {
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
  if (!filters.searchFor.all) {
    const hasAudienceSelection = (
      Object.entries(filters.searchFor) as [ListingSearchForKey, boolean][]
    ).some(([key, on]) => on && key !== "all");
    if (hasAudienceSelection) return true;
  }
  if (Object.values(filters.priceTiers).some(Boolean)) return true;
  return (
    filters.discount ||
    filters.allSelectedCategories ||
    filters.noPrepayment ||
    filters.noMinTimeslotDl ||
    filters.noKmAllowanceDl ||
    filters.bookSameTimeFl
  );
}

export function cardMatchesDrawerFilters(
  card: ListingCardFilterMeta,
  filters: ListingDrawerFilters,
): boolean {
  if (!cardMatchesSearchFor(card, filters.searchFor)) return false;
  if (!cardMatchesPriceTiers(card, filters.priceTiers)) return false;
  if (!optionalFlagPasses(filters.discount, card.hasDiscount)) return false;
  if (!optionalFlagPasses(filters.allSelectedCategories, card.coversAllSelectedCategories)) {
    return false;
  }
  if (!optionalFlagPasses(filters.noPrepayment, card.hasNoPrepayment)) return false;
  if (!optionalFlagPasses(filters.noMinTimeslotDl, card.hasNoMinTimeslotDl)) return false;
  if (!optionalFlagPasses(filters.noKmAllowanceDl, card.hasNoKmAllowanceDl)) return false;
  if (!optionalFlagPasses(filters.bookSameTimeFl, card.bookSameTimeFl)) return false;
  return true;
}

export function toggleListingSearchFor(
  current: ListingSearchForFilters,
  key: ListingSearchForKey,
  value: boolean,
): ListingSearchForFilters {
  if (key === "all") {
    return value ? createDefaultSearchFor() : { ...current, all: false };
  }

  const next: ListingSearchForFilters = {
    ...current,
    [key]: value,
    all: false,
  };

  const hasSpecific = (
    Object.entries(next) as [ListingSearchForKey, boolean][]
  ).some(([entryKey, on]) => entryKey !== "all" && on);

  if (!hasSpecific) {
    return createDefaultSearchFor();
  }

  return next;
}
