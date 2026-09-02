"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { favouritesPageData } from "./favourites.data";
import { useListingCards } from "../listing/use-listing-cards";
import { useClientFavorites } from "../../../hooks/useClientFavorites";

export function useFavouritesTokens() {
  return useTheme().palette.mollure;
}

export function useClientFavouritesPage() {
  const tokens = useFavouritesTokens();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } =
    useClientFavorites();
  const [page, setPage] = React.useState(1);

  const { cards: listingCards, isLoading: cardsLoading } = useListingCards();
  const allItems = listingCards.filter((c) => Boolean(favorites[c.id]));

  const pageSize = favouritesPageData.pagination.pageSize;
  const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const items = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return allItems.slice(start, start + pageSize);
  }, [allItems, page, pageSize]);

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
    isLoading: cardsLoading || favoritesLoading,
  };
}
