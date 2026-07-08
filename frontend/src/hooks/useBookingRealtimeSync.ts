"use client";

import * as React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { businessApi } from "../store/services/businessApi";
import { getPersistedAuthSession } from "../lib/auth-storage";
import {
  ensureBookingRealtimeRooms,
  onBookingChanged,
  type BookingChangedPayload,
} from "../lib/bookingSocketClient";

type Options = {
  businessSetupId?: string;
};

export function useBookingRealtimeSync(options?: Options) {
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
    ensureBookingRealtimeRooms({
      userId: userId || undefined,
      businessSetupId: businessSetupId || undefined,
    });
  }, [businessSetupId, isAuthed, userId]);

  React.useEffect(() => {
    if (!isAuthed) return;

    const handleBookingChanged = (payload: BookingChangedPayload) => {
      if (businessSetupId && payload.business_setup_id !== businessSetupId) return;
      dispatch(businessApi.util.invalidateTags(["Calendar", "Bookings"]));
    };

    return onBookingChanged(handleBookingChanged);
  }, [businessSetupId, dispatch, isAuthed]);
}
