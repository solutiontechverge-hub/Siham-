"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { listingPageData } from "../listing/listing.data";
import { favouritesPageData } from "./data-favourites";

export function useFavouritesTokens() {
  return useTheme().palette.mollure;
}

function readFavorites(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("mollure:favorites");
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useClientFavouritesPage() {
  const tokens = useFavouritesTokens();
  const [favorites, setFavorites] = React.useState<Record<string, boolean>>(() =>
    readFavorites(),
  );
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mollure:favorites") setFavorites(readFavorites());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const allItems = listingPageData.cards.filter((c) => Boolean(favorites[c.id]));

  const pageSize = favouritesPageData.pagination.pageSize;
  const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const items = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return allItems.slice(start, start + pageSize);
  }, [allItems, page, pageSize]);

  const toggleFavorite = React.useCallback((id: string) => {
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem("mollure:favorites", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const rangeLabel =
    allItems.length === 0
      ? "0"
      : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, allItems.length)}`;

  return {
    tokens,
    favorites,
    toggleFavorite,
    items,
    page,
    setPage,
    totalPages,
    totalCount: allItems.length,
    rangeLabel,
  };
}

