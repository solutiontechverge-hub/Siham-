"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { favouritesPageData } from "./favourites.data";
import { useListingCards } from "../listing/use-listing-cards";
import { useClientFavorites } from "../../../hooks/useClientFavorites";
import { useAppSelector } from "../../../store/hooks";
import {
  useGetProfileQuery,
  type CompanyProfile,
  type IndividualProfile,
} from "../../../store/services/profileApi";

export function useFavouritesTokens() {
  return useTheme().palette.mollure;
}

export function useClientFavouritesPage() {
  const tokens = useFavouritesTokens();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } =
    useClientFavorites();
  const [page, setPage] = React.useState(1);
  const user = useAppSelector((s) => s.auth.user);
  const { data: profileEnvelope } = useGetProfileQuery(undefined, {
    skip: !user,
  });
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
    const profile = profileEnvelope?.data;
    if (!profile) {
      const next = fallbackDisplayName.trim();
      if (next) setUserName(next);
      return;
    }
    if (profile.user_type === "company") {
      const company = profile.profile as CompanyProfile | null;
      const name =
        (company?.legal_name ?? "").trim() ||
        `${company?.contact_first_name ?? ""} ${company?.contact_last_name ?? ""}`.trim();
      if (name) setUserName(name);
      if (company?.logo) setAvatarUrl(company.logo);
      return;
    }
    if (profile.user_type === "individual") {
      const individual = profile.profile as IndividualProfile | null;
      const name =
        (individual?.display_name ?? "").trim() ||
        `${individual?.first_name ?? ""} ${individual?.last_name ?? ""}`.trim();
      if (name) setUserName(name);
      if (individual?.profile_picture) setAvatarUrl(individual.profile_picture);
    }
  }, [fallbackDisplayName, profileEnvelope?.data]);

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
