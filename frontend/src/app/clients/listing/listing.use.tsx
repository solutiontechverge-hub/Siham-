"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import type { ListingFilterValues } from "../../../components/common";
import { listingPageData, type ListingCardData } from "./listing.data";

export type ListingSortValue = "recommended" | "rating" | "price_asc" | "price_desc";

const initialFilters: ListingFilterValues = {
  dateTime: null,
  category: "",
  municipality: "",
  keyword: "",
  locationModes: { fixed: true, desired: true },
};

const municipalityLabels = Object.fromEntries(
  listingPageData.filters.municipalityOptions.map((opt) => [opt.value, opt.label]),
) as Record<string, string>;

const getCardLocationModes = (card: ListingCardData): ("fixed" | "desired")[] =>
  card.locationModes?.length ? card.locationModes : [card.locationModeDefault];

const matchesMunicipality = (card: ListingCardData, municipalityValue: string) => {
  if (!municipalityValue) return true;

  const label = municipalityLabels[municipalityValue]?.toLowerCase() ?? "";
  const token = municipalityValue.replaceAll("_", " ").toLowerCase();
  const haystack = `${card.municipalityLabel} ${card.addressLabel}`.toLowerCase();

  return haystack.includes(label) || haystack.includes(token);
};

const matchesLocationModes = (
  card: ListingCardData,
  locationModes: ListingFilterValues["locationModes"],
) => {
  const { fixed, desired } = locationModes;
  if (!fixed && !desired) return true;

  const cardModes = getCardLocationModes(card);
  return (fixed && cardModes.includes("fixed")) || (desired && cardModes.includes("desired"));
};

const matchesCategory = (card: ListingCardData, category: string) => {
  if (!category) return true;
  return card.category === category;
};

const matchesKeyword = (card: ListingCardData, keyword: string) => {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;

  const hay = `${card.title} ${card.subtitle} ${card.municipalityLabel} ${card.addressLabel} ${card.categoryLabel ?? ""}`.toLowerCase();
  return hay.includes(q);
};

export function useListingTokens() {
  return useTheme().palette.mollure;
}

export function useClientListingState(cards: ListingCardData[]) {
  const [draftFilters, setDraftFilters] = React.useState<ListingFilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = React.useState<ListingFilterValues>(initialFilters);
  const [sort, setSort] = React.useState<ListingSortValue>("recommended");
  const [page, setPage] = React.useState(1);
  const [favorites, setFavorites] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem("mollure:favorites");
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  const pageSize = 6;

  const toggleFavorite = React.useCallback((id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem("mollure:favorites", JSON.stringify(favorites));
    } catch {
      // ignore (storage disabled)
    }
  }, [favorites]);

  const filtered = React.useMemo(() => {
    return cards.filter((card) => {
      if (!matchesCategory(card, appliedFilters.category)) return false;
      if (!matchesMunicipality(card, appliedFilters.municipality)) return false;
      if (!matchesLocationModes(card, appliedFilters.locationModes)) return false;
      if (!matchesKeyword(card, appliedFilters.keyword)) return false;
      return true;
    });
  }, [appliedFilters, cards]);

  const sorted = React.useMemo(() => {
    if (sort === "recommended") return filtered;
    const clone = [...filtered];
    if (sort === "rating") {
      clone.sort((a, b) => b.rating - a.rating);
      return clone;
    }
    const getPrice = (c: ListingCardData) => {
      const text = c.services[0]?.priceLabel || c.startingFromLabel;
      const match = text.match(/(\d+)\s*EUR/i);
      return match ? Number(match[1]) : 0;
    };
    clone.sort((a, b) => (sort === "price_asc" ? getPrice(a) - getPrice(b) : getPrice(b) - getPrice(a)));
    return clone;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [page, sorted]);

  const applyFilters = React.useCallback(() => {
    setAppliedFilters(draftFilters);
    setPage(1);
  }, [draftFilters]);

  return {
    filters: draftFilters,
    setFilters: setDraftFilters,
    applyFilters,
    sort,
    setSort,
    page,
    setPage,
    totalPages,
    favorites,
    toggleFavorite,
    items: paged,
    totalCount: sorted.length,
  };
}
