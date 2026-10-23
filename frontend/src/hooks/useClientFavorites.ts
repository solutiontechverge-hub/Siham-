"use client";

import * as React from "react";
import {
  useGetFavoritesQuery,
  useToggleFavoriteMutation,
} from "../store/services/favoritesApi";
import { useAppSelector } from "../store/hooks";

const STORAGE_KEY = "mollure:favorites";

function readLocalFavorites(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeLocalFavorites(next: Record<string, boolean>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function idsToRecord(ids: string[]): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [id, true]));
}

/** Shared favourites state: API when signed in, localStorage as cache/offline fallback. */
export function useClientFavorites() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isAuthed = Boolean(accessToken);
  const { data, isLoading } = useGetFavoritesQuery(undefined, {
    skip: !isAuthed,
  });
  const [toggleFavoriteMutation] = useToggleFavoriteMutation();

  const [favorites, setFavorites] = React.useState<Record<string, boolean>>(
    () => readLocalFavorites(),
  );

  React.useEffect(() => {
    if (!isAuthed) {
      setFavorites(readLocalFavorites());
      return;
    }
    const ids = data?.data?.businessSetupIds;
    if (!ids) return;
    const next = idsToRecord(ids);
    setFavorites(next);
    writeLocalFavorites(next);
  }, [isAuthed, data?.data?.businessSetupIds]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(readLocalFavorites());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleFavorite = React.useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        if (!next[id]) delete next[id];
        writeLocalFavorites(next);
        return next;
      });

      if (isAuthed) {
        void toggleFavoriteMutation(id);
      }
    },
    [isAuthed, toggleFavoriteMutation],
  );

  return {
    favorites,
    toggleFavorite,
    isLoading: isAuthed && isLoading,
  };
}
