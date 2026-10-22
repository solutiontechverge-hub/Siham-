"use client";

import * as React from "react";
import { useAppDispatch } from "../store/hooks";
import { businessApi } from "../store/services/businessApi";
import { financeApi } from "../store/services/financeApi";
import {
  joinPublicListingRoom,
  onBusinessChanged,
  type BusinessChangedPayload,
} from "../lib/businessSocketClient";

const INVALIDATE_DEBOUNCE_MS = 250;

export function useBusinessRealtimeSync() {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    joinPublicListingRoom();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingScopes = new Set<string>();

    const flush = () => {
      timeoutId = null;
      const scopes = pendingScopes;
      pendingScopes = new Set();

      const tags: Array<"BusinessSetupsListing" | "Calendar"> = [];
      if (
        scopes.has("listing") ||
        scopes.has("calendar") ||
        scopes.size === 0
      ) {
        tags.push("BusinessSetupsListing", "Calendar");
      }
      if (tags.length) {
        dispatch(businessApi.util.invalidateTags(tags));
      }
      if (scopes.has("finance") || scopes.size === 0) {
        dispatch(
          financeApi.util.invalidateTags([
            "FinanceSettings",
            "FinanceTransactions",
            "Bookings",
          ]),
        );
      }
    };

    const handleChanged = (payload: BusinessChangedPayload) => {
      pendingScopes.add(payload?.scope || "listing");
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(flush, INVALIDATE_DEBOUNCE_MS);
    };

    const unsubscribe = onBusinessChanged(handleChanged);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [dispatch]);
}
