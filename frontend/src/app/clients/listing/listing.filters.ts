import type { ListingFilterValues } from "../../../components/common";
import {
  cardMatchesDrawerFilters,
  isDrawerFiltersActive,
  type ListingDrawerFilters,
} from "../../../components/common/listingDrawerFilters";
import type { ListingCardData } from "./listing.data";

function normalizeCategoryToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cardMatchesLocationFilter(
  offering: ListingCardData["businessOffering"],
  selectedModes: Array<"fixed" | "desired">,
) {
  if (!selectedModes.length) return true;

  const supportsFixed = offering === "fixed" || offering === "both";
  const supportsDesired = offering === "desired" || offering === "both";

  return selectedModes.some((mode) => {
    if (mode === "fixed") return supportsFixed;
    return supportsDesired;
  });
}

function cardMatchesCategory(card: ListingCardData, category: string): boolean {
  if (!category) return true;
  const keys = card.categoryKeys ?? [];
  if (!keys.length) return true;

  const needle = category.toLowerCase();
  const needleSpaced = needle.replaceAll("_", " ");
  const needleNorm = normalizeCategoryToken(category);

  return keys.some((key) => {
    if (key === needle) return true;
    if (normalizeCategoryToken(key) === needleNorm) return true;
    if (
      normalizeCategoryToken(key).includes(needleNorm) ||
      needleNorm.includes(normalizeCategoryToken(key))
    ) {
      return true;
    }
    if (key.includes(needle) || needle.includes(key)) return true;
    if (key.includes(needleSpaced) || needleSpaced.includes(key.replaceAll("_", " "))) return true;
    return false;
  });
}

function cardMatchesCategories(card: ListingCardData, categories: string[], fallbackCategory: string) {
  const selected = categories.length ? categories : fallbackCategory ? [fallbackCategory] : [];
  if (!selected.length) return true;
  return selected.some((category) => cardMatchesCategory(card, category));
}

function cardMatchesMunicipality(card: ListingCardData, municipality: string): boolean {
  if (!municipality) return true;
  const needle = municipality.replaceAll("_", " ").toLowerCase();
  const hay = `${card.municipalityLabel} ${card.addressLabel}`.toLowerCase();
  return hay.includes(needle);
}

function cardMatchesMunicipalities(
  card: ListingCardData,
  municipalities: string[],
  fallbackMunicipality: string,
) {
  const selected = municipalities.length ? municipalities : fallbackMunicipality ? [fallbackMunicipality] : [];
  if (!selected.length) return true;
  return selected.some((municipality) => cardMatchesMunicipality(card, municipality));
}

function cardMatchesKeywords(card: ListingCardData, keywords: string[]): boolean {
  if (!keywords.length) return true;
  const hay = card.searchText ?? `${card.title} ${card.subtitle} ${card.municipalityLabel}`.toLowerCase();
  return keywords.some((keyword) => hay.includes(keyword));
}

export function cardMatchesListingFilters(
  card: ListingCardData,
  heroFilters: ListingFilterValues,
  drawerFilters: ListingDrawerFilters,
): boolean {
  if (isDrawerFiltersActive(drawerFilters) && !cardMatchesDrawerFilters(card, drawerFilters)) {
    return false;
  }
  if (!cardMatchesLocationFilter(card.businessOffering, heroFilters.locationModes)) {
    return false;
  }
  if (!cardMatchesCategories(card, heroFilters.categories ?? [], heroFilters.category)) {
    return false;
  }
  if (!cardMatchesMunicipalities(card, heroFilters.municipalities ?? [], heroFilters.municipality)) {
    return false;
  }
  if (!cardMatchesKeywords(card, heroFilters.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))) {
    return false;
  }
  return true;
}
