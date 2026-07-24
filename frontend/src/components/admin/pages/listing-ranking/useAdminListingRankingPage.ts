"use client";

import * as React from "react";
import type { RankingFactor } from "../../adminMockData";
import {
  LIVE_FACTORS_BY_ID,
  liveRankingFactors,
  reorderIds,
} from "./listing-ranking.data";

export function useAdminListingRankingPage() {
  const [orderedIds, setOrderedIds] = React.useState(
    liveRankingFactors.map((f) => f.id),
  );
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const factors = orderedIds
    .map((id) => LIVE_FACTORS_BY_ID[id])
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
