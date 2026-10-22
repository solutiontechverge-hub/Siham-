"use client";

import * as React from "react";
import {
  useGetFavoritesQuery,
  useToggleFavoriteMutation,
} from "../store/services/favoritesApi";
import { useAppSelector } from "../store/hooks";

function idsToRecord(ids: string[]): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [id, true]));
}

/** Favourites from GET/POST /api/user/favorites (no localStorage). */
export function useClientFavorites() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isAuthed = Boolean(accessToken);
  const { data, isLoading } = useGetFavoritesQuery(undefined, {
    skip: !isAuthed,
  });
  const [toggleFavoriteMutation] = useToggleFavoriteMutation();

  const [favorites, setFavorites] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!isAuthed) {
      setFavorites({});
      return;
    }
    const ids = data?.data?.businessSetupIds;
    if (!ids) return;
    setFavorites(idsToRecord(ids));
  }, [isAuthed, data?.data?.businessSetupIds]);

  const toggleFavorite = React.useCallback(
    (id: string) => {
      if (!isAuthed) return;
      setFavorites((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        if (!next[id]) delete next[id];
        return next;
      });
      void toggleFavoriteMutation(id);
    },
    [isAuthed, toggleFavoriteMutation],
  );

  return {
    favorites,
    toggleFavorite,
    isLoading: isAuthed && isLoading,
  };
}
