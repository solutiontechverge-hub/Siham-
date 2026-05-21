"use client";

import * as React from "react";
import { getUnreadFromProfessionalCount, MESSAGING_UPDATED_EVENT } from "./messagingUnread";
import { loadMessagingStore } from "./messagingStorage";

export function useClientMessagingUnread(bookingRef?: string) {
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback(() => {
    const store = loadMessagingStore();
    setCount(getUnreadFromProfessionalCount(store, { bookingRef }));
  }, [bookingRef]);

  React.useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  return count;
}
