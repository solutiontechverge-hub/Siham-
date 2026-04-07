"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import type { ListingFilterValues } from "../../components/common";
import type { ListingCardData } from "./listing.data";

export type ListingSortValue = "recommended" | "rating" | "price_asc" | "price_desc";

const initialFilters: ListingFilterValues = {
  dateTime: null,
  category: "",
  municipality: "",
  keyword: "",
  locationMode: "fixed",
};

export function useListingTokens() {
  return useTheme().palette.mollure;
}

export function useClientListingState(cards: ListingCardData[]) {
  const [filters, setFilters] = React.useState<ListingFilterValues>(initialFilters);
  const [sort, setSort] = React.useState<ListingSortValue>("recommended");
  const [page, setPage] = React.useState(1);
  const [favorites, setFavorites] = React.useState<Record<string, boolean>>({});

  const pageSize = 6;

  const toggleFavorite = React.useCallback((id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const filtered = React.useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return cards.filter((card) => {
      if (filters.municipality && filters.municipality !== "noord_holland") {
        // demo matching - map value to label where possible
        const m = filters.municipality.replaceAll("_", " ").toLowerCase();
        if (!card.municipalityLabel.toLowerCase().includes(m)) return false;
      }
      if (keyword) {
        const hay = `${card.title} ${card.subtitle} ${card.municipalityLabel}`.toLowerCase();
        if (!hay.includes(keyword)) return false;
      }
      return true;
    });
  }, [cards, filters.keyword, filters.municipality]);

  const sorted = React.useMemo(() => {
    if (sort === "recommended") return filtered;
    const clone = [...filtered];
    if (sort === "rating") {
      clone.sort((a, b) => b.rating - a.rating);
      return clone;
    }
    // price sorting using first service "Starting From XX EUR"
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
    setPage(1);
  }, []);

  return {
    filters,
    setFilters,
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

