"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { favouritesPageData } from "./favourites.data";
import { useListingCards } from "../listing/use-listing-cards";
import { useClientFavorites } from "../../../hooks/useClientFavorites";
import { useAppSelector } from "../../../store/hooks";
import { CLIENT_PROFILE_KEY } from "../../../lib/auth-storage";

export function useFavouritesTokens() {
  return useTheme().palette.mollure;
}

export function useClientFavouritesPage() {
  const tokens = useFavouritesTokens();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } =
    useClientFavorites();
  const [page, setPage] = React.useState(1);
  const user = useAppSelector((s) => s.auth.user);
  const fallbackDisplayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();
  const [userName, setUserName] = React.useState<string>(fallbackDisplayName);
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  const { cards: listingCards, isLoading: cardsLoading } = useListingCards();
  const allItems = listingCards.filter((c) => Boolean(favorites[c.id]));

  const pageSize = favouritesPageData.pagination.pageSize;
  const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLIENT_PROFILE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        avatar_url?: string | null;
        email?: string;
        first_name?: string;
        last_name?: string;
        display_name?: string;
      };
      const authedEmail = user?.email?.trim().toLowerCase();
      const persistedEmail = data?.email?.trim().toLowerCase();
      if (authedEmail && persistedEmail && authedEmail === persistedEmail) {
        if (typeof data.avatar_url === "string" && data.avatar_url)
          setAvatarUrl(data.avatar_url);
        const persistedName = (data.display_name ?? "").trim();
        const fullName =
          `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
        const resolved = persistedName || fullName;
        if (resolved) setUserName(resolved);
      }
    } catch {
      // ignore
    }
  }, [user?.email]);

  React.useEffect(() => {
    const next = fallbackDisplayName.trim();
    if (next) setUserName(next);
  }, [fallbackDisplayName]);

  const items = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return allItems.slice(start, start + pageSize);
  }, [allItems, page, pageSize]);

  const rangeLabel =
    allItems.length === 0
      ? "0"
      : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, allItems.length)}`;

  const handleToggleFavorite = React.useCallback(
    (id: string) => {
      const wasFavorite = Boolean(favorites[id]);
      toggleFavorite(id);
      if (wasFavorite) setSnackbarOpen(true);
    },
    [favorites, toggleFavorite],
  );

  return {
    tokens,
    user,
    userName,
    avatarUrl,
    favorites,
    toggleFavorite: handleToggleFavorite,
    items,
    page,
    setPage,
    totalPages,
    totalCount: allItems.length,
    rangeLabel,
    isLoading: cardsLoading || favoritesLoading,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage: favouritesPageData.snackbarRemovedMessage,
  };
}
