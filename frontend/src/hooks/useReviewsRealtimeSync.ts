"use client";

import * as React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { reviewsApi } from "../store/services/reviewsApi";
import { getPersistedAuthSession } from "../lib/auth-storage";
import {
  ensureReviewRealtimeRooms,
  onReviewChanged,
  type ReviewChangedPayload,
} from "../lib/reviewSocketClient";

type Options = {
  businessSetupId?: string;
};

export function useReviewsRealtimeSync(options?: Options) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [persistedToken, setPersistedToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPersistedToken(getPersistedAuthSession()?.accessToken ?? null);
  }, [accessToken]);

  const isAuthed = Boolean(accessToken || persistedToken);
  const userId = user?.id ?? "";
  const businessSetupId = options?.businessSetupId ?? "";

  React.useEffect(() => {
    if (!isAuthed) return;
    ensureReviewRealtimeRooms({
      userId: userId || undefined,
      businessSetupId: businessSetupId || undefined,
    });
  }, [businessSetupId, isAuthed, userId]);

  React.useEffect(() => {
    if (!isAuthed) return;
    return onReviewChanged((_payload: ReviewChangedPayload) => {
      dispatch(reviewsApi.util.invalidateTags(["Reviews", "BusinessSetupsListing"]));
    });
  }, [dispatch, isAuthed]);
}
