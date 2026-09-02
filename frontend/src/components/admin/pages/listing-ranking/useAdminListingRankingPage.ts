"use client";

import * as React from "react";
import type { RankingFactor } from "../../adminMockData";
import { useGetAdminListingRankingQuery } from "../../../../store/services/adminApi";
import { reorderIds } from "./listing-ranking.data";

export function useAdminListingRankingPage() {
  const { data } = useGetAdminListingRankingQuery();
  const liveFactors = (data?.data?.factors ?? []) as RankingFactor[];

  const [orderedIds, setOrderedIds] = React.useState<string[]>([]);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!liveFactors.length) return;
    setOrderedIds((prev) => {
      if (prev.length === liveFactors.length && prev.every((id) => liveFactors.some((f) => f.id === id))) {
        return prev;
      }
      return liveFactors.map((f) => f.id);
    });
  }, [liveFactors]);

  const byId = React.useMemo(
    () => Object.fromEntries(liveFactors.map((f) => [f.id, f])),
    [liveFactors],
  );

  const factors = orderedIds
    .map((id) => byId[id])
    .filter((f): f is RankingFactor => Boolean(f));

  const total = factors.reduce((sum, f) => sum + f.weight, 0);

  const handleDrop = (targetIndex: number) => {
    if (!draggingId) return;
    const from = orderedIds.indexOf(draggingId);
    if (from < 0 || from === targetIndex) return;
    setOrderedIds((prev) => reorderIds(prev, from, targetIndex));
    setDraggingId(null);
  };

  return {
    orderedIds,
    draggingId,
    setDraggingId,
    factors,
    total,
    handleDrop,
  };
}
