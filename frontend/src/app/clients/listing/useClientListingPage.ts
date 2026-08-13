"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import type { ListingFilterValues } from "../../../components/common";
import {
  defaultListingDrawerFilters,
  type ListingDrawerFilters,
} from "../../../components/common/listingDrawerFilters";
import { cardMatchesListingFilters } from "./listing.filters";
import { presentListingCards } from "./listing.cardPresentation";
import { hasListingSearchParams } from "./listingSearchParams";
import type { ListingCardData } from "./listing.data";

export type ListingSortValue =
  "recommended" | "alpha_asc" | "alpha_desc" | "rating_desc";

const initialFilters: ListingFilterValues = {
  dateTime: null,
  category: "",
  categories: [],
  municipality: "",
  municipalities: [],
  keywords: [],
  locationModes: [],
};

function mergeListingFilters(
  patch?: Partial<ListingFilterValues>,
): ListingFilterValues {
  return {
    ...initialFilters,
    ...patch,
    categories: patch?.categories ?? initialFilters.categories,
    municipalities: patch?.municipalities ?? initialFilters.municipalities,
    keywords: patch?.keywords ?? initialFilters.keywords,
    locationModes: patch?.locationModes ?? initialFilters.locationModes,
  };
}

export function useListingTokens() {
  return useTheme().palette.mollure;
}

export function useClientListingState(
  cards: ListingCardData[],
  urlFilters?: Partial<ListingFilterValues>,
  searchKey = "",
) {
  const [draftFilters, setDraftFilters] = React.useState<ListingFilterValues>(
    () => mergeListingFilters(urlFilters),
  );
  const [appliedFilters, setAppliedFilters] =
    React.useState<ListingFilterValues>(() => mergeListingFilters(urlFilters));
  const [drawerFilters, setDrawerFilters] =
    React.useState<ListingDrawerFilters>(defaultListingDrawerFilters);
  const [appliedDrawerFilters, setAppliedDrawerFilters] =
    React.useState<ListingDrawerFilters>(defaultListingDrawerFilters);
  const [sort, setSort] = React.useState<ListingSortValue>("recommended");
  const [page, setPage] = React.useState(1);
  const [favorites, setFavorites] = React.useState<Record<string, boolean>>(
    () => {
      if (typeof window === "undefined") return {};
      try {
        const raw = window.localStorage.getItem("mollure:favorites");
        return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      } catch {
        return {};
      }
    },
  );

  const pageSize = 6;

  React.useEffect(() => {
    if (!searchKey || !urlFilters || !hasListingSearchParams(urlFilters))
      return;
    const merged = mergeListingFilters(urlFilters);
    setDraftFilters(merged);
    setAppliedFilters(merged);
    setPage(1);
  }, [searchKey, urlFilters]);

  const toggleFavorite = React.useCallback((id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        "mollure:favorites",
        JSON.stringify(favorites),
      );
    } catch {
      // ignore (storage disabled)
    }
  }, [favorites]);

  const filtered = React.useMemo(() => {
    return cards.filter((card) =>
      cardMatchesListingFilters(card, appliedFilters, appliedDrawerFilters),
    );
  }, [cards, appliedDrawerFilters, appliedFilters]);

  const sorted = React.useMemo(() => {
    if (sort === "recommended") return filtered;

    const clone = [...filtered];
    const byTitle = (a: ListingCardData, b: ListingCardData) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

    if (sort === "alpha_asc") {
      clone.sort(byTitle);
      return clone;
    }

    if (sort === "alpha_desc") {
      clone.sort((a, b) => byTitle(b, a));
      return clone;
    }

    // Highest Rated → Lowest Rated (tie-break: more reviews, then title)
    clone.sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;
      const reviewDiff = b.reviewsCount - a.reviewsCount;
      if (reviewDiff !== 0) return reviewDiff;
      return byTitle(a, b);
    });
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

  const items = React.useMemo(
    () =>
      presentListingCards(paged, {
        category: appliedFilters.category,
        categories: appliedFilters.categories,
        keywords: appliedFilters.keywords,
      }),
    [
      appliedFilters.categories,
      appliedFilters.category,
      appliedFilters.keywords,
      paged,
    ],
  );

  const applyFilters = React.useCallback(() => {
    setAppliedFilters(draftFilters);
    setPage(1);
  }, [draftFilters]);

  const applyDrawerFilters = React.useCallback((next: ListingDrawerFilters) => {
    setDrawerFilters(next);
    setAppliedDrawerFilters(next);
    setPage(1);
  }, []);

  const cancelDrawerFilters = React.useCallback(() => {
    setDrawerFilters(appliedDrawerFilters);
  }, [appliedDrawerFilters]);

  return {
    filters: draftFilters,
    appliedFilters,
    setFilters: setDraftFilters,
    applyFilters,
    drawerFilters,
    setDrawerFilters,
    applyDrawerFilters,
    cancelDrawerFilters,
    sort,
    setSort,
    page,
    setPage,
    totalPages,
    favorites,
    toggleFavorite,
    items,
    totalCount: sorted.length,
  };
}
