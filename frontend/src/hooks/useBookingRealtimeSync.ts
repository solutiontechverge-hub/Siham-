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
  businessSetupIds?: readonly string[];
  /** Called after Calendar/Bookings tags are invalidated (e.g. calendar overview refetch). */
  onChanged?: (payload: BookingChangedPayload) => void;
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
  const businessSetupIds = options?.businessSetupIds;
  const onChangedRef = React.useRef(options?.onChanged);
  onChangedRef.current = options?.onChanged;

  React.useEffect(() => {
    if (!isAuthed) return;
    ensureBookingRealtimeRooms({
      userId: userId || undefined,
      businessSetupId: businessSetupId || undefined,
      businessSetupIds,
    });
  }, [businessSetupId, businessSetupIds, isAuthed, userId]);

  React.useEffect(() => {
    if (!isAuthed) return;

    const handleBookingChanged = (payload: BookingChangedPayload) => {
      dispatch(businessApi.util.invalidateTags(["Calendar", "Bookings"]));
      void dispatch(
        businessApi.endpoints.getMyBookings.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        }),
      );
      onChangedRef.current?.(payload);
    };

    return onBookingChanged(handleBookingChanged);
  }, [dispatch, isAuthed]);
}
