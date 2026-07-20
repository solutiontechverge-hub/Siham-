"use client";

import * as React from "react";
import { getMessagingSocket } from "../components/common/messaging/messagingSocketClient";
import { notificationsApi } from "../store/services/notificationsApi";
import { useAppDispatch } from "../store/hooks";

export function useNotificationsRealtimeSync() {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    const client = getMessagingSocket();
    if (!client) return;

    const invalidate = () => {
      dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
    };

    client.on("notifications:changed", invalidate);
    return () => {
      client.off("notifications:changed", invalidate);
    };
  }, [dispatch]);
}
